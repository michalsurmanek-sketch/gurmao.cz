const baseHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
};

function textResponse(message: string, status: number) {
  return new Response(message, {
    status,
    headers: { ...baseHeaders, 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: baseHeaders });
  if (req.method !== 'GET' && req.method !== 'HEAD') return textResponse('Method not allowed.', 405);

  try {
    const url = new URL(req.url);
    const name = url.searchParams.get('name') || '';
    const width = Math.min(Math.max(Number(url.searchParams.get('w')) || 1200, 400), 1800);
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');

    if (!apiKey) {
      console.error('GOOGLE_PLACES_API_KEY is not configured.');
      return textResponse('Fotografie je dočasně nedostupná.', 503);
    }

    if (!/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(name)) {
      return textResponse('Neplatný identifikátor fotografie.', 400);
    }

    const endpoint = `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${width}&skipHttpRedirect=true`;
    const googleResponse = await fetch(endpoint, {
      headers: { 'X-Goog-Api-Key': apiKey },
    });

    if (!googleResponse.ok) {
      const detail = await googleResponse.text().catch(() => '');
      console.error('Google photo request failed', googleResponse.status, detail.slice(0, 500));
      return textResponse('Fotografie je dočasně nedostupná.', googleResponse.status === 404 ? 404 : 502);
    }

    const data = await googleResponse.json();
    if (!data?.photoUri) return textResponse('Fotografie nebyla nalezena.', 404);

    const location = String(data.photoUri);
    try {
      const photoUrl = new URL(location);
      if (photoUrl.protocol !== 'https:') throw new Error('Non-HTTPS photo URL');
    } catch (error) {
      console.error('Invalid Google photo redirect URL:', error);
      return textResponse('Fotografie je dočasně nedostupná.', 502);
    }

    return new Response(null, {
      status: 302,
      headers: {
        ...baseHeaders,
        Location: location,
        'Referrer-Policy': 'no-referrer',
      },
    });
  } catch (error) {
    console.error('Google photo proxy failed:', error);
    return textResponse('Fotografie je dočasně nedostupná.', 500);
  }
});