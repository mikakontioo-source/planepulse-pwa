module.exports = async function handler(req, res) {
  const { lat, lon, dist } = req.query;
  res.setHeader('Access-Control-Allow-Origin','*');
  if (!lat || !lon) return res.status(400).json({ aircraft: [] });
  try {
    const url = `https://api.adsb.lol/v2/lat/${encodeURIComponent(lat)}/lon/${encodeURIComponent(lon)}/dist/${encodeURIComponent(dist || '27')}`;
    const r = await fetch(url, { headers: { 'accept': 'application/json' }});
    const data = await r.json();
    return res.status(200).json({ aircraft: data.aircraft || data.ac || [] });
  } catch (e) { return res.status(200).json({ aircraft: [] }); }
}
