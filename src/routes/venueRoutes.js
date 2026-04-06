const express = require('express');
const router = express.Router();
const { query, body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Services
const navService = require('../services/navigationService');
const queueService = require('../services/queueService');
const googleService = require('../services/googleService');
const { zones } = require('../data/venueData');

// Security: Rate Limit for API endpoints (100 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});

// Middleware for validation error handling
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * 1. Crowd Status API
 */
router.get('/crowd', apiLimiter, (req, res) => {
  try {
    const report = zones.map(z => ({
      id: z.id,
      name: z.name,
      density: z.density,
      status: z.density > 80 ? 'High' : (z.density > 40 ? 'Medium' : 'Low')
    }));
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: "Internal server error fetching crowd data" });
  }
});

/**
 * 2. Queue Prediction API
 */
router.get('/queue', apiLimiter, (req, res) => {
  try {
    const report = queueService.getPredictionReport();
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: "Internal server error fetching queue prediction" });
  }
});

/**
 * 3. Smart Route Suggestion API
 * Validated inputs to prevent XSS/Injection
 */
router.get('/route', 
  apiLimiter,
  query('from').isString().notEmpty().escape(),
  query('to').isString().notEmpty().escape(),
  validate,
  (req, res) => {
    const { from, to } = req.query;
    const result = navService.findSmartPath(from, to);
    
    if (!result) {
       return res.status(404).json({ error: "Path not found for specified zones." });
    }
    
    res.json(result);
});

/**
 * 4. Google Assistant AI: Natural Language Query
 * Uses Gemini API for contextual feedback
 */
router.get('/assistant',
  apiLimiter,
  query('q').isString().notEmpty().escape(),
  validate,
  async (req, res) => {
    try {
        const result = await googleService.analyzeVenueNeeds(req.query.q);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "AI Assistant failed" });
    }
});

/**
 * 4. Alert Simulation API (FCM Mock provided for flexibility)
 */
router.get('/alert', apiLimiter, (req, res) => {
    // Logic for demo/real FCM fallback handled in caller or mock service
    const alert = {
        title: "⚠️ Congestion Update",
        message: "Notice: Food Court is currently at max capacity (95%). Use East Concourse for quick transit.",
        affected: "food_court"
    };
    res.json({ status: "Alert Sent", via: "Service Mock", alert });
});

/**
 * 5. Admin Functionality: Density Update
 */
router.post('/admin/density',
  body('zoneId').isString().notEmpty().escape(),
  body('density').isNumeric().isInt({ min: 0, max: 100 }),
  validate,
  (req, res) => {
    const { zoneId, density } = req.body;
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return res.status(404).json({ error: "Zone not found" });
    
    // Update live memory (In real world: Redis/Firebase/Postgres)
    zone.density = density;
    res.json({ success: true, updatedZone: zone });
});

module.exports = router;
