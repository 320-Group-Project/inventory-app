import { GET as getTiles } from '../app/api/tiles/route';
import { GET as getProfile } from '../app/api/profile/route';
import { GET as getClubCategories } from '../app/api/clubs/[org]/category/route';
import { PATCH as patchMemberRole } from '../app/api/clubs/[org]/members/[userId]/role/route';
import { GET as getClubSettings } from '../app/api/clubs/[org]/settings/route';

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(async () => ({
        auth: {
            getUser: jest.fn(async () => ({ data: { user: null }, error: null })),
        },
    })),
}));

test('GET /api/tiles returns 401 when unauthenticated', async () => {
    const response = await getTiles();
    const payload = await response.json();
    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: 'Unauthorized' });
});

test('GET /api/profile returns 401 when unauthenticated', async () => {
    const response = await getProfile();
    const payload = await response.json();
    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: 'Unauthorized' });
});

test('GET /api/clubs/[org]/category returns 401 when unauthenticated', async () => {
    const response = await getClubCategories(
        new Request('http://localhost/api/clubs/1/category'),
        { params: Promise.resolve({ org: '1' }) },
    );
    const payload = await response.json();
    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: 'Unauthorized' });
});

test('PATCH /api/clubs/[org]/members/[userId]/role returns 401 when unauthenticated', async () => {
    const response = await patchMemberRole(
        new Request('http://localhost/api/clubs/1/members/user-1/role', {
            method: 'PATCH',
            body: JSON.stringify({ role: 'Admin' }),
        }),
        { params: Promise.resolve({ org: '1', userId: 'user-1' }) },
    );
    const payload = await response.json();
    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: 'Unauthorized' });
});

test('GET /api/clubs/[org]/settings returns 401 when unauthenticated', async () => {
    const response = await getClubSettings(
        new Request('http://localhost/api/clubs/1/settings'),
        { params: Promise.resolve({ org: '1' }) },
    );
    const payload = await response.json();
    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: 'Unauthorized' });
});
