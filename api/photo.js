module.exports = async function handler(req, res) {
  try {
    const reg = (req.query.reg || '').trim().toUpperCase();
    if (!reg) return res.status(200).json({ url: null });
    const url = `https://api.planespotters.net/pub/photos/reg/${encodeURIComponent(reg)}`;
    const r = await fetch(url, { headers: { 'user-agent': 'PlanePulse/1.0' } });
    if (!r.ok) return res.status(200).json({ url: null });
    const data = await r.json();
    const photo = data.photos && data.photos[0];
    const img = photo && (photo.thumbnail_large && photo.thumbnail_large.src || photo.thumbnail && photo.thumbnail.src || photo.link);
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ url: img || null });
  } catch (e) {
    res.status(200).json({ url: null, error: String(e && e.message || e) });
  }
};
