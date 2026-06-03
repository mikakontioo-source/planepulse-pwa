module.exports = async function handler(req, res) {
  const reg = (req.query.reg || '').trim();
  res.setHeader('Access-Control-Allow-Origin','*');
  if (!reg) return res.status(200).json({ url: '' });
  try {
    const r = await fetch(`https://api.planespotters.net/pub/photos/reg/${encodeURIComponent(reg)}`);
    const j = await r.json();
    const p = j.photos && j.photos[0];
    const url = p?.thumbnail_large?.src || p?.thumbnail?.src || p?.link || '';
    return res.status(200).json({ url });
  } catch(e) { return res.status(200).json({ url: '' }); }
}
