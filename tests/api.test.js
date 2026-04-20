const request = require('supertest');
const app = require('../server');

describe('VenueCrowd API v2.1 Endpoints', () => {

  test('GET /api/venue/crowd should return status 200 and all zones', async () => {
    const res = await request(app).get('/api/venue/crowd');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('density');
    expect(res.body[0]).toHaveProperty('status');
  });

  test('GET /api/venue/queue should return wait time predictions', async () => {
    const res = await request(app).get('/api/venue/queue');
    expect(res.statusCode).toEqual(200);
    expect(res.body[0]).toHaveProperty('estimatedWait');
  });

  test('GET /api/venue/route with valid params should return weighted path', async () => {
    const res = await request(app).get('/api/venue/route?from=gate_a&to=seating_zone_1');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('pathIds');
    expect(res.body).toHaveProperty('cost');
    expect(res.body).toHaveProperty('maps_data');
    expect(res.body.type).toBe('Weighted Optimality');
  });

  test('GET /api/venue/route should return 400 for missing params', async () => {
    const res = await request(app).get('/api/venue/route?from=gate_a');
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('errors');
  });

  test('GET /api/venue/route should return 404 for invalid zones', async () => {
    const res = await request(app).get('/api/venue/route?from=invalid&to=seating_zone_1');
    expect(res.statusCode).toEqual(404);
  });

  test('GET /api/venue/alert should return mock alert data', async () => {
    const res = await request(app).get('/api/venue/alert');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('Alert Sent');
    expect(res.body.alert).toHaveProperty('title');
  });

  test('POST /api/venue/admin/density should update live state', async () => {
    const res = await request(app)
      .post('/api/venue/admin/density')
      .send({ zoneId: 'gate_b', density: 10 });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.updatedZone.density).toEqual(10);
  });

  test('POST /api/venue/admin/density should fail with out-of-range density', async () => {
    const res = await request(app)
      .post('/api/venue/admin/density')
      .send({ zoneId: 'gate_b', density: 150 });
    
    expect(res.statusCode).toEqual(400);
  });

});
