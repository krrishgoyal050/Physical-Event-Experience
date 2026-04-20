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
 * @route GET /api/venue/crowd
 * @description Returns the current density and status of all venue zones.
 * @returns {Array} Array of zone objects containing id, name, density, and status.
 */
router.get('/crowd', apiLimiter, (req, res, next) => {
  try {
    const report = zones.map(z => ({
      id: z.id,
      name: z.name,
      density: z.density,
      status: z.density > 80 ? 'High' : (z.density > 40 ? 'Medium' : 'Low')
    }));
    res.json(report);
  } catch (err) {
    next(err);
  }
});

/**
 * @route GET /api/venue/queue
 * @description Provides a prediction report for wait times across different zones.
 * @returns {Array} Array of queue predictions per zone.
 */
router.get('/queue', apiLimiter, (req, res, next) => {
  try {
    const report = queueService.getPredictionReport();
    res.json(report);
  } catch (err) {
    next(err);
  }
});

/**
 * @route GET /api/venue/route
 * @description Calculates the smartest path from one zone to another avoiding high congestion.
 * @param {string} from - Starting zone ID.
 * @param {string} to - Destination zone ID.
 * @returns {Object} Route result containing path, cost, and Google Maps path polyline data.
 */
router.get('/route', 
  apiLimiter,
  query('from').isString().notEmpty().escape(),
  query('to').isString().notEmpty().escape(),
  validate,
  (req, res, next) => {
    try {
      const { from, to } = req.query;
      const result = navService.findSmartPath(from, to);
      
      if (!result) {
         return res.status(404).json({ error: "Path not found for specified zones." });
      }
      res.json(result);
    } catch (err) {
      next(err);
    }
});

/**
 * @route GET /api/venue/assistant
 * @description Passes a natural language query to an AI assistant to get spatial reasoning and advice.
 * @param {string} q - Natural language question.
 * @returns {Object} AI assistant response text.
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
        next(err);
    }
});

/**
 * @route GET /api/venue/alert
 * @description Simulates a broadcasted administrative alert for congestion management.
 * @returns {Object} Static alert payload simulating Firebase Cloud Messaging.
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
 * @route POST /api/venue/admin/density
 * @description Updates the density rating for a specific zone. Simulates admin dashboards.
 * @param {string} zoneId - ID of the zone to update.
 * @param {number} density - New density percentage (0-100).
 * @returns {Object} Success flag and updated zone information.
 */
router.post('/admin/density',
  body('zoneId').isString().notEmpty().escape(),
  body('density').isNumeric().isInt({ min: 0, max: 100 }),
  validate,
  (req, res, next) => {
    try {
      const { zoneId, density } = req.body;
      const zone = zones.find(z => z.id === zoneId);
      if (!zone) return res.status(404).json({ error: "Zone not found" });
      
      // Update live memory (In real world: Redis/Firebase/Postgres)
      zone.density = Number(density);
      res.json({ success: true, updatedZone: zone });
    } catch (err) {
      next(err);
    }
});

module.exports = router;
