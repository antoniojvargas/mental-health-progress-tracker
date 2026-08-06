import request from 'supertest';
import { app, createTestUser } from '../helpers/build-app.js';
function validLog(overrides = {}) {
    return {
        logDate: '2026-08-01',
        moodRating: 4,
        anxietyLevel: 3,
        stressLevel: 5,
        sleepHours: 7.5,
        sleepQuality: 4,
        sleepDisturbances: ['frequent_waking'],
        activityType: 'walking',
        activityMinutes: 30,
        socialFrequency: 'occasional',
        symptoms: [{ type: 'fatigue', severity: 2 }],
        notes: 'Buen día',
        ...overrides,
    };
}
describe('daily logs', () => {
    it('rejects unauthenticated requests', async () => {
        const res = await request(app).post('/api/logs').send(validLog());
        expect(res.status).toBe(401);
    });
    it('creates a log on first submission and returns 201', async () => {
        const { cookie } = await createTestUser();
        const res = await request(app).post('/api/logs').set('Cookie', cookie).send(validLog());
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ logDate: '2026-08-01', moodRating: 4, sleepHours: 7.5 });
    });
    it('upserts on a second submission for the same day, returning 200 and a single row', async () => {
        const { cookie } = await createTestUser();
        const first = await request(app).post('/api/logs').set('Cookie', cookie).send(validLog());
        const second = await request(app)
            .post('/api/logs')
            .set('Cookie', cookie)
            .send(validLog({ moodRating: 2, notes: 'Ajustado más tarde' }));
        expect(first.status).toBe(201);
        expect(second.status).toBe(200);
        expect(second.body.id).toBe(first.body.id);
        expect(second.body.moodRating).toBe(2);
        const list = await request(app).get('/api/logs?from=2026-08-01&to=2026-08-01').set('Cookie', cookie);
        expect(list.body.data).toHaveLength(1);
    });
    it('rejects invalid payloads with 400 and validation details', async () => {
        const { cookie } = await createTestUser();
        const res = await request(app)
            .post('/api/logs')
            .set('Cookie', cookie)
            .send(validLog({ moodRating: 99 }));
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
    it('rejects a logDate in the future', async () => {
        const { cookie } = await createTestUser();
        const futureDate = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
        const res = await request(app).post('/api/logs').set('Cookie', cookie).send(validLog({ logDate: futureDate }));
        expect(res.status).toBe(400);
    });
    it('never returns another user\'s logs', async () => {
        const userA = await createTestUser({ email: 'a@example.com' });
        const userB = await createTestUser({ email: 'b@example.com' });
        await request(app).post('/api/logs').set('Cookie', userA.cookie).send(validLog({ logDate: '2026-08-02' }));
        await request(app).post('/api/logs').set('Cookie', userB.cookie).send(validLog({ logDate: '2026-08-02' }));
        const resA = await request(app).get('/api/logs?from=2026-08-02&to=2026-08-02').set('Cookie', userA.cookie);
        expect(resA.body.data).toHaveLength(1);
        expect(resA.body.data[0].id).not.toBe(undefined);
        const resB = await request(app).get('/api/logs?from=2026-08-02&to=2026-08-02').set('Cookie', userB.cookie);
        expect(resB.body.data).toHaveLength(1);
        expect(resA.body.data[0].id).not.toBe(resB.body.data[0].id);
    });
    it('GET /api/logs/today returns null when nothing was logged today', async () => {
        const { cookie } = await createTestUser();
        const res = await request(app).get('/api/logs/today').set('Cookie', cookie);
        expect(res.status).toBe(200);
        expect(res.body).toBeNull();
    });
});
//# sourceMappingURL=daily-log.spec.js.map