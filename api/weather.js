module.exports = async (req, res) => {
  const lat = parseFloat(req.query.lat || '60.293');
  const lon = parseFloat(req.query.lon || '25.037');
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m&wind_speed_unit=kmh`;
  try { const r = await fetch(url); const j = await r.json(); res.status(200).json({ temperature: j.current?.temperature_2m, wind: j.current?.wind_speed_10m }); }
  catch(e){ res.status(200).json({ temperature: null, wind: null }); }
};
