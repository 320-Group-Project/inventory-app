/**
 * Unit tests for placeholder routes.
 * These routes always return { status: 'placeholder' } with HTTP 200.
 * No mocks needed — they have no auth or DB logic.
 */

describe('Placeholder routes', () => {
  test('GET /api/clubs/category returns 200 + { status: placeholder }', async () => {
    const { GET } = require('../app/api/clubs/category/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: 'placeholder' });
  });

  test('GET /api/clubs/[org]/category returns 200 + { status: placeholder }', async () => {
    const { GET } = require('../app/api/clubs/[org]/category/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: 'placeholder' });
  });

  test('GET /api/clubs/[org]/members/invite returns 200 + { status: placeholder }', async () => {
    const { GET } = require('../app/api/clubs/[org]/members/invite/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: 'placeholder' });
  });

  test('GET /api/clubs/[org]/members/me returns 200 + { status: placeholder }', async () => {
    const { GET } = require('../app/api/clubs/[org]/members/me/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: 'placeholder' });
  });
});
