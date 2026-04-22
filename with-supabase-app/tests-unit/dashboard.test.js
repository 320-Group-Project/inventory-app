/**
 * Unit tests for:
 *   GET /api/dashboard — returns user's clubs and roles
 *
 * The route makes two sequential Supabase queries:
 *   1. from('Role').select().eq()          → terminates at .eq()
 *   2. from('Club').select().in()          → terminates at .in()
 *
 * We track call count on `from()` to return the right response per query.
 */

jest.mock('@/lib/supabase/server');

const { createClient } = require('@/lib/supabase/server');

// ─── Mock state ───────────────────────────────────────────────────────────────

const mockState = {
  user: { id: 'user-1', email: 'admin@example.com' },
  // Index 0 = Role query response, index 1 = Club query response
  queryResponses: [],
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

      // Both queries use .select() then either .eq() or .in() as the terminal
      const chain = {
        select: jest.fn().mockReturnThis(),
        // Terminal for Role query: .eq('UID', userId)
        eq: jest.fn().mockResolvedValue(response),
        // Terminal for Club query: .in('club_id', [...])
        in: jest.fn().mockResolvedValue(response),
        single: jest.fn().mockResolvedValue(response),
      };
      return chain;
    }),
  };
}

beforeEach(() => {
  mockState.user = { id: 'user-1', email: 'admin@example.com' };
  mockState.queryResponses = [];
  createClient.mockResolvedValue(buildMockSupabase());
});

// ─── GET /api/dashboard ───────────────────────────────────────────────────────

describe('GET /api/dashboard', () => {
  const { GET } = require('../app/api/dashboard/route');

  test('returns 401 when unauthenticated', async () => {
    mockState.user = null;
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  test('returns 200 with empty tiles when user has no roles', async () => {
    mockState.queryResponses = [{ data: [], error: null }];
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tiles).toEqual([]);
  });

  test('returns 200 with merged tiles when roles and clubs exist', async () => {
    mockState.queryResponses = [
      { data: [{ club_id: 1, role: 'Admin' }, { club_id: 2, role: 'Member' }], error: null },
      { data: [{ club_id: 1, name: 'Alpha Club' }, { club_id: 2, name: 'Beta Club' }], error: null },
    ];
    createClient.mockResolvedValue(buildMockSupabase());
    const res = await GET();
    expect(res.status).toBe(200);
    const { tiles } = await res.json();
    expect(tiles).toHaveLength(2);
    expect(tiles.find((t) => t.club_id === 1)).toMatchObject({ name: 'Alpha Club', role: 'Admin' });
    expect(tiles.find((t) => t.club_id === 2)).toMatchObject({ name: 'Beta Club', role: 'Member' });
  });

  test('returns 500 when Role query errors', async () => {
    mockState.queryResponses = [{ data: null, error: { message: 'role query failed' } }];
    createClient.mockResolvedValue(buildMockSupabase());
    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('role query failed');
  });

  // Feature: comprehensive-unit-tests, Property 5: Dashboard tiles merge is correct for any role/club data
  test('Property 5 — tiles merge is correct for any role/club data', async () => {
    const fc = require('fast-check');
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            club_id: fc.integer({ min: 1, max: 9999 }),
            role: fc.constantFrom('Admin', 'Member'),
          }),
          { minLength: 1, maxLength: 10 },
        ).map((roles) => {
          // Deduplicate by club_id so each club appears once (mirrors real DB uniqueness)
          const seen = new Set();
          return roles.filter((r) => {
            if (seen.has(r.club_id)) return false;
            seen.add(r.club_id);
            return true;
          });
        }).filter((roles) => roles.length > 0),
        async (roles) => {
          const clubs = roles.map((r) => ({ club_id: r.club_id, name: `Club-${r.club_id}` }));
          mockState.queryResponses = [
            { data: roles, error: null },
            { data: clubs, error: null },
          ];
          createClient.mockResolvedValue(buildMockSupabase());

          const res = await GET();
          expect(res.status).toBe(200);
          const { tiles } = await res.json();
          expect(tiles).toHaveLength(roles.length);
          for (const role of roles) {
            const tile = tiles.find((t) => t.club_id === role.club_id);
            expect(tile).toBeDefined();
            expect(tile.role).toBe(role.role);
            expect(tile.name).toBe(`Club-${role.club_id}`);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
