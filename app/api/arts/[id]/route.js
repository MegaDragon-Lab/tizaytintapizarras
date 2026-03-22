import { kv } from '@vercel/kv';
import { del } from '@vercel/blob';

// DELETE /api/arts/[id]
export async function DELETE(request, { params }) {
  try {
    const id = Number(params.id);

    // Find the art in the KV list
    const arts = await kv.lrange('arts', 0, -1);
    const art = arts.find(a => a.id === id);

    if (!art) {
      return Response.json({ error: 'Obra no encontrada' }, { status: 404 });
    }

    // Delete image from Vercel Blob
    if (art.imgUrl) {
      await del(art.imgUrl);
    }

    // Remove from KV list (lrem removes all occurrences matching value)
    await kv.lrem('arts', 1, art);

    return Response.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/arts/[id] error:', error);
    return Response.json({ error: 'Error al eliminar la obra' }, { status: 500 });
  }
}
