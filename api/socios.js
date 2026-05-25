export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const brand24Key = process.env.BRAND24_API_KEY;
  const ids = {
    bancoestado: process.env.BRAND24_PROJECT_BANCOESTADO,
    bidlab: process.env.BRAND24_PROJECT_BIDLAB,
    codelco: process.env.BRAND24_PROJECT_CODELCO
  };

  if (!brand24Key || brand24Key === 'PENDING') {
    return res.json({ source: 'demo', socios: getDemoSocios() });
  }

  try {
    const results = await Promise.all(
      Object.entries(ids).map(async ([name, projectId]) => {
        if (!projectId || projectId === 'PENDING') return getDemoSocio(name);
        const r = await fetch(`https://api.brand24.com/v3/project/${projectId}/mentions/summary/?interval=30d`, {
          headers: { Authorization: `Bearer ${brand24Key}`, Accept: 'application/json' }
        });
        if (!r.ok) return getDemoSocio(name);
        const d = await r.json();
        return {
          name,
          source: 'live',
          total: d.mentions_count || 0,
          reach: d.reach || 0,
          sentiment: {
            positive: d.sentiment?.positive || 0,
            neutral: d.sentiment?.neutral || 0,
            negative: d.sentiment?.negative || 0
          },
          platforms: {
            linkedin: d.sources?.linkedin || 0,
            twitter: d.sources?.twitter || 0,
            facebook: d.sources?.facebook || 0,
            instagram: d.sources?.instagram || 0,
            news: d.sources?.news || 0
          },
          topMentions: (d.mentions || []).slice(0, 5).map(m => ({
            text: m.description?.substring(0, 120),
            platform: m.source_type,
            reach: m.follower_count || 0,
            sentiment: m.sentiment,
            time: m.publication_time
          }))
        };
      })
    );
    return res.json({ source: 'live', socios: results });
  } catch (e) {
    return res.status(500).json({ source: 'error', error: e.message, socios: getDemoSocios() });
  }
}

function getDemoSocio(name) {
  const data = {
    bancoestado: { total: 312, reach: 980000, sentiment: { positive: 82, neutral: 13, negative: 5 }, platforms: { linkedin: 148, twitter: 94, facebook: 42, instagram: 8, news: 20 } },
    bidlab:      { total: 284, reach: 840000, sentiment: { positive: 91, neutral: 7,  negative: 2 }, platforms: { linkedin: 162, twitter: 78, facebook: 24, instagram: 6,  news: 14 } },
    codelco:     { total: 251, reach: 620000, sentiment: { positive: 68, neutral: 22, negative: 10 }, platforms: { linkedin: 120, twitter: 72, facebook: 38, instagram: 5, news: 16 } }
  };
  return { name, source: 'demo', ...data[name] };
}

function getDemoSocios() {
  return ['bancoestado', 'bidlab', 'codelco'].map(getDemoSocio);
}
