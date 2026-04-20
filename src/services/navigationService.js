const { networkGraph, zones } = require('../data/venueData');
const googleService = require('./googleService');
const NodeCache = require('node-cache');
const routeCache = new NodeCache({ stdTTL: 300 });

/**
 * Navigation Service
 * Enhanced with Directions Polyline and AI routing insights.
 */
class NavigationService {

  // Weight = 1 (base distance/hop) + (density / 10)
  getZoneCost(zoneId) {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return 1000;
    return 1 + (zone.density / 10);
  }

  /**
   * findSmartPath: Implements Dijkstra's Algorithm for weighted crowd-aware routing.
   * Ensures the suggested route is truly optimized for low-density paths.
   */
  findSmartPath(startId, endId) {
    const cacheKey = `${startId}_to_${endId}`;
    const cached = routeCache.get(cacheKey);
    if (cached) return { ...cached, status: 'cached' };

    // Initialize Dijkstra
    const distances = {};
    const previous = {};
    const nodes = new Set();

    for (const zoneId in networkGraph) {
      distances[zoneId] = Infinity;
      previous[zoneId] = null;
      nodes.add(zoneId);
    }
    // Start node setup
    distances[startId] = 0;

    while (nodes.size > 0) {
      // Find node with minimum distance
      let closestNode = null;
      for (const node of nodes) {
        if (closestNode === null || distances[node] < distances[closestNode]) {
          closestNode = node;
        }
      }

      if (distances[closestNode] === Infinity || closestNode === endId) {
        break;
      }

      nodes.delete(closestNode);

      const neighbors = networkGraph[closestNode] || [];
      for (const neighbor of neighbors) {
        const cost = this.getZoneCost(neighbor);
        const alt = distances[closestNode] + cost;

        if (alt < distances[neighbor]) {
          distances[neighbor] = alt;
          previous[neighbor] = closestNode;
        }
      }
    }

    // Reconstruction
    const path = [];
    let current = endId;
    while (current) {
      path.unshift(current);
      current = previous[current];
    }

    if (path[0] !== startId) return null;

    // Enrich with Google Services Logic
    const mapEnrichment = googleService.generatePathPolyline(path);
    const pathZones = path.map(id => zones.find(z => z.id === id));
    const totalCost = path.reduce((acc, zid) => acc + this.getZoneCost(zid), 0);

    const result = {
      pathIds: path,
      zones: pathZones,
      cost: parseFloat(totalCost.toFixed(2)),
      maps_data: mapEnrichment,
      benefit: totalCost > path.length * 2 ? "High density detected, routing through clearer paths." : "Optimal direct path found.",
      type: 'Weighted Optimality'
    };

    googleService.logEvent('INFO', 'Smart Dijkstra Path Generated', { from: startId, to: endId, cost: totalCost });
    routeCache.set(cacheKey, result);
    return result;
  }
}

module.exports = new NavigationService();
