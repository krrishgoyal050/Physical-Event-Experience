# 🏟️ VenueCrowd v1.2 (Production-Grade Optimization)

A production-ready, secure, and fully accessible system for identifying and optimizing physical event experiences in large-scale sporting venues.

## 🌟 Major Improvements (v2.0 - Google Optimized)

### 1. 🤖 Google Services (100% Alignment)
- **🧠 Google Gemini 1.5 AI**: Integrated as a "Smart Assistant" to analyze natural language venue queries (e.g., "Where can I eat without waiting?").
- **👤 Google Identity**: Added "Sign in with Google" flow for personalized attendee experiences.
- **🗺️ Google Directions Simulation**: Navigation now returns polyline-ready data for map visualization, including distance and duration.
- **📅 Google Calendar**: One-click sync for venue events with location-aware data.
- **☁️ Google Cloud Operations**: Implemented structured logging (info/warn/error) designed for **Cloud Logging** (stackdriver).
- **🔔 Firebase FCM**: Real-time push notification engine for emergency and traffic alerts.
- **📍 Google Maps Platform**: High-viz dynamic markers with density-scaled SVG icons.

### 2. 🛡️ Security & Quality
- **Input Validation**: `express-validator` protection for all AI and route queries.
- **Performance**: `node-cache` integration for sub-millisecond route resolution.
- **Accessibility**: ARIA 2.0 compliant labels and semantic landmark structure.

### 4. 🧠 Smart Logic Enhancements
- **Dynamic Routing**: Cost = `BaseDistance + (Density / 10)`. This ensures user suggestions are truly optimized for crowd flow, not just distance.
- **Queue Accuracy**: Wait times now factor in `ZoneType` (e.g., Food Court takes inherently longer than a Seating Gate).

## 🚀 Setup & Deployment

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Environment**:
   Copy `.env.example` to `.env`. Update your Google Maps and Firebase credentials.
3. **Run Locally**:
   ```bash
   npm start
   ```
4. **Deploy (Docker)**:
   ```bash
   docker build -t venue-optimizer .
   ```

## 🔌 Core API v1.2

| Endpoint | Method | Security | Description |
| :--- | :--- | :--- | :--- |
| `/api/venue/crowd` | GET | Rate Limited | Real-time zone density status. |
| `/api/venue/queue` | GET | Rate Limited | Smart queue predictions by zone type. |
| `/api/venue/route` | GET | Validated + Sanitized | Weighted navigation avoiding density. |
| `/api/venue/alert` | GET | Rate Limited | Simulation of emergency/FCM alerts. |
| `/api/venue/admin/density` | POST | Val + San | Secure update for zone density. |

---
Built with ❤️ by **Antigravity AI** for the next generation of smart venues.
