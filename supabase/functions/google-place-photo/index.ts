const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const name = url.searchParams.get('name') || '';
    const width = Math.min(Math.max(Number(url.searchParams.get('w')) || 1200, 400), 2400);
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');

    if (!apiKey) return new Response('Chybí Google API klíč.', { status: 500, headers: corsHeaders });
    if (!/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(name)) {
      return new Response('Neplatný identifikátor fotografie.', { status: 400, headers: corsHeaders });
    }

    const endpoint = `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${width}&skipHttpRedirect=true`;
    const googleResponse = await fetch(endpoint, {
      headers: { 'X-Goog-Api-Key': apiKey },
    });

    if (!googleResponse.ok) {
      const detail = await googleResponse.text();
      return new Response(`Google photo ${googleResponse.status}: ${detail}`, {
        status: googleResponse.status,
        headers: corsHeaders,
      });
    }

    const data = await googleResponse.json();
    if (!data?.photoUri) return new Response('Fotografie nebyla nalezena.', { status: 404, headers: corsHeaders });

    return Response.redirect(data.photoUri, 302);
  } catch (error) {
    return new Response(error instanceof Error ? error.message : 'Chyba fotografie.', {
      status: 500,
      headers: corsHeaders,
    });
  }
});
