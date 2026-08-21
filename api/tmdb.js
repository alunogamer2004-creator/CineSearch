const ALLOWED_PREFIXES = [
  '/trending/', '/movie/', '/tv/', '/search/', '/discover/'
];

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Método não permitido' });
  }

  const apiKey = process.env.TMDB_API_KEY;
  const path = String(request.query.path || '');

  if (!apiKey) {
    return response.status(500).json({ error: 'TMDB_API_KEY não configurada' });
  }

  if (!path.startsWith('/') || !ALLOWED_PREFIXES.some(prefix => path.startsWith(prefix))) {
    return response.status(400).json({ error: 'Rota inválida' });
  }

  const upstream = new URL(`https://api.themoviedb.org/3${path}`);
  Object.entries(request.query).forEach(([key, value]) => {
    if (key !== 'path' && typeof value === 'string') upstream.searchParams.set(key, value);
  });
  upstream.searchParams.set('api_key', apiKey);
  upstream.searchParams.set('language', request.query.language || 'pt-BR');

  try {
    const result = await fetch(upstream, { headers: { Accept: 'application/json' } });
    const data = await result.json();
    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return response.status(result.status).json(data);
  } catch {
    return response.status(502).json({ error: 'Serviço de catálogo indisponível' });
  }
}
