module.exports = async function handler(req, res) {
  const { lat, lon } = req.query;
  res.setHeader('Access-Control-Allow-Origin','*');
  if (!lat || !lon) return res.status(200).json({});
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current=temperature_2m,wind_speed_10m`;
    const r = await fetch(url); const j = await r.json();
    return res.status(200).json({ temperature: j.current?.temperature_2m, wind: j.current?.wind_speed_10m });
  } catch(e) { return res.status(200).json({}); }
}
