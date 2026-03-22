import { Redis } from '@upstash/redis';
import { del, put } from '@vercel/blob';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// DELETE /api/arts/[id]
export async function DELETE(request, { params }) {
  try {
    const id = Number(params.id);
    const arts = await redis.lrange('arts', 0, -1);
    const art = arts.find(a => a.id === id);
    if (!art) return Response.json({ error: 'Obra no encontrada' }, { status: 404 });
    if (art.imgUrl) await del(art.imgUrl);
    await redis.lrem('arts', 1, art);
    return Response.json({ success: true });
  } catch (error) {
    console.error('DELETE error:', error);
    return Response.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}

// PATCH /api/arts/[id] — edit title/desc/photo or toggle sold
export async function PATCH(request, { params }) {
  try {
    const id = Number(params.id);
    const arts = await redis.lrange('arts', 0, -1);
    const index = arts.findIndex(a => a.id === id);
    if (index === -1) return Response.json({ error: 'Obra no encontrada' }, { status: 404 });

    const art = arts[index];
    const contentType = request.headers.get('content-type') || '';

    let updates = {};

    if (contentType.includes('application/json')) {
      // Toggle sold
      const body = await request.json();
      updates = { sold: body.sold };
    } else {
      // Edit fields (formData)
      const formData = await request.formData();
      updates.title = formData.get('title') || art.title;
      updates.desc  = formData.get('desc') ?? art.desc;

      const newFile = formData.get('file');
      if (newFile && newFile.size > 0) {
        // Upload new image, delete old one
        const blob = await put(`arts/${Date.now()}-${newFile.name}`, newFile, { access: 'public' });
        if (art.imgUrl) await del(art.imgUrl);
        updates.imgUrl = blob.url;
      }
    }

    const updated = { ...art, ...updates };

    // Replace in Redis list: remove old, insert updated at same logical position
    // Since Redis lists don't support index-set easily, we rebuild the list
    const newArts = arts.map(a => a.id === id ? updated : a);
    await redis.del('arts');
    if (newArts.length > 0) {
      // rpush to maintain order (list was newest-first from lpush)
      for (const a of newArts) {
        await redis.rpush('arts', a);
      }
    }

    return Response.json(updated);
  } catch (error) {
    console.error('PATCH error:', error);
    return Response.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}
