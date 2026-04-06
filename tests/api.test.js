const request = require('supertest');
const app = require('../server');

describe('VenueCrowd API Endpoints', () => {

  test('GET /crowd should return status 200 and all zones', async () => {
    const res = await request(app).get('/crowd');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body[0]).toHaveProperty('name');
    expect(res.body[0]).toHaveProperty('density');
  });

  test('GET /queue should return queue predictions', async () => {
    const res = await request(app).get('/queue');
    expect(res.statusCode).toEqual(200);
    expect(res.body[0]).toHaveProperty('estimatedWait');
  });

  test('GET /route should return specialized route suggestion', async () => {
    const res = await request(app).get('/route?from=gate_a&to=seating_zone_1');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('suggestion');
    expect(res.body).toHaveProperty('benefit');
  });

  test('GET /route should fail with missing params', async () => {
    const res = await request(app).get('/route');
    expect(res.statusCode).toEqual(400);
  });

  test('GET /alert should simulate an alert', async () => {
    const res = await request(app).get('/alert');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'Alert Sent');
  });

  test('POST /admin/density should update zone density', async () => {
    const res = await request(app)
      .post('/admin/density')
      .send({ zoneId: 'gate_b', density: 99 });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.zone.density).toEqual(99);
  });

  test('POST /calendar/sync should interact with calendar API', async () => {
    const res = await request(app).post('/calendar/sync');
    // It might fail on 500 if NO keys, but it should still return structured error
    expect([200, 500]).toContain(res.statusCode);
    if (res.statusCode === 500) {
      expect(res.body).toHaveProperty('mockLink');
    }
  });

});
