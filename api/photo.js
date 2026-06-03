module.exports = async function handler(req, res) {
  const reg = (req.query.reg || '').trim().toUpperCase();
  if (!reg) return res.status(200).json({ url: null });
  try {
    const url = `https://api.planespotters.net/pub/photos/reg/${encodeURIComponent(reg)}`;
    const r = await fetch(url, { headers: { 'user-agent': 'PlanePulse/1.0' } });
    const data = await r.json();
    const photo = data.photos && data.photos[0];
    const image = photo && (photo.thumbnail_large && photo.thumbnail_large.src || photo.thumbnail && photo.thumbnail.src || photo.link);
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    res.status(200).json({ url: image || null, source: 'planespotters', reg });
  } catch (e) {
    res.status(200).json({ url: null, error: String(e) });
  }
}
