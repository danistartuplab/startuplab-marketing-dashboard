export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const orgId = process.env.LINKEDIN_ORGANIZATION_ID;

  if (!token || token === 'PENDING' || !token) {
    return res.json({
      source: 'demo',
      followers: 3742, impressions: 44200, clicks: 1872,
      engagement: 4.24, shares: 312, likes: 1240,
      followerGrowth: [3490,3540,3590,3620,3650,3685,3710,3742],
      topPosts: [
        { text: 'Por que el 87% de las startups en LATAM fallan en su primer ano', impressions: 8420, engagement: 6.8 },
        { text: 'Lanzamos nuestro programa de aceleracion - 20 startups seleccionadas', impressions: 6214, engagement: 5.3 },
        { text: '5 metricas que todo founder debe monitorear en etapa pre-seed', impressions: 5890, engagement: 4.9 }
      ]
    });
  }

  try {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': '202401'
    };
    const orgUrn = encodeURIComponent(`urn:li:organization:${orgId}`);
    const now = Date.now();
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const [followRes, statsRes] = await Promise.all([
      fetch(`https://api.linkedin.com/v2/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=${orgUrn}`, { headers }),
      fetch(`https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${orgUrn}&timeIntervals.timeGranularityType=MONTH&timeIntervals.timeRange.start=${monthAgo}&timeIntervals.timeRange.end=${now}`, { headers })
    ]);

    const followData = await followRes.json();
    const statsData = await statsRes.json();
    const followers = followData.elements?.reduce((s, e) => s + (e.followerCounts?.organicFollowerCount || 0) + (e.followerCounts?.paidFollowerCount || 0), 0) || 0;
    const stats = statsData.elements?.[0]?.totalShareStatistics || {};

    return res.json({
      source: 'live',
      followers,
      impressions: stats.impressionCount || 0,
      clicks: stats.clickCount || 0,
      engagement: stats.engagement ? (stats.engagement * 100).toFixed(2) : 0,
      shares: stats.shareCount || 0,
      likes: stats.likeCount || 0,
      comments: stats.commentCount || 0
    });
  } catch (e) {
    return res.status(500).json({ source: 'error', error: e.message });
  }
}
