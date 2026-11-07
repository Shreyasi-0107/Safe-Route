exports.search = async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 3) return res.json({ results: [] });

  try {
    const url = 'https://nominatim.openstreetmap.org/search?' + new URLSearchParams({
      q, format: 'json', limit: '5', countrycodes: 'in'
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const r = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SafeRouteStudentProject/1.0 (shreyasi0107@gmail.com)',
        'Accept-Language': 'en'
      }
    });
    clearTimeout(timer);

    if (!r.ok) {
      console.error('Nominatim HTTP error:', r.status, r.statusText);
      return res.status(502).json({ results: [], message: `Geocoding service returned ${r.status}` });
    }

    const data = await r.json();
    res.json({
      results: data.map(p => ({ name: p.display_name, lat: +p.lat, lng: +p.lon }))
    });
  } catch (err) {
    console.error('Geocode error:', err.name, err.message, err.cause ? err.cause.code : '');
    res.status(502).json({ results: [], message: 'Geocoding failed: ' + err.message });
  }
};