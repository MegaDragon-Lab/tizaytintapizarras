import GalleryClient from './GalleryClient';

// Server component: fetch arts at request time (always fresh)
export const revalidate = 0;

async function getArts() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/arts`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function Home() {
  const arts = await getArts();
  return <GalleryClient initialArts={arts} />;
}
