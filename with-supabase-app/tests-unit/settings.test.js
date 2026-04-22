/**
 * Unit tests for:
 *   GET   /api/clubs/[org]/settings              — read club settings
 *   PATCH /api/clubs/[org]/settings              — rename club
 *   POST  /api/clubs/[org]/settings/add-members  — send invite emails
 */

jest.mock('@/lib/supabase/server');
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn().mockResolvedValue({ id: 'mock-email-id' }) },
  })),
}));

const { createClient } = require('@/lib/supabase/server');
const { Resend } = require('resend');
const { makeJsonRequest, makeParams } = require('./helpers');

// ─── Mock state ───────────────────────────────────────────────────────────────

const mockState = {
  user: { id: 'user-1', email: 'admin@example.com' },
  // Index 0 = first from() call, index 1 = second, etc.
  queryResponses: [],
  updateError: null,
};

function buildMockSupabase() {
  let callCount = 0;

  return {
    auth: {
      getUser: jest.fn().mockImplementation(() =>
        Promise.resolve({ data: { user: mockState.user }, error: null }),
      ),
    },
    from: jest.fn().mockImplementation(() => {
      const idx = callCount++;
      const response = mockState.queryResponses[idx] ?? { data: null, error: null };

      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(response),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: mockState.updateError }),
        }),
      };
    }),
  };
}

beforeEach(() => {
  mockState.user = { id: 'user-1', email: 'admin@example.com' };
  mockState.queryResponses = [];
  mockState.updateError = null;
  jest.clearAllMocks();
  createClient.mockResolvedValue(buildMockSupabase());
});

// ─── GET /api/clubs/[org]/settings ───────────────────────────────────────────

