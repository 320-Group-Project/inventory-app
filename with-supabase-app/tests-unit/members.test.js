/**
 * Unit tests for:
 *   GET    /api/clubs/[org]/members              — list members
 *   DELETE /api/clubs/[org]/members/[userId]     — remove member
 *   PATCH  /api/clubs/[org]/members/[userId]/role — change role
 *
 * GET members makes TWO sequential queries: Role then User.
 * Admin-check routes make ONE Role query then a delete/update.
 */

jest.mock('@/lib/supabase/server');

const { createClient } = require('@/lib/supabase/server');
const { makeJsonRequest, makeParams } = require('./helpers');

// ─── Mock state ───────────────────────────────────────────────────────────────

const mockState = {
  user: { id: 'admin-1', email: 'admin@example.com' },
  queryResponses: [],
  deleteError: null,
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

      // .eq() needs to be BOTH chainable (for admin-check: .eq().single())
      // AND a terminal (for GET members: from('Role').select().eq() is awaited directly).
      // We achieve this by making eq() return a thenable that also has .single() etc.
      const makeEqChain = () => {
        const eqChain = {
          eq: jest.fn().mockImplementation(makeEqChain),
          single: jest.fn().mockResolvedValue(response),
          in: jest.fn().mockResolvedValue(response),
          // Thenable so `await from().select().eq()` resolves to response
          then: (resolve, reject) => Promise.resolve(response).then(resolve, reject),
        };
        return eqChain;
      };

      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockImplementation(makeEqChain),
        in: jest.fn().mockResolvedValue(response),
        single: jest.fn().mockResolvedValue(response),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: mockState.deleteError }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: mockState.updateError }),
          }),
        }),
      };
    }),
  };
}

beforeEach(() => {
  mockState.user = { id: 'admin-1', email: 'admin@example.com' };
  mockState.queryResponses = [];
  mockState.deleteError = null;
  mockState.updateError = null;
  createClient.mockResolvedValue(buildMockSupabase());
});

// ─── GET /api/clubs/[org]/members ─────────────────────────────────────────────

