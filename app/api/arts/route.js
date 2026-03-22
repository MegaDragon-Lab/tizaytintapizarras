import { kv } from '@vercel/kv';
import { put } from '@vercel/blob';

// GET /api/arts — fetch all arts from KV
export async function GET() {
  try {
    const arts = await kv.lrange('arts', 0, -1);
    return Response.json(arts ?? []);
  } catch (error) {
    console.error('KV GET error:', error);
    return Response.json([]);
  }
}

// POST /api/arts — upload image to Blob + save metadata to KV
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file     = formData.get('file');
    const title    = formData.get('title');
    const desc     = formData.get('desc') || '';
    const wa       = formData.get('wa');

    if (!file || !title || !wa) {
      return Response.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Upload image to Vercel Blob (public CDN)
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

    // Prepend to Redis list → newest first
    await kv.lpush('arts', art);

    return Response.json(art, { status: 201 });
  } catch (error) {
    console.error('POST /api/arts error:', error);
    return Response.json({ error: 'Error al publicar la obra' }, { status: 500 });
  }
}
