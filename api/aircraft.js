module.exports = async function handler(req, res) {
  const { lat, lon, dist } = req.query;
  res.setHeader('Access-Control-Allow-Origin','*');
  if (!lat || !lon) return res.status(200).json({ aircraft: [], source: 'NO_LOCATION' });

  const urls = [
    { source: 'ADSB.LOL', url: `https://api.adsb.lol/v2/lat/${encodeURIComponent(lat)}/lon/${encodeURIComponent(lon)}/dist/${encodeURIComponent(dist || '27')}` },
    { source: 'ADSB.FI', url: `https://opendata.adsb.fi/api/v3/lat/${encodeURIComponent(lat)}/lon/${encodeURIComponent(lon)}/dist/${encodeURIComponent(dist || '27')}` }
  ];

  for (const item of urls) {
    try {
      const r = await fetch(item.url, { headers: { accept: 'application/json' }, cache: 'no-store' });
      if (!r.ok) continue;
      const data = await r.json();
      const aircraft = data.aircraft || data.ac || [];
      if (Array.isArray(aircraft) && aircraft.length) {
        return res.status(200).json({ aircraft, source: item.source, count: aircraft.length });
      }
    } catch (e) {}
  }
  return res.status(200).json({ aircraft: [], source: 'NO_DATA', count: 0 });
}
