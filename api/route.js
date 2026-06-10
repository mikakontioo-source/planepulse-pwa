const CACHE = global.__SP_ROUTE_CACHE__ || (global.__SP_ROUTE_CACHE__ = {});

function cleanFlight(v) {
  return String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
}

function cleanProvider(v) {
  const p = String(v || 'off').toLowerCase();
  return ['aerodatabox', 'aviationstack'].includes(p) ? p : 'off';
}

function normalizeRoute(dep, arr) {
  dep = String(dep || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  arr = String(arr || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  return dep && arr && dep !== arr ? `${dep} → ${arr}` : '';
}

function parseAviationStack(json) {
  const rows = Array.isArray(json && json.data) ? json.data : [];
  for (const f of rows) {
    const dep = f?.departure?.iata || f?.departure?.icao;
    const arr = f?.arrival?.iata || f?.arrival?.icao;
    const route = normalizeRoute(dep, arr);
    if (route) return route;
  }
  return '';
}

function parseAeroDataBox(json) {
  const rows = Array.isArray(json) ? json : (Array.isArray(json?.items) ? json.items : (Array.isArray(json?.flights) ? json.flights : [json]));
  for (const f of rows) {
    const dep = f?.departure?.airport?.iata || f?.departure?.airport?.icao || f?.departure?.airport?.shortName || f?.departure?.iata || f?.dep?.iata;
    const arr = f?.arrival?.airport?.iata || f?.arrival?.airport?.icao || f?.arrival?.airport?.shortName || f?.arrival?.iata || f?.arr?.iata;
    const route = normalizeRoute(dep, arr);
    if (route) return route;
  }
  return '';
}

module.exports = async function handler(req, res) {
  const flight = cleanFlight(req.query && req.query.flight);
  const provider = cleanProvider(req.query && req.query.provider);
  const key = String((req.query && req.query.key) || '').trim();
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=43200');

  if (!flight) return res.status(200).json({ route: '', source: '', reason: 'missing-flight' });
  if (provider === 'off') return res.status(200).json({ route: '', source: 'off', reason: 'disabled' });
  if (!key) return res.status(200).json({ route: '', source: provider, reason: 'missing-api-key' });

  const cacheKey = `${provider}:${flight}`;
  if (CACHE[cacheKey]) return res.status(200).json(CACHE[cacheKey]);

  try {
    if (provider === 'aviationstack') {
      const url = `http://api.aviationstack.com/v1/flights?access_key=${encodeURIComponent(key)}&flight_icao=${encodeURIComponent(flight)}&limit=5`;
      const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
      const json = await r.json();
      const route = parseAviationStack(json);
      const out = { route, source: 'aviationstack', flight, reason: route ? 'found' : 'not-found' };
      CACHE[cacheKey] = out;
      return res.status(200).json(out);
    }

    if (provider === 'aerodatabox') {
      const today = new Date().toISOString().slice(0, 10);
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      const url = `https://aerodatabox.p.rapidapi.com/flights/CallSign/${encodeURIComponent(flight)}/${today}/${tomorrow}`;
      const r = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'X-RapidAPI-Key': key,
          'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
        }
      });
      const json = await r.json();
      const route = parseAeroDataBox(json);
      const out = { route, source: 'aerodatabox', flight, reason: route ? 'found' : 'not-found' };
      CACHE[cacheKey] = out;
      return res.status(200).json(out);
    }
  } catch (e) {
    return res.status(200).json({ route: '', source: provider, flight, reason: 'error' });
  }

  return res.status(200).json({ route: '', source: provider, flight, reason: 'not-found' });
};
