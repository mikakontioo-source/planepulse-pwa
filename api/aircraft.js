module.exports = async (req, res) => {
  const lat = parseFloat(req.query.lat || '60.293');
  const lon = parseFloat(req.query.lon || '25.037');
  const km = parseFloat(req.query.radius || '50');
  const nm = Math.max(1, Math.round(km / 1.852));
  const url = `https://api.adsb.lol/v2/lat/${lat}/lon/${lon}/dist/${nm}`;
  try {
    const r = await fetch(url, { headers: { 'accept': 'application/json' } });
    const data = await r.json();
    const list = data.ac || data.aircraft || [];
    const out = list.map(a => ({ ...a, distanceKm: hav(lat, lon, Number(a.lat), Number(a.lon)) })).filter(a => Number.isFinite(a.distanceKm));
    res.setHeader('Cache-Control','s-maxage=5, stale-while-revalidate=5');
    res.status(200).json({ aircraft: out });
  } catch (e) { res.status(200).json({ aircraft: [], error: String(e.message || e) }); }
};
function hav(lat1,lon1,lat2,lon2){ if(!Number.isFinite(lat2)||!Number.isFinite(lon2)) return NaN; const R=6371; const dLat=(lat2-lat1)*Math.PI/180; const dLon=(lon2-lon1)*Math.PI/180; const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2; return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)); }
