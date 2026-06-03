module.exports = async (req, res) => {
  const reg = String(req.query.reg || '').trim().toUpperCase();
  if (!reg) return res.status(200).json({ url: null });
  try {
    const r = await fetch(`https://api.planespotters.net/pub/photos/reg/${encodeURIComponent(reg)}`, { headers: { accept: 'application/json' } });
    const j = await r.json();
    const photo = j.photos && j.photos[0];
    const url = photo?.thumbnail_large?.src || photo?.thumbnail?.src || photo?.link || null;
    res.status(200).json({ url });
  } catch(e){ res.status(200).json({ url: null }); }
};
