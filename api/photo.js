module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');

  const reg = String(req.query.reg || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  if (!reg) return res.status(200).json({ url: '', source: '', reason: 'missing-registration' });

  const pickImage = (photo) => {
    if (!photo || typeof photo !== 'object') return '';
    return photo.thumbnail_large?.src
      || photo.thumbnail?.src
      || photo.image?.src
      || photo.image
      || photo.src
      || '';
  };

  try {
    // Planespotters.net public photo endpoint by registration.
    // Example response usually contains { photos: [ { thumbnail_large: { src } } ] }.
    const apiUrl = `https://api.planespotters.net/pub/photos/reg/${encodeURIComponent(reg)}`;
    const apiResp = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'PlanePulse/1.0 (+https://planepulse.vercel.app)',
        'Accept': 'application/json,text/html;q=0.9,*/*;q=0.8'
      }
    });

    if (apiResp.ok) {
      const ct = apiResp.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const data = await apiResp.json();
        const photos = data.photos || data.photo || [];
        const first = Array.isArray(photos) ? photos[0] : photos;
        const img = pickImage(first);
        if (img) return res.status(200).json({ url: img, source: 'planespotters-api', reg });
      }
    }

    // Fallback: try the normal registration page and read the OpenGraph image.
    // This is best-effort only and may stop working if the website markup changes.
    const pageUrl = `https://www.planespotters.net/photos/reg/${encodeURIComponent(reg)}`;
    const pageResp = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'PlanePulse/1.0 (+https://planepulse.vercel.app)',
        'Accept': 'text/html,*/*;q=0.8'
      }
    });

    if (pageResp.ok) {
      const html = await pageResp.text();
      const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
        || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
      if (match && match[1]) return res.status(200).json({ url: match[1], source: 'planespotters-page', reg });
    }

    return res.status(200).json({ url: '', source: '', reg, reason: 'not-found' });
  } catch (error) {
    return res.status(200).json({ url: '', source: '', reg, reason: 'error' });
  }
};
