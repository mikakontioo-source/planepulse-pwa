const CACHE = global.__PP_LOGO_CACHE__ || (global.__PP_LOGO_CACHE__ = {});

function sanitize(code) {
  return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
}

function directCandidates(code) {
  const c = sanitize(code);
  const low = c.toLowerCase();
  const base = 'https://raw.githubusercontent.com/Jxck-S/airline-logos/main';
  const iataMap = { FIN:'AY', RYR:'FR', DLH:'LH', SAS:'SK', KLM:'KL', AFR:'AF', BAW:'BA', AAL:'AA', UAL:'UA', DAL:'DL', EZY:'U2', WZZ:'W6', THY:'TK', QTR:'QR', UAE:'EK', SWR:'LX', IBE:'IB', PGT:'PC', NAX:'DY', NSZ:'N0', TAY:'3V' };
  const iata = iataMap[c] || (c.length === 2 ? c : '');
  const out = [];
  if (iata) {
    out.push(
      `https://content.airhex.com/content/logos/airlines_${iata}_r.svg`,
      `https://content.airhex.com/content/logos/airlines_${iata}_s.svg`,
      `https://content.airhex.com/content/logos/airlines_${iata}_350_100_r.png`,
      `https://content.airhex.com/content/logos/airlines_${iata}_200_200_s.png`,
      `https://images.kiwi.com/airlines/64x64/${iata}.png`,
      `https://pics.avs.io/200/80/${iata}.png`,
      `https://img.wway.io/pics/root/${iata}@png?exar=1&rs=fit:300:120`
    );
  }
  out.push(
    `https://content.airhex.com/content/logos/airlines_${c}_r.svg`,
    `https://content.airhex.com/content/logos/airlines_${c}_s.svg`,
    `https://content.airhex.com/content/logos/airlines_${c}_350_100_r.png`,
    `https://content.airhex.com/content/logos/airlines_${c}_200_200_s.png`
  );
  const dirs = ['flightaware_logos', 'radarbox_logos', 'custom_logos', 'logos'];
  for (const d of dirs) {
    out.push(`${base}/${d}/${c}.png`, `${base}/${d}/${low}.png`);
  }
  return out;
}

async function githubDirMatches(code, dir) {
  const c = sanitize(code);
  const url = `https://api.github.com/repos/Jxck-S/airline-logos/contents/${dir}?ref=main`;
  const r = await fetch(url, { headers: { 'User-Agent': 'SpotPlane' } });
  if (!r.ok) return [];
  const items = await r.json();
  if (!Array.isArray(items)) return [];
  const exts = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
  return items
    .filter(x => x && x.type === 'file' && x.download_url)
    .filter(x => exts.some(ext => String(x.name).toLowerCase().endsWith(ext)))
    .filter(x => {
      const n = String(x.name).toUpperCase();
      return n === `${c}.PNG` || n.startsWith(`${c}.`) || n.startsWith(`${c}_`) || n.startsWith(`${c}-`) || n.includes(`_${c}.`) || n.includes(`-${c}.`);
    })
    .map(x => x.download_url);
}

module.exports = async function handler(req, res) {
  const code = sanitize(req.query && req.query.code);
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
  if (!code) return res.status(400).json({ found: false, url: '', candidates: [] });
  if (CACHE[code]) return res.status(200).json(CACHE[code]);

  const candidates = directCandidates(code);
  for (const dir of ['flightaware_logos', 'radarbox_logos', 'custom_logos']) {
    try { candidates.unshift(...await githubDirMatches(code, dir)); } catch (_) {}
  }

  const unique = [...new Set(candidates.filter(Boolean))];
  const result = { found: unique.length > 0, url: unique[0] || '', candidates: unique };
  CACHE[code] = result;
  res.status(200).json(result);
};
