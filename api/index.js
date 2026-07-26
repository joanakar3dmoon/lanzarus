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

async function getState() {
  const arr = await supa('lanzarus_state?id=eq.main&select=*');
  if (Array.isArray(arr) && arr[0]) return arr[0];
  return { balance: 0, net_gains: 0, invested_capital: 0, total_withdrawals: 0, updated_at: new Date().toISOString() };
}

async function patchState(fields) {
  await supa('lanzarus_state?id=eq.main', {
    method: 'PATCH',
    body: JSON.stringify({ ...fields, updated_at: new Date().toISOString() }),
  });
}

const aiWorkers = [
  { id: 'ai-1', name: 'ContentBot Alpha', topic: 'Finanzas IA', status: 'activo', baseIncomeRate: 0.45, totalGenerated: 0, color: '#00ff88' },
  { id: 'ai-2', name: 'TradeBot Beta', topic: 'Mercados Financieros', status: 'activo', baseIncomeRate: 0.32, totalGenerated: 0, color: '#00d4ff' },
  { id: 'ai-3', name: 'AffiliateBot Gamma', topic: 'Afiliados Amazon', status: 'activo', baseIncomeRate: 0.38, totalGenerated: 0, color: '#a855f7' },
  { id: 'ai-4', name: 'CryptoBot Delta', topic: 'Criptomonedas', status: 'activo', baseIncomeRate: 0.28, totalGenerated: 0, color: '#ff6b35' },
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const path = req.url.split('?')[0].replace(/\/+$/, '') || '/';

  try {
    // GET /api/ o /api/data — Dashboard principal
    if (req.method === 'GET' && (path === '/' || path === '/api' || path === '/api/data')) {
      const st = await getState();
      const todayEarned = parseFloat(st.net_gains) || 0;
      return res.status(200).json({
        balance: parseFloat(st.balance) || 0,
        netGains: todayEarned,
        investedCapital: parseFloat(st.invested_capital) || 0,
        totalWithdrawals: parseFloat(st.total_withdrawals) || 0,
        reinvestmentFund: 0,
        collaborators: [],
        transactions: [],
        webhookLogs: [],
        aiWorkers: aiWorkers.map(w => ({
          ...w,
          totalGenerated: Math.floor(todayEarned * 0.1 * (Math.random() * 0.5 + 0.75)),
        })),
        aiLogs: [],
        lastUpdated: st.updated_at,
        version: '2.0',
      });
    }

    // POST /api/income — Ingreso manual
    if (req.method === 'POST' && (path === '/api/income' || path === '/api/')) {
      const { amount, description, source } = req.body || {};
      if (!amount || parseFloat(amount) <= 0) return res.status(400).json({ error: 'Importe inválido' });
      const state = await getState();
      const newBalance = parseFloat((parseFloat(state.balance) + parseFloat(amount)).toFixed(2));
      const newNetGains = parseFloat((parseFloat(state.net_gains) + parseFloat(amount)).toFixed(2));
      await patchState({ balance: newBalance, net_gains: newNetGains });
      return res.status(200).json({ success: true, balance: newBalance, newBalance });
    }

    // POST /api/withdraw — Retiro
    if (req.method === 'POST' && path === '/api/withdraw') {
      const { amount, recipientEmail, adminCode } = req.body || {};
      if (!amount || parseFloat(amount) <= 0) return res.status(400).json({ error: 'Importe inválido' });
      const state = await getState();
      const available = parseFloat((state.balance || 0).toFixed(2));
      if (parseFloat(amount) > available) return res.status(400).json({ error: 'Saldo insuficiente' });
      const newBalance = parseFloat((available - parseFloat(amount)).toFixed(2));
      const newWithdrawals = parseFloat((parseFloat(state.total_withdrawals || 0) + parseFloat(amount)).toFixed(2));
      await patchState({ balance: newBalance, total_withdrawals: newWithdrawals });
      return res.status(200).json({ success: true, balance: newBalance, reference: 'WD-' + Date.now() });
    }

    // POST /api/reinvest — Reinversión
    if (req.method === 'POST' && path === '/api/reinvest') {
      const state = await getState();
      const balance = parseFloat(state.balance);
      if (balance <= 0) return res.status(400).json({ error: 'No hay saldo para reinvertir' });
      const pct = 70;
      const reinvAmt = parseFloat(((balance * pct) / 100).toFixed(2));
      const newBalance = parseFloat((balance - reinvAmt).toFixed(2));
      const newInvested = parseFloat((parseFloat(state.invested_capital) + reinvAmt).toFixed(2));
      await patchState({ balance: newBalance, invested_capital: newInvested });
      return res.status(200).json({ success: true, reinvested: reinvAmt, newBalance, newInvestedCapital: newInvested });
    }

    return res.status(404).json({ error: 'Ruta no encontrada', path });
  } catch (err) {
    console.error('Lanzarus API error:', err);
    return res.status(500).json({ error: err.message });
  }
};