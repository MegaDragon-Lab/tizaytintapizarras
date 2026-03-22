import { Redis } from '@upstash/redis';
import { del, put } from '@vercel/blob';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export async function DELETE(request, { params }) {
  try {
    const id = Number(params.id);
    const arts = await redis.lrange('arts', 0, -1);
    const art = arts.find(a => a.id === id);
    if (!art) return Response.json({ error: 'Obra no encontrada' }, { status: 404 });
    if (art.imgUrl)   await del(art.imgUrl);
    if (art.videoUrl) await del(art.videoUrl);
    await redis.lrem('arts', 1, art);
    return Response.json({ success: true });
  } catch (error) {
    console.error('DELETE error:', error);
    return Response.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}

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
      const body = await request.json();
      updates = { sold: body.sold };
    } else {
      const formData = await request.formData();
      updates.title = formData.get('title') || art.title;
      updates.desc  = formData.get('desc') ?? art.desc;

      // New image
      const newFile = formData.get('file');
      if (newFile && newFile.size > 0) {
        const blob = await put(`arts/${Date.now()}-${newFile.name}`, newFile, { access: 'public' });
        if (art.imgUrl) await del(art.imgUrl);
        updates.imgUrl = blob.url;
      }

      // New video
      const newVideo = formData.get('video');
      if (newVideo && newVideo.size > 0) {
        const vBlob = await put(`arts/videos/${Date.now()}-${newVideo.name}`, newVideo, { access: 'public' });
        if (art.videoUrl) await del(art.videoUrl);
        updates.videoUrl = vBlob.url;
      }

      // Remove video flag
      const removeVideo = formData.get('removeVideo');
      if (removeVideo === 'true') {
        if (art.videoUrl) await del(art.videoUrl);
        updates.videoUrl = null;
      }
    }

    const updated = { ...art, ...updates };
    const newArts = arts.map(a => a.id === id ? updated : a);
    await redis.del('arts');
    for (const a of newArts) await redis.rpush('arts', a);

    return Response.json(updated);
  } catch (error) {
    console.error('PATCH error:', error);
    return Response.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}
