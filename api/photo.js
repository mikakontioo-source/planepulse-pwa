export default async function handler(req, res) {
  const reg = String(req.query.reg || '').trim().toUpperCase();
  if (!reg) return res.status(200).json({ image: null });
  try {
    const url = `https://api.planespotters.net/pub/photos/reg/${encodeURIComponent(reg)}`;
    const r = await fetch(url, { headers: { accept: 'application/json' } });
    if (!r.ok) return res.status(200).json({ image: null });
    const data = await r.json();
    const photo = data?.photos?.[0];
    const image = photo?.thumbnail_large?.src || photo?.thumbnail?.src || photo?.link || null;
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    res.status(200).json({ image, registration: reg, source: image ? 'planespotters' : null });
  } catch (err) {
    res.status(200).json({ image: null, error: String(err) });
  }
}
