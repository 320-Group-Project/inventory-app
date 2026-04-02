import { GET } from '../app/api/tiles/route';

test('GET /api/tiles returns 200 and placeholder', async () => {
    const response = await GET();
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload).toEqual({ status: 'placeholder' });
});