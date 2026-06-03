module.exports = async function handler(req, res) {
  const lat = req.query.lat || '60.293';
  const lon = req.query.lon || '25.037';
  const dist = req.query.dist || '27';
  try {
    const url = `https://api.adsb.lol/v2/lat/${encodeURIComponent(lat)}/lon/${encodeURIComponent(lon)}/dist/${encodeURIComponent(dist)}`;
    const r = await fetch(url, { headers: { 'user-agent': 'PlanePulse/1.0' } });
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate=10');
    res.status(200).json(data);
  } catch (e) {
    res.status(200).json({ aircraft: [], ac: [], error: String(e) });
  }
}
