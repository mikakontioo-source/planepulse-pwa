module.exports = async function handler(req, res) {
  try {
    const reg = (req.query.reg || '').trim().toUpperCase();
    const hex = (req.query.hex || '').trim().toLowerCase();
    let url = null;
    if (reg) url = `https://api.planespotters.net/pub/photos/reg/${encodeURIComponent(reg)}`;
    else if (hex) url = `https://api.planespotters.net/pub/photos/hex/${encodeURIComponent(hex)}`;
    if (!url) return res.status(200).json({ photo: null });
    const r = await fetch(url, { headers: { 'user-agent': 'PlanePulse/1.0' } });
    const data = await r.json();
    const photo = data.photos?.[0]?.thumbnail_large?.src || data.photos?.[0]?.thumbnail?.src || null;
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ photo });
  } catch (e) {
    res.status(200).json({ photo: null });
  }
};
