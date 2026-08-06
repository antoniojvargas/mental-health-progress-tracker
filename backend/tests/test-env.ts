process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://mhpt_test:mhpt_test@localhost:5433/mhpt_test';
process.env.JWT_SECRET = 'test-secret-not-for-production-use';
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/api/auth/google/callback';
process.env.FRONTEND_URL = 'http://localhost:5173';
