export default async function handler(req, res) {
  const reg = String(req.query.reg || '').trim().toUpperCase();
  if (!reg) return res.status(200).json({ photoUrl: null, source: null });
  const clean = encodeURIComponent(reg.replace(/[^A-Z0-9-]/g, ''));
  const url = `https://api.planespotters.net/pub/photos/reg/${clean}`;
  try {
    const r = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'PlanePulse/1.1' } });
    if (!r.ok) return res.status(200).json({ photoUrl: null, source: 'planespotters', status: r.status });
    const data = await r.json();
    const first = data?.photos?.[0] || data?.photos?.[0]?.thumbnail_large || null;
    const photoUrl = first?.thumbnail_large?.src || first?.thumbnail?.src || first?.link || first?.src || null;
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({ photoUrl, source: 'planespotters', registration: reg });
  } catch (err) {
    return res.status(200).json({ photoUrl: null, source: 'planespotters', error: String(err) });
  }
}
