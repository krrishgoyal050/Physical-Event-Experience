const { zones } = require('../data/venueData');

/**
 * Queue Service
 * Improved weight logic for wait-time predictions in venue zones.
 */
class QueueService {

  // Calculate prediction (baseWait minutes + density factor)
  calculateWait(zoneId) {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return 0;

    // Weight: 0-10 based, 2 min per 10% density
    // Example: Food Court baseWait (15) + (95/10) * 2 ≈ 34 mins
    const densityPenalty = (zone.density / 10) * 2;
    const finalWait = Math.round(zone.baseWait + densityPenalty);

    return {
      id: zone.id,
      name: zone.name,
      estimatedWait: finalWait,
      unit: 'min',
      status: this.getStatus(finalWait)
    };
  }

  getStatus(totalWait) {
    if (totalWait > 25) return 'Heavy';
    if (totalWait > 10) return 'Moderate';
    return 'Low';
  }

  getPredictionReport() {
    return zones.map(z => this.calculateWait(z.id));
  }
}

module.exports = new QueueService();
