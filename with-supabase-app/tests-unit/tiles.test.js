/**
 * Unit tests for:
 *   POST /api/tiles       — create club
 *   DELETE /api/tiles/[tileId] — leave club
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
  authError: null,
  rpcData: null,
  rpcError: null,
  deleteError: null,
};

function resetMockState() {
  mockState.user = { id: 'user-1', email: 'admin@example.com' };
  mockState.authError = null;
  mockState.rpcData = null;
  mockState.rpcError = null;
  mockState.deleteError = null;
}

// Chainable delete proxy — eq() returns a thenable that resolves with deleteError
const deleteChain = {
  eq: jest.fn().mockImplementation(() => deleteChain),
  then: (resolve) => resolve({ error: mockState.deleteError }),
};
// Make deleteChain itself thenable (for await supabase.from().delete().eq().eq())
Object.defineProperty(deleteChain, Symbol.toStringTag, { value: 'Promise' });

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn().mockImplementation(() => ({
    delete: jest.fn().mockReturnValue(deleteChain),
  })),
  rpc: jest.fn(),
  storage: {
    from: jest.fn().mockReturnValue({
      upload: jest.fn().mockResolvedValue({ error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: '' } }),
    }),
  },
};

createClient.mockResolvedValue(mockSupabase);

beforeEach(() => {
  resetMockState();
  jest.clearAllMocks();
  createClient.mockResolvedValue(mockSupabase);

  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: mockState.user },
    error: mockState.authError,
  });

  mockSupabase.rpc.mockImplementation(() =>
    Promise.resolve({ data: mockState.rpcData, error: mockState.rpcError }),
  );

  mockSupabase.from.mockImplementation(() => ({
    delete: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: mockState.deleteError }),
      }),
    }),
  }));

  // Re-wire auth.getUser to use current mockState
  mockSupabase.auth.getUser.mockImplementation(() =>
    Promise.resolve({
      data: { user: mockState.user },
      error: mockState.authError,
    }),
  );

  // Re-wire rpc to use current mockState
  mockSupabase.rpc.mockImplementation(() =>
    Promise.resolve({ data: mockState.rpcData, error: mockState.rpcError }),
  );
});

// ─── POST /api/tiles ──────────────────────────────────────────────────────────

describe('POST /api/tiles', () => {
  const { POST } = require('../app/api/tiles/route');

  test('returns 401 when unauthenticated', async () => {
    mockState.user = null;
    const res = await POST(makeJsonRequest({ title: 'My Club' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  test('returns 400 for empty title', async () => {
    const res = await POST(makeJsonRequest({ title: '' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Title is required');
  });

  test('returns 400 for whitespace-only title', async () => {
    const res = await POST(makeJsonRequest({ title: '   ' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Title is required');
  });

  test('returns 400 and propagates rpc error message', async () => {
    mockState.rpcError = { message: 'rpc exploded' };
    const res = await POST(makeJsonRequest({ title: 'Valid Club' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('rpc exploded');
  });

  test('returns 200 with success and club_id on happy path', async () => {
    mockState.rpcData = { club_id: 42, name: 'Valid Club' };
    const res = await POST(makeJsonRequest({ title: 'Valid Club' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.club_id).toBe(42);
  });

  test('calls resend.emails.send once for a single-email members string', async () => {
    mockState.rpcData = { club_id: 99, name: 'Club With Invite' };
    await POST(makeJsonRequest({ title: 'Club With Invite', members: 'invite@example.com' }));
    const sendSpy = Resend.mock.results[0].value.emails.send;
    expect(sendSpy).toHaveBeenCalledTimes(1);
    expect(sendSpy.mock.calls[0][0].to).toBe('invite@example.com');
  });

  // Feature: comprehensive-unit-tests, Property 1: Whitespace-only titles are rejected by POST /api/tiles
  test('Property 1 — whitespace-only titles are always rejected', async () => {
    const fc = require('fast-check');
    await fc.assert(
      fc.asyncProperty(fc.stringMatching(/^\s+$/), async (title) => {
        const res = await POST(makeJsonRequest({ title }));
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toBe('Title is required');
      }),
      { numRuns: 100 },
    );
  });

  // Feature: comprehensive-unit-tests, Property 2: RPC error message is propagated by POST /api/tiles
  test('Property 2 — rpc error message is propagated verbatim', async () => {
    const fc = require('fast-check');
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1 }), async (msg) => {
        mockState.rpcError = { message: msg };
        mockState.rpcData = null;
        mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: { message: msg } });
        const res = await POST(makeJsonRequest({ title: 'Valid' }));
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toBe(msg);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: comprehensive-unit-tests, Property 3: Valid title and successful RPC yields 200 with club_id
  test('Property 3 — valid title + successful rpc always yields 200 with club_id', async () => {
    const fc = require('fast-check');
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        fc.integer({ min: 1, max: 99999 }),
        async (title, clubId) => {
          mockSupabase.rpc.mockResolvedValueOnce({
            data: { club_id: clubId, name: title },
            error: null,
          });
          const res = await POST(makeJsonRequest({ title }));
          expect(res.status).toBe(200);
          const body = await res.json();
          expect(body.success).toBe(true);
          expect(body.club_id).toBe(clubId);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: comprehensive-unit-tests, Property 4: Resend called once per valid email in POST /api/tiles
  test('Property 4 — resend.emails.send called exactly N times for N emails', async () => {
    const fc = require('fast-check');
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.emailAddress(), { minLength: 1, maxLength: 10 }),
        async (emails) => {
          jest.clearAllMocks();
          mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: 'user-1', email: 'admin@example.com' } },
            error: null,
          });
          mockSupabase.rpc.mockResolvedValueOnce({
            data: { club_id: 1, name: 'Club' },
            error: null,
          });
          await POST(makeJsonRequest({ title: 'Club', members: emails.join(',') }));
          const sendSpy = Resend.mock.results[Resend.mock.results.length - 1].value.emails.send;
          expect(sendSpy).toHaveBeenCalledTimes(emails.length);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── DELETE /api/tiles/[tileId] ───────────────────────────────────────────────

describe('DELETE /api/tiles/[tileId]', () => {
  const { DELETE } = require('../app/api/tiles/[tileId]/route');

  test('returns 401 when unauthenticated', async () => {
    mockState.user = null;
    const res = await DELETE(new Request('http://localhost'), makeParams({ tileId: 'club-123' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  test('returns 200 with success:true on successful leave', async () => {
    mockState.deleteError = null;
    const res = await DELETE(new Request('http://localhost'), makeParams({ tileId: 'club-123' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('returns 500 with error message when delete fails', async () => {
    mockSupabase.from.mockImplementationOnce(() => ({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: { message: 'delete failed' } }),
        }),
      }),
    }));
    const res = await DELETE(new Request('http://localhost'), makeParams({ tileId: 'club-123' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('delete failed');
  });
});
