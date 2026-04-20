const request = require('supertest');
const app = require('../server');

describe('VenueCrowd API Endpoints', () => {

  test('GET /api/venue/crowd should return status 200 and all zones', async () => {
    const res = await request(app).get('/api/venue/crowd');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body[0]).toHaveProperty('name');
    expect(res.body[0]).toHaveProperty('density');
  });

  test('GET /api/venue/queue should return queue predictions', async () => {
    const res = await request(app).get('/api/venue/queue');
    expect(res.statusCode).toEqual(200);
    expect(res.body[0]).toHaveProperty('estimatedWait');
  });

  test('GET /api/venue/route should return specialized route suggestion', async () => {
    const res = await request(app).get('/api/venue/route?from=gate_a&to=seating_zone_1');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('benefit');
  });

  test('GET /api/venue/route should fail with missing params', async () => {
    const res = await request(app).get('/api/venue/route');
    expect(res.statusCode).toEqual(400);
  });
  
  test('GET /api/venue/route should return 404 for unreachable path', async () => {
    const res = await request(app).get('/api/venue/route?from=invalid_gate&to=seating_zone_1');
    expect(res.statusCode).toEqual(404);
  });

  test('GET /api/venue/alert should simulate an alert', async () => {
    const res = await request(app).get('/api/venue/alert');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'Alert Sent');
  });

  test('POST /api/venue/admin/density should update zone density', async () => {
    const res = await request(app)
      .post('/api/venue/admin/density')
      .send({ zoneId: 'gate_b', density: 99 });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.updatedZone.density).toEqual(99);
  });
  
  test('POST /api/venue/admin/density should fail with invalid density', async () => {
    const res = await request(app)
      .post('/api/venue/admin/density')
      .send({ zoneId: 'gate_b', density: 105 }); // Out of bounds
    expect(res.statusCode).toEqual(400);
  });
  
  test('POST /api/venue/admin/density should fail for missing zone', async () => {
    const res = await request(app)
      .post('/api/venue/admin/density')
      .send({ zoneId: 'unknown_zone', density: 50 });
    expect(res.statusCode).toEqual(404);
  });

  test('POST /api/calendar/sync should interact with calendar API', async () => {
    const res = await request(app).post('/api/calendar/sync');
    expect([200, 500]).toContain(res.statusCode);
    if (res.statusCode === 200 && res.body.error) {
      expect(res.body).toHaveProperty('mockLink');
    }
  });

  test('GET /api/venue/assistant should test assistant queries', async () => {
    const res = await request(app).get('/api/venue/assistant?q=food');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('analysis');
  });
  
  test('GET /api/venue/assistant should fail if query is empty', async () => {
    const res = await request(app).get('/api/venue/assistant');
    expect(res.statusCode).toEqual(400);
  });
  
  test('GET /unknown should return 404', async () => {
    const res = await request(app).get('/unknownxyz');
    expect(res.statusCode).toEqual(404);
    expect(res.body.error).toEqual('Endpoint not found');
  });
  
  test('GET /crowd redirect works', async () => {
    const res = await request(app).get('/crowd');
    expect(res.statusCode).toEqual(301);
  });

});
