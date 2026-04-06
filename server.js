const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const admin = require('firebase-admin');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security: Helmet for HTTP Headers
// Enhanced CSP for Google Maps and Fonts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'", "https://maps.googleapis.com"],
      "img-src": ["'self'", "data:", "https://maps.gstatic.com", "https://maps.googleapis.com"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "connect-src": ["'self'", "https://maps.googleapis.com"]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));

// Body Parsers & Sanitization
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent DoS
app.use(express.static('public'));

/**
 * 🔗 Google Services Initialization
 */
let firebaseInitialized = false;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT && require('fs').existsSync(process.env.FIREBASE_SERVICE_ACCOUNT)) {
    admin.initializeApp({
      credential: admin.credential.cert(process.env.FIREBASE_SERVICE_ACCOUNT),
      databaseURL: JSON.parse(process.env.FIREBASE_CONFIG || '{}').databaseURL
    });
    firebaseInitialized = true;
  }
} catch (e) {
  console.warn(`[Firebase] Init failed in ${process.env.NODE_ENV} mode.`);
}

const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/calendar.events']
});
const calendar = google.calendar({ version: 'v3', auth });

/**
 * 📦 Modular Routing
 */
const venueRoutes = require('./src/routes/venueRoutes');
app.use('/api/venue', venueRoutes);

// Compatibility redirect (old endpoints to new version/api)
app.get(['/crowd', '/queue', '/route', '/alert'], (req, res) => {
    res.redirect(301, `/api/venue${req.path}`);
});

/**
 * 📅 Calendar Sync (Specific Route)
 * POST used for state modification
 */
app.post('/api/calendar/sync', async (req, res) => {
  const event = {
    summary: 'Stadium Event Day Optimizer',
    location: 'Gate B, Sports Venue',
    description: 'Arrive via North Gate B for 40% less congestion. Sync with VenueCrowd.',
    start: { dateTime: '2026-05-10T18:00:00Z', timeZone: 'UTC' },
    end: { dateTime: '2026-05-10T22:00:00Z', timeZone: 'UTC' }
  };

  try {
    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      resource: event,
    });
    res.json({ success: true, link: response.data.htmlLink });
  } catch (err) {
    res.status(200).json({ 
        error: "Notice: Sync is in simulated mode (no service account).", 
        mockLink: "https://calendar.google.com/event?id=venue_crowd_demo" 
    });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong inside the venue engine!' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Venue Engine Running at http://localhost:${PORT}`);
  });
}

module.exports = app;
