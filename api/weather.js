module.exports = async function handler(req, res) {
  try {
    const lat = parseFloat(req.query.lat || '60.293');
    const lon = parseFloat(req.query.lon || '25.037');
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m&timezone=auto`;
    const r = await fetch(url);
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json({ temp: data.current?.temperature_2m ?? null, wind: data.current?.wind_speed_10m ?? null });
  } catch (e) {
    res.status(200).json({ temp: null, wind: null });
  }
};
