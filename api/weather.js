module.exports = async function handler(req, res) {
  try {
    const lat = req.query.lat || '60.293';
    const lon = req.query.lon || '25.037';
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current=temperature_2m,wind_speed_10m&wind_speed_unit=ms`;
    const r = await fetch(url);
    const data = await r.json();
    const c = data.current || {};
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.status(200).json({ temperature: c.temperature_2m == null ? null : Math.round(c.temperature_2m * 10) / 10, wind: c.wind_speed_10m == null ? null : Math.round(c.wind_speed_10m * 10) / 10 });
  } catch (e) {
    res.status(200).json({ temperature: null, wind: null, error: String(e && e.message || e) });
  }
};
