module.exports = async function handler(req, res) {
  try {
    const lat = parseFloat(req.query.lat || '60.293');
    const lon = parseFloat(req.query.lon || '25.037');
    const km = parseFloat(req.query.radius || '50');
    const nm = Math.max(1, Math.round(km / 1.852));
    const url = `https://api.adsb.lol/v2/lat/${lat}/lon/${lon}/dist/${nm}`;
    const r = await fetch(url, { headers: { 'user-agent': 'PlanePulse/1.0' } });
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate=20');
    res.status(200).json({ aircraft: data.ac || data.aircraft || [] });
  } catch (e) {
    res.status(200).json({ aircraft: [], error: String(e && e.message || e) });
  }
};
