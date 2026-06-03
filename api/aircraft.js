module.exports = async (req, res) => {
  const { lat, lon, dist } = req.query;
  try {
    const url = `https://api.adsb.lol/v2/lat/${lat}/lon/${lon}/dist/${dist || 27}`;
    const r = await fetch(url);
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate=10');
    res.status(200).json(data);
  } catch (e) {
    res.status(200).json({ aircraft: [], ac: [] });
  }
};
