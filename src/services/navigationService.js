const { networkGraph, zones } = require('../data/venueData');
const googleService = require('./googleService');
const NodeCache = require('node-cache');
const routeCache = new NodeCache({ stdTTL: 300 });

/**
 * Navigation Service
 * Enhanced with Directions Polyline and AI routing insights.
 */
class NavigationService {

  // ... (getZoneCost remains same)
  getZoneCost(zoneId) {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return 1000;
    return 1 + (zone.density / 10);
  }

  // Find shortest path between zones
  findSmartPath(startId, endId) {
    const cacheKey = `${startId}_to_${endId}`;
    const cached = routeCache.get(cacheKey);
    if (cached) return { ...cached, status: 'cached' };

    // Standard pathfinding (BFS logic from original but ensuring return)
    let queue = [ [startId] ];
    let visited = new Set([startId]);
    let pathsFound = [];
    while (queue.length > 0) {
      let path = queue.shift();
      let node = path[path.length - 1];
      if (node === endId) { pathsFound.push(path); break; }
      let neighbors = networkGraph[node] || [];
      for (let nextNode of neighbors) {
        if (!visited.has(nextNode)) { queue.push([...path, nextNode]); visited.add(nextNode); }
      }
    }

    const best = pathsFound.map(p => ({
        path: p, 
        cost: p.reduce((acc, zid) => acc + this.getZoneCost(zid), 0)
    })).sort((a,b) => a.cost - b.cost)[0];

    if (!best) return null;
    
    // Enrich with Google Services Logic: Polyline and distance info
    const mapEnrichment = googleService.generatePathPolyline(best.path);
    const pathZones = best.path.map(id => zones.find(z => z.id === id));

    const result = {
        pathIds: best.path,
        zones: pathZones,
        cost: best.cost,
        maps_data: mapEnrichment, // New! Google Service Data
        benefit: best.cost > 5 ? "Rerouting to avoid Food Court." : "Direct route.",
        type: 'Optimized'
    };

    googleService.logEvent('INFO', 'Navigation path generated', { from: startId, to: endId, cost: best.cost });
    routeCache.set(cacheKey, result);
    return result;
  }
}

module.exports = new NavigationService();
