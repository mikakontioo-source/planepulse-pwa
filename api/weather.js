module.exports = async function handler(req, res) {
  const lat = req.query.lat || '60.293';
  const lon = req.query.lon || '25.037';
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current=temperature_2m,wind_speed_10m&wind_speed_unit=ms`;
    const r = await fetch(url);
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json(data);
  } catch (e) {
    res.status(200).json({ current: {}, error: String(e) });
  }
}
