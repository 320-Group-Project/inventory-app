/**
 * Unit tests for:
 *   GET  /api/profile       — read user profile
 *   POST /api/profile/save  — update user profile (FormData)
 */

jest.mock('@/lib/supabase/server');

const { createClient } = require('@/lib/supabase/server');
const { makeFormDataRequest } = require('./helpers');

// ─── Mock state ───────────────────────────────────────────────────────────────

const mockState = {
  user: { id: 'user-1', email: 'user@example.com' },
  authError: null,
  queryData: null,
  queryError: null,
  updateError: null,
  uploadError: null,
  publicUrl: 'https://example.com/avatar.png',
};

function resetMockState() {
  mockState.user = { id: 'user-1', email: 'user@example.com' };
  mockState.authError = null;
  mockState.queryData = null;
  mockState.queryError = null;
  mockState.updateError = null;
  mockState.uploadError = null;
  mockState.publicUrl = 'https://example.com/avatar.png';
}

function buildMockSupabase() {
  return {
    auth: {
      // Lazy: reads mockState at call time
      getUser: jest.fn().mockImplementation(() =>
        Promise.resolve({
          data: { user: mockState.user },
          error: mockState.authError,
        }),
      ),
    },
    from: jest.fn().mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      // Lazy: reads mockState at call time
      single: jest.fn().mockImplementation(() =>
        Promise.resolve({ data: mockState.queryData, error: mockState.queryError }),
      ),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockImplementation(() =>
          Promise.resolve({ error: mockState.updateError }),
        ),
      }),
    })),
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockImplementation(() =>
          Promise.resolve({ error: mockState.uploadError }),
        ),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: mockState.publicUrl } }),
      }),
    },
  };
}

beforeEach(() => {
  resetMockState();
  createClient.mockResolvedValue(buildMockSupabase());
});

// ─── GET /api/profile ─────────────────────────────────────────────────────────

describe('GET /api/profile', () => {
  const { GET } = require('../app/api/profile/route');

  test('returns 401 when unauthenticated', async () => {
    mockState.user = null;
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  test('returns 401 when auth returns an error', async () => {
    mockState.authError = { message: 'session expired' };
    mockState.user = null;
    const res = await GET();
    expect(res.status).toBe(401);
  });

  test('returns 500 when User table query errors', async () => {
    mockState.queryError = { message: 'db error' };
    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('db error');
  });

  test('returns 200 with profile fields on happy path', async () => {
    mockState.queryData = { fname: 'Alice', lname: 'Smith', user_image_url: 'https://img.example.com/a.png' };
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.fname).toBe('Alice');
    expect(body.lname).toBe('Smith');
    expect(body.email).toBe('user@example.com');
    expect(body.user_image_url).toBe('https://img.example.com/a.png');
  });

  // Feature: comprehensive-unit-tests, Property 6: Profile data is returned verbatim
  test('Property 6 — profile data is returned verbatim for any profile row', async () => {
    const fc = require('fast-check');
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          fname: fc.string(),
          lname: fc.string(),
          user_image_url: fc.option(fc.webUrl(), { nil: null }),
        }),
        async (profile) => {
          mockState.queryData = profile;
          mockState.queryError = null;
          createClient.mockResolvedValue(buildMockSupabase());

          const res = await GET();
          expect(res.status).toBe(200);
          const body = await res.json();
          expect(body.fname).toBe(profile.fname ?? '');
          expect(body.lname).toBe(profile.lname ?? '');
          expect(body.user_image_url).toBe(profile.user_image_url ?? null);
          expect(body.email).toBe('user@example.com');
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── POST /api/profile/save ───────────────────────────────────────────────────

describe('POST /api/profile/save', () => {
  const { POST } = require('../app/api/profile/save/route');

  test('returns 401 when unauthenticated', async () => {
    mockState.user = null;
    const res = await POST(makeFormDataRequest({}));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  test('returns 200 with nothing-to-update message when FormData is empty', async () => {
    const res = await POST(makeFormDataRequest({}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe('Nothing to update');
  });

  test('returns 200 and calls update when fname and lname are provided', async () => {
    const mockSupa = buildMockSupabase();
    createClient.mockResolvedValue(mockSupa);
    const res = await POST(makeFormDataRequest({ fname: 'Bob', lname: 'Jones' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockSupa.from).toHaveBeenCalledWith('User');
  });

  test('returns 500 when update errors', async () => {
    mockState.updateError = { message: 'update failed' };
    createClient.mockResolvedValue(buildMockSupabase());
    const res = await POST(makeFormDataRequest({ fname: 'Bob', lname: 'Jones' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/update failed/i);
  });

  // Feature: comprehensive-unit-tests, Property 7: Profile update succeeds for any fname/lname pair
  test('Property 7 — profile update succeeds for any fname/lname pair', async () => {
    const fc = require('fast-check');
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        async (fname, lname) => {
          mockState.updateError = null;
          createClient.mockResolvedValue(buildMockSupabase());
          const res = await POST(makeFormDataRequest({ fname, lname }));
          expect(res.status).toBe(200);
          const body = await res.json();
          expect(body.success).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
