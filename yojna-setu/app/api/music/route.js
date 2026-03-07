// Proxy Indian flute music from archive.org to bypass CORS
export async function GET() {
  const url = 'https://archive.org/download/IndianSitarInstrumentalMusic10Hours/Indian%20Flute%20Meditation%20Music%20Pure%20Positive%20Vibes%20Instrumental%20Music%20for%20Meditation%20and%20Yoga.mp3';
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Range': 'bytes=0-' },
    });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    return new Response(res.body, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (err) {
    return new Response('Music unavailable', { status: 502 });
  }
}
