module.exports = async function handler(req, res) {
  try {
    const reg = String(req.query.reg || '').trim().toUpperCase();
    if (!reg || reg.length < 3) return res.status(200).json({ photo: null });
    const url = `https://api.planespotters.net/pub/photos/reg/${encodeURIComponent(reg)}`;
    const r = await fetch(url, { headers: { 'accept': 'application/json', 'user-agent': 'PlanePulse/1.0' } });
    if (!r.ok) return res.status(200).json({ photo: null });
    const data = await r.json();
    const photo = data?.photos?.[0];
    const image = photo?.thumbnail_large?.src || photo?.thumbnail?.src || photo?.link || null;
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ photo: image, registration: reg });
  } catch (err) {
    res.status(200).json({ photo: null, error: String(err && err.message ? err.message : err) });
  }
};