describe('GET /api/clubs/[org]/settings', () => {
  const { GET } = require('../app/api/clubs/[org]/settings/route');

  test('returns 401 when unauthenticated', async () => {
    mockState.user = null;
    const res = await GET(new Request('http://localhost'), makeParams({ org: 'club-abc' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  test('returns 404 when Club row not found', async () => {
    // First query: Role membership check (passes), second query: Club (not found)
    mockState.queryResponses = [
      { data: { role: 'Member' }, error: null },
      { data: null, error: { message: 'not found' } },
    ];
    createClient.mockResolvedValue(buildMockSupabase());
    const res = await GET(new Request('http://localhost'), makeParams({ org: 'club-abc' }));
    expect(res.status).toBe(404);
  });

  test('returns 404 when caller is not a member', async () => {
    // Role query returns null — caller has no membership
    mockState.queryResponses = [{ data: null, error: null }];
    createClient.mockResolvedValue(buildMockSupabase());
    const res = await GET(new Request('http://localhost'), makeParams({ org: 'club-abc' }));
    expect(res.status).toBe(404);
  });

  test('returns 200 with club_id and name on happy path', async () => {
    // First query: Role membership check, second query: Club data
    mockState.queryResponses = [
      { data: { role: 'Member' }, error: null },
      { data: { club_id: 7, name: 'My Club' }, error: null },
    ];
    createClient.mockResolvedValue(buildMockSupabase());
    const res = await GET(new Request('http://localhost'), makeParams({ org: '7' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.club_id).toBe(7);
    expect(body.name).toBe('My Club');
  });
});

// ─── PATCH /api/clubs/[org]/settings ─────────────────────────────────────────

describe('PATCH /api/clubs/[org]/settings', () => {
  const { PATCH } = require('../app/api/clubs/[org]/settings/route');

  test('returns 401 when unauthenticated', async () => {
    mockState.user = null;
    const res = await PATCH(makeJsonRequest({ name: 'New Name' }), makeParams({ org: 'club-abc' }));
    expect(res.status).toBe(401);
  });

  test('returns 403 when caller is not Admin', async () => {
    // Role query returns Member role
    mockState.queryResponses = [{ data: { role: 'Member' }, error: null }];
    createClient.mockResolvedValue(buildMockSupabase());
    const res = await PATCH(makeJsonRequest({ name: 'New Name' }), makeParams({ org: 'club-abc' }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/admins only/i);
  });

  test('returns 403 when caller has no role row', async () => {
    mockState.queryResponses = [{ data: null, error: null }];
    createClient.mockResolvedValue(buildMockSupabase());
    const res = await PATCH(makeJsonRequest({ name: 'New Name' }), makeParams({ org: 'club-abc' }));
    expect(res.status).toBe(403);
  });

  test('returns 400 for empty name', async () => {
    mockState.queryResponses = [{ data: { role: 'Admin' }, error: null }];
    createClient.mockResolvedValue(buildMockSupabase());
    const res = await PATCH(makeJsonRequest({ name: '' }), makeParams({ org: 'club-abc' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('name is required');
  });

  test('returns 400 for whitespace-only name', async () => {
    mockState.queryResponses = [{ data: { role: 'Admin' }, error: null }];
    createClient.mockResolvedValue(buildMockSupabase());
    const res = await PATCH(makeJsonRequest({ name: '   ' }), makeParams({ org: 'club-abc' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('name is required');
  });

  test('returns 200 with success:true when Admin provides valid name', async () => {
    mockState.queryResponses = [{ data: { role: 'Admin' }, error: null }];
    createClient.mockResolvedValue(buildMockSupabase());
    const res = await PATCH(makeJsonRequest({ name: 'Renamed Club' }), makeParams({ org: 'club-abc' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // Feature: comprehensive-unit-tests, Property 8: Whitespace-only name is rejected by PATCH /api/clubs/[org]/settings
  test('Property 8 — whitespace-only names are always rejected', async () => {
    const fc = require('fast-check');
    await fc.assert(
      fc.asyncProperty(fc.stringMatching(/^\s+$/), async (name) => {
        mockState.queryResponses = [{ data: { role: 'Admin' }, error: null }];
        createClient.mockResolvedValue(buildMockSupabase());
        const res = await PATCH(makeJsonRequest({ name }), makeParams({ org: 'club-abc' }));
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toBe('name is required');
      }),
      { numRuns: 100 },
    );
  });
});

// ─── POST /api/clubs/[org]/settings/add-members ───────────────────────────────

describe('POST /api/clubs/[org]/settings/add-members', () => {
  const { POST } = require('../app/api/clubs/[org]/settings/add-members/route');

  test('returns 401 when unauthenticated', async () => {
    mockState.user = null;
    const res = await POST(makeJsonRequest({ members: 'a@b.com' }), makeParams({ org: 'club-abc' }));
    expect(res.status).toBe(401);
  });

  test('returns 403 when caller is not Admin', async () => {
    mockState.queryResponses = [{ data: { role: 'Member' }, error: null }];
    createClient.mockResolvedValue(buildMockSupabase());
    const res = await POST(makeJsonRequest({ members: 'a@b.com' }), makeParams({ org: 'club-abc' }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/admins only/i);
  });

  test('returns 400 for blank members string', async () => {
    mockState.queryResponses = [
      { data: { role: 'Admin' }, error: null },
      { data: { name: 'My Club' }, error: null },
    ];
    createClient.mockResolvedValue(buildMockSupabase());
    const res = await POST(makeJsonRequest({ members: '   ' }), makeParams({ org: 'club-abc' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('No valid emails provided');
  });

  test('returns 200 and calls send twice for two-email list', async () => {
    mockState.queryResponses = [
      { data: { role: 'Admin' }, error: null },
      { data: { name: 'My Club' }, error: null },
    ];
    createClient.mockResolvedValue(buildMockSupabase());
    const res = await POST(
      makeJsonRequest({ members: 'a@example.com,b@example.com' }),
      makeParams({ org: 'club-abc' }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.invited).toBe(2);
    const sendSpy = Resend.mock.results[Resend.mock.results.length - 1].value.emails.send;
    expect(sendSpy).toHaveBeenCalledTimes(2);
  });

  // Feature: comprehensive-unit-tests, Property 11: Resend called once per valid email in POST /api/clubs/[org]/settings/add-members
  test('Property 11 — resend.emails.send called exactly N times for N emails', async () => {
    const fc = require('fast-check');
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.emailAddress(), { minLength: 1, maxLength: 10 }),
        async (emails) => {
          jest.clearAllMocks();
          mockState.queryResponses = [
            { data: { role: 'Admin' }, error: null },
            { data: { name: 'My Club' }, error: null },
          ];
          createClient.mockResolvedValue(buildMockSupabase());
          const res = await POST(
            makeJsonRequest({ members: emails.join(',') }),
            makeParams({ org: 'club-abc' }),
          );
          expect(res.status).toBe(200);
          const body = await res.json();
          expect(body.invited).toBe(emails.length);
          const sendSpy = Resend.mock.results[Resend.mock.results.length - 1].value.emails.send;
          expect(sendSpy).toHaveBeenCalledTimes(emails.length);
        },
      ),
      { numRuns: 100 },
    );
  });
});
