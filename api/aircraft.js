module.exports = async function handler(req, res) {
  const lat = req.query.lat || '60.293';
  const lon = req.query.lon || '25.037';
  const km = Number(req.query.radius || 50);
  const nm = Math.max(1, Math.round(km / 1.852));
  const url = `https://api.adsb.lol/v2/lat/${lat}/lon/${lon}/dist/${nm}`;

  try {
    const r = await fetch(url, { headers: { accept: 'application/json' } });
    const data = await r.json();

    // ADS-B Exchange style APIs may return either `ac` or `aircraft`.
    // PlanePulse frontend expects `aircraft`, so normalize it here.
    const aircraft = Array.isArray(data.aircraft)
      ? data.aircraft
      : Array.isArray(data.ac)
        ? data.ac
        : [];

    res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate=10');
    res.status(200).json({ ...data, aircraft });
  } catch (err) {
    res.status(500).json({ aircraft: [], error: 'ADS-B fetch failed', details: String(err) });
  }
};
