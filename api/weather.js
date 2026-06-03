function toNum(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

module.exports = async function handler(req, res) {
  try {
    const lat = toNum(req.query.lat, 60.293);
    const lon = toNum(req.query.lon, 25.037);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m&wind_speed_unit=kmh&timezone=auto`;
    const r = await fetch(url, { headers: { 'accept': 'application/json' } });
    if (!r.ok) throw new Error(`Weather API ${r.status}`);
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json({
      temperature: data.current?.temperature_2m ?? null,
      wind: data.current?.wind_speed_10m ?? null
    });
  } catch (err) {
    res.status(200).json({ temperature: null, wind: null, error: String(err && err.message ? err.message : err) });
  }
};
