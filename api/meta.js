export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const token = process.env.META_ACCESS_TOKEN;
  const adAccount = process.env.META_AD_ACCOUNT_ID;

  if (!token || token === 'PENDING' || !token) {
    return res.json({
      source: 'demo',
      reach: 84200, spend: 1240, ctr: 2.14, cpm: 10.32,
      impressions: 248400, leads: 68,
      campaigns: [
        { name: 'Prospecting LATAM Founders', roas: 3.2, spend: 480, leads: 18 },
        { name: 'Retargeting Visitantes Web', roas: 7.8, spend: 320, leads: 31 },
        { name: 'Brand Awareness Tech', cpm: 8.40, spend: 280, leads: 8 },
        { name: 'Lead Magnet Guia Startup', cpl: 3.20, spend: 160, leads: 11 }
      ]
    });
  }

  try {
    const fields = 'reach,spend,ctr,cpm,impressions,actions,action_values';
    const url = `https://graph.facebook.com/v19.0/${adAccount}/insights?fields=${fields}&date_preset=last_30d&access_token=${token}`;
    const r = await fetch(url);
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);
    const row = d.data?.[0] || {};
    const leads = parseInt(row.actions?.find(a => a.action_type === 'lead')?.value || 0);
    const revenue = parseFloat(row.action_values?.find(a => a.action_type === 'purchase')?.value || 0);
    const roas = row.spend > 0 ? (revenue / parseFloat(row.spend)).toFixed(2) : 0;
    return res.json({
      source: 'live',
      reach: parseInt(row.reach || 0),
      spend: parseFloat(row.spend || 0).toFixed(0),
      ctr: parseFloat(row.ctr || 0).toFixed(2),
      cpm: parseFloat(row.cpm || 0).toFixed(2),
      impressions: parseInt(row.impressions || 0),
      leads, revenue: revenue.toFixed(0), roas
    });
  } catch (e) {
    return res.status(500).json({ source: 'error', error: e.message });
  }
}
