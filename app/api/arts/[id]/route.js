import { Redis } from '@upstash/redis';
import { del } from '@vercel/blob';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export async function DELETE(request, { params }) {
  try {
    const id = Number(params.id);
    const arts = await redis.lrange('arts', 0, -1);
    const art = arts.find(a => a.id === id);

    if (!art) {
      return Response.json({ error: 'Obra no encontrada' }, { status: 404 });
    }

    if (art.imgUrl) {
      await del(art.imgUrl);
    }

    await redis.lrem('arts', 1, art);

    return Response.json({ success: true });
  } catch (error) {
    console.error('DELETE error:', error);
    return Response.json({ error: 'Error al eliminar la obra' }, { status: 500 });
  }
}