describe('GET /api/clubs/[org]/members', () => {
  const { GET } = require('../app/api/clubs/[org]/members/route');

  test('returns 401 when unauthenticated', async () => {
    mockState.user = null;
    const res = await GET(new Request('http://localhost'), makeParams({ org: 'club-abc' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  test('returns 200 with empty members when Role query returns no rows', async () => {
    mockState.queryResponses = [{ data: [], error: null }];
    createClient.mockResolvedValue(buildMockSupabase());
    const res = await GET(new Request('http://localhost'), makeParams({ org: 'club-abc' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.members).toEqual([]);
  });

  test('returns 200 with merged members when Role and User rows exist', async () => {
    mockState.queryResponses = [
      { data: [{ UID: 'u1', role: 'Admin' }, { UID: 'u2', role: 'Member' }], error: null },
      {
        data: [
          { UID: 'u1', fname: 'Alice', lname: 'A', user_image_url: null },
          { UID: 'u2', fname: 'Bob', lname: 'B', user_image_url: 'https://img.example.com/b.png' },
        ],
        error: null,
      },
    ];
    createClient.mockResolvedValue(buildMockSupabase());
    const res = await GET(new Request('http://localhost'), makeParams({ org: 'club-abc' }));
    expect(res.status).toBe(200);
    const { members } = await res.json();
    expect(members).toHaveLength(2);
    const alice = members.find((m) => m.uid === 'u1');
    expect(alice).toMatchObject({ uid: 'u1', role: 'Admin', fname: 'Alice', lname: 'A' });
    const bob = members.find((m) => m.uid === 'u2');
    expect(bob).toMatchObject({ uid: 'u2', role: 'Member', fname: 'Bob', lname: 'B' });
  });

  test('returns 500 when Role query errors', async () => {
    mockState.queryResponses = [{ data: null, error: { message: 'role error' } }];
    createClient.mockResolvedValue(buildMockSupabase());
    const res = await GET(new Request('http://localhost'), makeParams({ org: 'club-abc' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('role error');
  });

  // Feature: comprehensive-unit-tests, Property 9: Members list merge is correct for any role/user data
  test('Property 9 — members merge is correct for any role/user data', async () => {
    const fc = require('fast-check');
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            UID: fc.uuid(),
            role: fc.constantFrom('Admin', 'Member'),
          }),
          { minLength: 1, maxLength: 10 },
        ).map((roles) => {
          // Deduplicate by UID
          const seen = new Set();
          return roles.filter((r) => {
            if (seen.has(r.UID)) return false;
            seen.add(r.UID);
            return true;
          });
        }).filter((roles) => roles.length > 0),
        async (roles) => {
          const users = roles.map((r) => ({
            UID: r.UID,
            fname: `First-${r.UID.slice(0, 4)}`,
            lname: `Last-${r.UID.slice(0, 4)}`,
            user_image_url: null,
          }));
          mockState.queryResponses = [
            { data: roles, error: null },
            { data: users, error: null },
          ];
          createClient.mockResolvedValue(buildMockSupabase());

          const res = await GET(new Request('http://localhost'), makeParams({ org: 'club-abc' }));
          expect(res.status).toBe(200);
          const { members } = await res.json();
          expect(members).toHaveLength(roles.length);
          for (const role of roles) {
            const member = members.find((m) => m.uid === role.UID);
            expect(member).toBeDefined();
            expect(member.role).toBe(role.role);
            expect(member.fname).toBe(`First-${role.UID.slice(0, 4)}`);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── DELETE /api/clubs/[org]/members/[userId] ─────────────────────────────────

describe('DELETE /api/clubs/[org]/members/[userId]', () => {
  const { DELETE } = require('../app/api/clubs/[org]/members/[userId]/route');

  test('returns 401 when unauthenticated', async () => {
    mockState.user = null;
    const res = await DELETE(
      new Request('http://localhost'),
      makeParams({ org: 'club-abc', userId: 'user-xyz' }),
    );
    expect(res.status).toBe(401);
  });

  test('returns 403 when caller is not Admin', async () => {
    mockState.queryResponses = [{ data: { role: 'Member' }, error: null }];
    createClient.mockResolvedValue(buildMockSupabase());
    const res = await DELETE(
      new Request('http://localhost'),
      makeParams({ org: 'club-abc', userId: 'user-xyz' }),
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/admins only/i);
  });

  test('returns 400 when userId equals caller id (self-removal)', async () => {
    mockState.queryResponses = [{ data: { role: 'Admin' }, error: null }];
    createClient.mockResolvedValue(buildMockSupabase());
    const res = await DELETE(
      new Request('http://localhost'),
      // userId matches mockState.user.id
      makeParams({ org: 'club-abc', userId: 'admin-1' }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/cannot remove yourself/i);
  });

  test('returns 200 with success:true when Admin removes another user', async () => {
    mockState.queryResponses = [{ data: { role: 'Admin' }, error: null }];
    createClient.mockResolvedValue(buildMockSupabase());
    const res = await DELETE(
      new Request('http://localhost'),
      makeParams({ org: 'club-abc', userId: 'other-user' }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

// ─── PATCH /api/clubs/[org]/members/[userId]/role ─────────────────────────────

describe('PATCH /api/clubs/[org]/members/[userId]/role', () => {
  const { PATCH } = require('../app/api/clubs/[org]/members/[userId]/role/route');

  test('returns 401 when unauthenticated', async () => {
    mockState.user = null;
    const res = await PATCH(
      makeJsonRequest({ role: 'Member' }),
      makeParams({ org: 'club-abc', userId: 'user-xyz' }),
    );
    expect(res.status).toBe(401);
  });

  test('returns 403 when caller is not Admin', async () => {
    mockState.queryResponses = [{ data: { role: 'Member' }, error: null }];
    createClient.mockResolvedValue(buildMockSupabase());
    const res = await PATCH(
      makeJsonRequest({ role: 'Admin' }),
      makeParams({ org: 'club-abc', userId: 'user-xyz' }),
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/admins only/i);
  });

  test('returns 400 for invalid role string', async () => {
    mockState.queryResponses = [{ data: { role: 'Admin' }, error: null }];
    createClient.mockResolvedValue(buildMockSupabase());
    const res = await PATCH(
      makeJsonRequest({ role: 'SuperAdmin' }),
      makeParams({ org: 'club-abc', userId: 'user-xyz' }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid role/i);
  });

  test('returns 200 with success:true when Admin sets valid role', async () => {
    mockState.queryResponses = [{ data: { role: 'Admin' }, error: null }];
    createClient.mockResolvedValue(buildMockSupabase());
    const res = await PATCH(
      makeJsonRequest({ role: 'Member' }),
      makeParams({ org: 'club-abc', userId: 'user-xyz' }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // Feature: comprehensive-unit-tests, Property 10: Invalid role strings are rejected by PATCH /api/clubs/[org]/members/[userId]/role
  test('Property 10 — invalid role strings are always rejected', async () => {
    const fc = require('fast-check');
    await fc.assert(
      fc.asyncProperty(
        fc.string().filter((s) => s !== 'Admin' && s !== 'Member'),
        async (role) => {
          mockState.queryResponses = [{ data: { role: 'Admin' }, error: null }];
          createClient.mockResolvedValue(buildMockSupabase());
          const res = await PATCH(
            makeJsonRequest({ role }),
            makeParams({ org: 'club-abc', userId: 'user-xyz' }),
          );
          expect(res.status).toBe(400);
        },
      ),
      { numRuns: 100 },
    );
  });
});
