const CACHE = global.__SP_ROUTE_CACHE__ || (global.__SP_ROUTE_CACHE__ = {});

function cleanFlight(v) {
  return String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
}

function cleanProvider(v) {
  const p = String(v || 'vrs').toLowerCase();
  return ['off', 'adsbdb', 'vrs', 'aerodatabox', 'aviationstack'].includes(p) ? p : 'adsbdb';
}

function normalizeRoute(dep, arr) {
  dep = String(dep || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  arr = String(arr || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  return dep && arr && dep !== arr ? `${dep} → ${arr}` : '';
}

function routeFromText(v) {
  if (!v) return '';
  let s = String(v).toUpperCase();
  if (/DOCS|DOCUMENTATION|VRS\s*-\s*DOCS|HTML|DOCTYPE/.test(s)) return '';
  s = s.replace(/\s*[-–—>]\s*/g, ' → ').replace(/\s+TO\s+/g, ' → ').replace(/\s+/g, ' ').trim();
  const m = s.match(/\b([A-Z0-9]{3,4})\s*(?:→|>)\s*([A-Z0-9]{3,4})\b/);
  return m ? normalizeRoute(m[1], m[2]) : '';
}

function parseAnyRoute(json) {
  const seen = new Set();
  function walk(x) {
    if (!x || seen.has(x)) return '';
    if (typeof x === 'object') seen.add(x);
    if (typeof x === 'string') return routeFromText(x);
    if (Array.isArray(x)) {
      // Common forms: ["HEL", "BCN"] or [[...], {...}]
      if (x.length >= 2 && typeof x[0] === 'string' && typeof x[1] === 'string') {
        const direct = normalizeRoute(x[0], x[1]);
        if (direct) return direct;
      }
      for (const item of x) { const r = walk(item); if (r) return r; }
      return '';
    }
    if (typeof x === 'object') {
      const direct = normalizeRoute(
        x.from || x.origin || x.orig || x.dep || x.departure || x.fromAirport || x.source,
        x.to || x.destination || x.dest || x.arr || x.arrival || x.toAirport || x.target
      );
      if (direct) return direct;
      const keys = ['route','rte','Route','RouteCode','routeCode','flightRoute','flight_route','text','name','description'];
      for (const k of keys) { const r = walk(x[k]); if (r) return r; }
      for (const v of Object.values(x)) { const r = walk(v); if (r) return r; }
    }
    return '';
  }
  return walk(json);
}


function parseAdsbdb(json) {
  const fr = json && json.response && json.response.flightroute;
  if (!fr) return '';
  const dep = fr.origin || {};
  const arr = fr.destination || {};
  const route = normalizeRoute(dep.iata_code || dep.icao_code, arr.iata_code || arr.icao_code);
  if (route) return route;
  return parseAnyRoute(fr);
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
    const dep = f?.departure?.airport?.iata || f?.departure?.airport?.icao || f?.departure?.airport?.shortName || f?.departure?.iata || f?.dep?.iata || f?.departure?.icao;
    const arr = f?.arrival?.airport?.iata || f?.arrival?.airport?.icao || f?.arrival?.airport?.shortName || f?.arrival?.iata || f?.arr?.iata || f?.arrival?.icao;
    const route = normalizeRoute(dep, arr);
    if (route) return route;
  }
  return parseAnyRoute(json);
}

async function fetchJsonSafe(url, options = {}) {
  const r = await fetch(url, options);
  const ct = String(r.headers.get('content-type') || '').toLowerCase();
  const text = await r.text();
  if (!r.ok) return null;
  if (/html|text\/html/.test(ct) || /^\s*</.test(text) || /VRS\s*-\s*Docs|Documentation/i.test(text)) return null;
  try { return JSON.parse(text); } catch { return null; }
}

async function lookupVrs(flight) {
  const prefix = flight.slice(0, 2);
  if (prefix.length < 2) return '';
  const url = `https://vrs-standing-data.adsb.lol/routes/${prefix}/${flight}.json`;
  const json = await fetchJsonSafe(url, { headers: { 'Accept': 'application/json' } });
  return json ? parseAnyRoute(json) : '';
}

async function lookupAdsbdb(flight) {
  const url = `https://api.adsbdb.com/v0/callsign/${encodeURIComponent(flight)}`;
  const json = await fetchJsonSafe(url, { headers: { 'Accept': 'application/json' } });
  return json ? parseAdsbdb(json) : '';
}

module.exports = async function handler(req, res) {
  const flight = cleanFlight(req.query && req.query.flight);
  const provider = cleanProvider(req.query && req.query.provider);
  const key = String((req.query && req.query.key) || '').trim();
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=43200');

  if (!flight) return res.status(200).json({ route: '', source: '', reason: 'missing-flight' });
  if (provider === 'off') return res.status(200).json({ route: '', source: 'off', reason: 'disabled' });

  const cacheKey = `${provider}:${flight}:${key ? 'key' : 'nokey'}`;
  if (CACHE[cacheKey]) return res.status(200).json(CACHE[cacheKey]);

  try {
    if (provider === 'adsbdb') {
      const route = await lookupAdsbdb(flight);
      const out = { route, source: 'adsbdb', flight, reason: route ? 'found' : 'not-found' };
      CACHE[cacheKey] = out;
      return res.status(200).json(out);
    }

    if (provider === 'vrs') {
      let route = await lookupVrs(flight);
      let source = 'vrs';
      if (!route) { route = await lookupAdsbdb(flight); source = route ? 'adsbdb' : 'vrs'; }
      const out = { route, source, flight, reason: route ? 'found' : 'not-found' };
      CACHE[cacheKey] = out;
      return res.status(200).json(out);
    }

    if (!key) return res.status(200).json({ route: '', source: provider, reason: 'missing-api-key' });

    if (provider === 'aviationstack') {
      const url = `http://api.aviationstack.com/v1/flights?access_key=${encodeURIComponent(key)}&flight_icao=${encodeURIComponent(flight)}&limit=5`;
      const json = await fetchJsonSafe(url, { headers: { 'Accept': 'application/json' } });
      const route = parseAviationStack(json || {});
      const out = { route, source: 'aviationstack', flight, reason: route ? 'found' : 'not-found' };
      CACHE[cacheKey] = out;
      return res.status(200).json(out);
    }

    if (provider === 'aerodatabox') {
      const today = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const plusTwo = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
      const url = `https://aerodatabox.p.rapidapi.com/flights/CallSign/${encodeURIComponent(flight)}/${today}/${plusTwo}`;
      const json = await fetchJsonSafe(url, {
        headers: {
          'Accept': 'application/json',
          'X-RapidAPI-Key': key,
          'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
        }
      });
      const route = parseAeroDataBox(json || {});
      const out = { route, source: 'aerodatabox', flight, reason: route ? 'found' : 'not-found' };
      CACHE[cacheKey] = out;
      return res.status(200).json(out);
    }
  } catch (e) {
    return res.status(200).json({ route: '', source: provider, flight, reason: 'error' });
  }

  return res.status(200).json({ route: '', source: provider, flight, reason: 'not-found' });
};
