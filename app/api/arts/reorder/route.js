import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export async function POST(request) {
  try {
    const { ids } = await request.json();
    const arts = await redis.lrange('arts', 0, -1);
    const map = Object.fromEntries(arts.map(a => [String(a.id), a]));
    const reordered = ids.map(id => map[String(id)]).filter(Boolean);
    await redis.del('arts');
    for (const a of reordered) await redis.rpush('arts', a);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Reorder error:', error);
    return Response.json({ error: 'Error al reordenar' }, { status: 500 });
  }
}
