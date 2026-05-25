export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const propertyId = process.env.GA4_PROPERTY_ID;
  const keyRaw = process.env.GA4_SERVICE_ACCOUNT_KEY;
  if (!propertyId || keyRaw === 'PENDING' || !keyRaw) {
    return res.json({ source: 'demo', sessions: 14820, newUsers: 9240, bounceRate: '48.3', avgDuration: '3:24', conversions: 89, channels: [
      { channel: 'Organic Search', sessions: 4742 }, { channel: 'Paid Search', sessions: 3557 },
      { channel: 'Organic Social', sessions: 2815 }, { channel: 'Email', sessions: 1778 },
      { channel: 'Referral', sessions: 1185 }, { channel: 'Direct', sessions: 743 }
    ]});
  }
  try {
    const key = JSON.parse(keyRaw);
    const { BetaAnalyticsDataClient } = await import('@google-analytics/data');
    const client = new BetaAnalyticsDataClient({ credentials: key });
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      metrics: [{ name: 'sessions' }, { name: 'newUsers' }, { name: 'bounceRate' }, { name: 'averageSessionDuration' }, { name: 'conversions' }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }]
    });
    const t = response.totals?.[0]?.metricValues || [];
    return res.json({
      source: 'live', sessions: parseInt(t[0]?.value||0), newUsers: parseInt(t[1]?.value||0),
      bounceRate: (parseFloat(t[2]?.value||0)*100).toFixed(1),
      avgDuration: Math.floor((t[3]?.value||0)/60)+':'+String(Math.round((t[3]?.value||0)%60)).padStart(2,'0'),
      conversions: parseInt(t[4]?.value||0),
      channels: (response.rows||[]).map(r=>({ channel: r.dimensionValues[0].value, sessions: parseInt(r.metricValues[0].value) }))
    });
  } catch(e){ return res.status(500).json({ source: 'error', error: e.message }); }
}
