module.exports = async (req, res) => {
  const { lat, lon } = req.query;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m`;
    const r = await fetch(url);
    const j = await r.json();
    res.status(200).json({ temperature: j.current?.temperature_2m, wind: j.current?.wind_speed_10m });
  } catch (e) {
    res.status(200).json({});
  }
};
