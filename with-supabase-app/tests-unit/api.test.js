import { GET } from '../app/api/tiles/route';
import { GET } from '../app/api/clubs/category/route';
import { GET } from '../app/api/dashboard/route';
import { GET } from '../app/api/profile/route';
import { GET } from '../app/api/clubs/[org]/category/route';
import { GET } from '../app/api/clubs/[org]/members/[userId]/role/route';
import { GET } from '../app/api/clubs/[org]/settings/route';

test('GET /api/tiles returns 200 and placeholder', async () => {
    const response = await GET();
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload).toEqual({ status: 'placeholder' });
});

test('GET /api/clubs/category returns 200 and placeholder', async () => {
    const response = await GET();
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload).toEqual({ status: 'placeholder' });
});

test('GET /api/dashboard returns 200 and placeholder', async () => {
    const response = await GET();
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload).toEqual({ status: 'placeholder' });
});

test('GET /api/profile returns 200 and placeholder', async () => {
    const response = await GET();
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload).toEqual({ status: 'placeholder' });
});

test('GET /api/clubs/[org]/category returns 200 and placeholder', async () => {
    const response = await GET();
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload).toEqual({ status: 'placeholder' });
});

test('GET /api/clubs/[org]/members/[userId]/role returns 200 and placeholder', async () => {
    const response = await GET();
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload).toEqual({ status: 'placeholder' });
});

test('GET /api/clubs/[org]/settings returns 200 and placeholder', async () => {
    const response = await GET();
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload).toEqual({ status: 'placeholder' });
});