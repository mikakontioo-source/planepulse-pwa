const CACHE = global.__SP_ROUTE_CACHE__ || (global.__SP_ROUTE_CACHE__ = {});

function cleanFlight(v) {
  return String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
}

function parseRouteFromText(text) {
  if (!text) return '';
  const t = String(text).toUpperCase().replace(/&RARR;|&RAQUO;|&#8594;/g, '→');
  const m = t.match(/\b([A-Z]{3,4})\s*(?:→|-|TO|&GT;)\s*([A-Z]{3,4})\b/);
  return m ? `${m[1]} → ${m[2]}` : '';
}

module.exports = async function handler(req, res) {
  const flight = cleanFlight(req.query && req.query.flight);
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  if (!flight) return res.status(200).json({ route: '', source: '', reason: 'missing-flight' });
  if (CACHE[flight]) return res.status(200).json(CACHE[flight]);

  try {
    // Best-effort VRS SDM lookup. If the service changes its HTML this safely falls back to empty.
    const url = `https://sdm.virtualradarserver.co.uk/Route/Lookup?callsign=${encodeURIComponent(flight)}&preferIcao=true`;
    const r = await fetch(url, { headers: { 'User-Agent': 'SpotPlane/1.0', 'Accept': 'text/html,*/*;q=0.8' } });
    if (r.ok) {
      const html = await r.text();
      const route = parseRouteFromText(html);
      if (route) {
        const out = { route, source: 'vrs-sdm', flight };
        CACHE[flight] = out;
        return res.status(200).json(out);
      }
    }
  } catch (_) {}

  const out = { route: '', source: '', flight, reason: 'not-found' };
  CACHE[flight] = out;
  return res.status(200).json(out);
};
