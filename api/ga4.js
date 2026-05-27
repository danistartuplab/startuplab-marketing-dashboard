export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const propertyId = process.env.GA4_PROPERTY_ID;
    const clientId = process.env.GA4_CLIENT_ID;
    const clientSecret = process.env.GA4_CLIENT_SECRET;
    const refreshToken = process.env.GA4_REFRESH_TOKEN;

  if (!propertyId || !clientId || !clientSecret || !refreshToken) {
        return res.json({ source: 'demo', sessions: 14820, newUsers: 9240, bounceRate: '48.3', avgDuration: '3:24', conversions: 89, channels: [
          { channel: 'Organic Search', sessions: 4742 }, { channel: 'Paid Search', sessions: 3557 },
          { channel: 'Organic Social', sessions: 2815 }, { channel: 'Email', sessions: 1778 },
          { channel: 'Referral', sessions: 1185 }, { channel: 'Direct', sessions: 743 }
              ]});
  }

  try {
        // Get access token using refresh token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                        client_id: clientId,
                        client_secret: clientSecret,
                        refresh_token: refreshToken,
                        grant_type: 'refresh_token'
              })
      });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) throw new Error('Failed to get access token: ' + JSON.stringify(tokenData));
        const accessToken = tokenData.access_token;

      // Call GA4 Data API
      const apiRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
              method: 'POST',
              headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
                        metrics: [{ name: 'sessions' }, { name: 'newUsers' }, { name: 'bounceRate' }, { name: 'averageSessionDuration' }, { name: 'conversions' }],
                        dimensions: [{ name: 'sessionDefaultChannelGroup' }]
              })
      });
        const data = await apiRes.json();
        if (data.error) throw new Error(JSON.stringify(data.error));

      const totals = data.totals?.[0]?.metricValues || [];
        const channels = (data.rows || []).map(row => ({
                channel: row.dimensionValues?.[0]?.value || 'Unknown',
                sessions: parseInt(row.metricValues?.[0]?.value || '0')
        }));

      const avgSec = parseFloat(totals[3]?.value || '0');
        return res.json({
                source: 'live',
                sessions: parseInt(totals[0]?.value || '0'),
                newUsers: parseInt(totals[1]?.value || '0'),
                bounceRate: parseFloat(totals[2]?.value || '0').toFixed(1),
                avgDuration: Math.floor(avgSec/60)+':'+ String(Math.round(avgSec%60)).padStart(2,'0'),
                conversions: parseInt(totals[4]?.value || '0'),
                channels
        });
  } catch (e) {
        return res.status(500).json({ error: e.message });
  }
}
