const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tolzqxflecqbjdefohom.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

async function supa(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...((opts.headers) || {}),
    },
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const arr = await supa('lanzarus_state?id=eq.main&select=*');
    let state = { balance: 0, net_gains: 0, invested_capital: 0, total_withdrawals: 0 };
    if (Array.isArray(arr) && arr[0]) state = arr[0];

    return res.status(200).json({
      balance: parseFloat(state.balance) || 0,
      netGains: parseFloat(state.net_gains) || 0,
      investedCapital: parseFloat(state.invested_capital) || 0,
      totalWithdrawals: parseFloat(state.total_withdrawals) || 0,
      updatedAt: state.updated_at,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}