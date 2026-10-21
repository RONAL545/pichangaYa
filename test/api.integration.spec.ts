import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DataSource } from 'typeorm';

const dbTest = process.env.RUN_DB_TESTS === '1' ? describe : describe.skip;
dbTest('API with real PostGIS (dedicated test database)', () => {
  let app: NestFastifyApplication;
  let ds: DataSource;
  let userId: string, courtId: string, secondCourtId: string;
  const users: string[] = [], venues: string[] = [], courts: string[] = [];
  async function create(url: string, payload: object) {
    const response = await app.inject({ method: 'POST', url, payload });
    expect(response.statusCode).toBe(201);
    return response.json();
  }
  beforeAll(async () => {
    const { createApp } = await import('../src/bootstrap');
    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    ds = app.get(DataSource);
    await ds.runMigrations();
    for (let i = 0; i < 2; i++) {
      const user = await create('/users', { name: 'Test user', email: `${randomUUID()}@example.com` });
      users.push(user.id);
    }
    userId = users[0];
    const venue = await create('/venues', { name: 'Juliaca', address: 'Test address', latitude: -15.4997, longitude: -70.1333 });
    venues.push(venue.id);
    const farVenue = await create('/venues', { name: 'Lima', address: 'Test address', latitude: -12.0464, longitude: -77.0428 });
    venues.push(farVenue.id);
    for (const venueId of [venue.id, venue.id, farVenue.id]) {
      const court = await create('/courts', { name: 'Test court', venueId });
      courts.push(court.id);
    }
    [courtId, secondCourtId] = courts;
  }, 30000);
  afterAll(async () => {
    if (ds?.isInitialized) {
      await ds.query('DELETE FROM bookings WHERE court_id = ANY($1::uuid[])', [courts]);
      await ds.query('DELETE FROM courts WHERE id = ANY($1::uuid[])', [courts]);
      await ds.query('DELETE FROM venues WHERE id = ANY($1::uuid[])', [venues]);
      await ds.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [users]);
    }
    await app?.close();
  });
  const interval = { startsAt: '2026-11-01T10:00:00-05:00', endsAt: '2026-11-01T11:00:00-05:00' };
  it('accepts exactly one simultaneous reservation and returns 409 for the other', async () => {
    const results = await Promise.all(users.map(id => app.inject({ method: 'POST', url: '/bookings', payload: { courtId, userId: id, ...interval } })));
    expect(results.map(r => r.statusCode).sort()).toEqual([201, 409]);
  });
  it('allows touching boundaries and another court', async () => {
    await create('/bookings', { courtId, userId, startsAt: interval.endsAt, endsAt: '2026-11-01T12:00:00-05:00' });
    await create('/bookings', { courtId: secondCourtId, userId, ...interval });
  });
  it('rejects partial overlaps and enclosing intervals', async () => {
    for (const [startsAt, endsAt] of [['09:30', '10:30'], ['10:15', '10:45'], ['09:00', '13:00']]) {
      const r = await app.inject({ method: 'POST', url: '/bookings', payload: { courtId, userId, startsAt: `2026-11-01T${startsAt}:00-05:00`, endsAt: `2026-11-01T${endsAt}:00-05:00` } });
      expect(r.statusCode).toBe(409);
    }
  });
  it('computes free intervals clipped to the requested window', async () => {
    const q = new URLSearchParams({ startsAt: '2026-11-01T09:00:00-05:00', endsAt: '2026-11-01T13:00:00-05:00' });
    const r = await app.inject(`/courts/${courtId}/availability?${q}`);
    expect(r.statusCode).toBe(200);
    expect(r.json()).toEqual({ courtId, available: false, freeIntervals: [
      { startsAt: '2026-11-01T14:00:00.000Z', endsAt: '2026-11-01T15:00:00.000Z' },
      { startsAt: '2026-11-01T17:00:00.000Z', endsAt: '2026-11-01T18:00:00.000Z' },
    ] });
    const clipped = await app.inject(`/courts/${courtId}/availability?${new URLSearchParams(interval)}`);
    expect(clipped.json().freeIntervals).toEqual([]);
  });
  it('searches in meters, excludes distant courts and orders by distance', async () => {
    const r = await app.inject('/courts/nearby?latitude=-15.4997&longitude=-70.1333&radiusMeters=1000');
    expect(r.statusCode).toBe(200);
    const rows = r.json() as { id: string; distanceMeters: number }[];
    expect(rows.map(row => row.id)).toEqual(expect.arrayContaining([courtId, secondCourtId]));
    expect(rows.map(row => row.id)).not.toContain(courts[2]);
    expect(rows.find(row => row.id === courtId)?.distanceMeters).toBeLessThan(1);
    expect(rows.map(row => row.distanceMeters)).toEqual(rows.map(row => row.distanceMeters).sort((a, b) => a - b));
  });
  it('validates UUIDs, coordinates, interval order and missing resources', async () => {
    expect((await app.inject('/courts/nearby?latitude=95&longitude=0&radiusMeters=100')).statusCode).toBe(400);
    expect((await app.inject('/courts/nearby?latitude=0&longitude=0&radiusMeters=0')).statusCode).toBe(400);
    expect((await app.inject(`/courts/invalid/availability?${new URLSearchParams(interval)}`)).statusCode).toBe(400);
    expect((await app.inject(`/courts/${randomUUID()}/availability?${new URLSearchParams(interval)}`)).statusCode).toBe(404);
    expect((await app.inject({ method: 'POST', url: '/bookings', payload: { courtId, userId, startsAt: interval.endsAt, endsAt: interval.startsAt } })).statusCode).toBe(400);
    expect((await app.inject({ method: 'POST', url: '/bookings', payload: { courtId: randomUUID(), userId, ...interval } })).statusCode).toBe(404);
  });
});
