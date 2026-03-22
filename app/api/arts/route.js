import { Redis } from '@upstash/redis';
import { put } from '@vercel/blob';

// Upstash via Vercel KV-compatible env vars
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export async function GET() {
  try {
    const arts = await redis.lrange('arts', 0, -1);
    return Response.json(arts ?? []);
  } catch (error) {
    console.error('Redis GET error:', error);
    return Response.json([]);
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file  = formData.get('file');
    const title = formData.get('title');
    const desc  = formData.get('desc') || '';
    const wa    = formData.get('wa');

    if (!file || !title || !wa) {
      return Response.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const blob = await put(`arts/${Date.now()}-${file.name}`, file, {
      access: 'public',
    });

    const art = {
      id: Date.now(),
      title,
      desc,
      wa,
      imgUrl: blob.url,
      createdAt: new Date().toISOString(),
    };

    await redis.lpush('arts', art);

    return Response.json(art, { status: 201 });
  } catch (error) {
    console.error('POST /api/arts error:', error);
    return Response.json({ error: 'Error al publicar la obra' }, { status: 500 });
  }
}
