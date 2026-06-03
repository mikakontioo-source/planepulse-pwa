function toNum(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

module.exports = async function handler(req, res) {
  try {
    const lat = toNum(req.query.lat, 60.293);
    const lon = toNum(req.query.lon, 25.037);
    const km = Math.max(1, Math.min(250, toNum(req.query.km, 50)));
    const nm = Math.max(1, Math.round(km / 1.852));
    const url = `https://api.adsb.lol/v2/lat/${lat}/lon/${lon}/dist/${nm}`;
    const r = await fetch(url, { headers: { 'accept': 'application/json', 'user-agent': 'PlanePulse/1.0' } });
    if (!r.ok) throw new Error(`ADS-B API ${r.status}`);
    const data = await r.json();
    const list = data.aircraft || data.ac || [];
    res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate=10');
    res.status(200).json({ aircraft: list, now: Date.now(), source: 'adsb.lol' });
  } catch (err) {
    res.status(200).json({ aircraft: [], error: String(err && err.message ? err.message : err) });
  }
};
