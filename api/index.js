const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tolzqxflecqbjdefohom.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const PAYPAL_CLIENT_ID = 'BAA3MuwE5mIUv31OKkn4BFJF7gYl8xSsvhE4OIWc3CcSxP9E13bL5iGEM0UQwWcuBKaM-UPHeI2kj5hWLw';
const PAYPAL_SECRET = 'EPyKQ1cUN5fTh-pWKdr1L8RjqVWmBKwLfN_K8maiJXoX7MOMM7d1ajqgSILYN4pceX51Bf6tT998UxEW';
const PAYPAL_API = 'https://api-m.paypal.com';

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

async function getPayPalToken() {
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 
      'Authorization': 'Basic ' + Buffer.from(PAYPAL_CLIENT_ID + ':' + PAYPAL_SECRET).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' })
  });
  const data = await res.json();
  return data.access_token;
}

async function addTransaction(type, amount, description, paymentId) {
  const tx = {
    type,
    amount: parseFloat(amount.toFixed(2)),
    description: description || '',
    payment_id: paymentId || '',
    date: new Date().toISOString(),
    status: 'completed'
  };
  await supa('lanzarus_transactions', {
    method: 'POST',
    body: JSON.stringify(tx),
  });
  return tx;
}

const aiWorkers = [
  { id: 'ai-1', name: 'ContentBot Alpha', topic: 'Marketing Afiliados', status: 'activo', baseIncomeRate: 0, totalGenerated: 0, color: '#00ff88' },
  { id: 'ai-2', name: 'TradeBot Beta', topic: 'Análisis Financiero', status: 'activo', baseIncomeRate: 0, totalGenerated: 0, color: '#00d4ff' },
  { id: 'ai-3', name: 'AffiliateBot Gamma', topic: 'Contenido Amazon', status: 'activo', baseIncomeRate: 0, totalGenerated: 0, color: '#a855f7' },
  { id: 'ai-4', name: 'CryptoBot Delta', topic: 'Cripto Educación', status: 'activo', baseIncomeRate: 0, totalGenerated: 0, color: '#ff6b35' },
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  try {
    // GET /api/ o /api/data — Dashboard principal
    if (req.method === 'GET' && (path === '/' || path === '/api' || path === '/api/data')) {
      const st = await getState();
      
      // Get recent transactions
      let transactions = [];
      try {
        const tx = await supa('lanzarus_transactions?order=date.desc&limit=20');
        if (Array.isArray(tx)) transactions = tx;
      } catch(e) {}

      return res.status(200).json({
        balance: parseFloat(st.balance) || 0,
        netGains: parseFloat(st.net_gains) || 0,
        investedCapital: parseFloat(st.invested_capital) || 0,
        totalWithdrawals: parseFloat(st.total_withdrawals) || 0,
        reinvestmentFund: 0,
        collaborators: [],
        transactions,
        webhookLogs: [],
        aiWorkers: aiWorkers.map(w => ({
          ...w,
          totalGenerated: 0,
          todayRevenue: 0,
        })),
        admobEarnings: 0,
        affiliateEarnings: 0,
        // Información de conexiones reales
        connections: {
          paypal: true,
          admob: true,
          amazon: true,
        },
        lastUpdated: new Date().toISOString(),
      });
    }

    // =============================================
    // PAYPAL — CREAR PAGO (DEPÓSITO)
    // =============================================
    if (req.method === 'POST' && path === '/api/paypal/create') {
      const { amount } = req.body || {};
      const num = parseFloat(amount);
      if (!num || num < 1) return res.status(400).json({ error: 'Mínimo 1€' });
      if (num > 1000) return res.status(400).json({ error: 'Máximo 1000€' });

      const token = await getPayPalToken();
      const paymentRes = await fetch(`${PAYPAL_API}/v1/payments/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          intent: 'sale',
          payer: { payment_method: 'paypal' },
          transactions: [{
            amount: { total: num.toFixed(2), currency: 'EUR' },
            description: 'Depósito Lanzarus'
          }],
          redirect_urls: {
            return_url: 'https://lanzarus.vercel.app/paypal-success',
            cancel_url: 'https://lanzarus.vercel.app/paypal-cancel'
          }
        })
      });
      const payment = await paymentRes.json();
      
      if (payment.state === 'created') {
        const approvalUrl = payment.links?.find(l => l.rel === 'approval_url')?.href;
        return res.status(200).json({
          success: true,
          paymentId: payment.id,
          approvalUrl,
          state: payment.state
        });
      }
      return res.status(500).json({ error: 'Error al crear pago' });
    }

    // =============================================
    // PAYPAL — EJECUTAR PAGO (CONFIRMAR DEPÓSITO)
    // =============================================
    if (req.method === 'POST' && path === '/api/paypal/execute') {
      const { paymentId, payerId } = req.body || {};
      if (!paymentId || !payerId) return res.status(400).json({ error: 'Faltan datos' });

      const token = await getPayPalToken();
      const executeRes = await fetch(`${PAYPAL_API}/v1/payments/payment/${paymentId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ payer_id: payerId })
      });
      const result = await executeRes.json();

      if (result.state === 'approved') {
        const amount = parseFloat(result.transactions[0].amount.total);
        const state = await getState();
        const newBalance = parseFloat((state.balance || 0) + amount).toFixed(2);
        const newGains = parseFloat((state.net_gains || 0) + amount).toFixed(2);
        
        await patchState({ balance: newBalance, net_gains: newGains });
        await addTransaction('DEPOSIT', amount, 'Depósito PayPal', paymentId);

        return res.status(200).json({
          success: true,
          balance: parseFloat(newBalance),
          amount,
          message: `Depósito de ${amount.toFixed(2)}€ confirmado ✅`
        });
      }
      return res.status(500).json({ error: 'Pago no aprobado' });
    }

    // =============================================
    // PAYPAL — RETIRAR DINERO (PAYOUT)
    // =============================================
    if (req.method === 'POST' && path === '/api/paypal/withdraw') {
      const { amount, email } = req.body || {};
      const num = parseFloat(amount);
      if (!num || num < 5) return res.status(400).json({ error: 'Mínimo 5€' });

      const state = await getState();
      const currentBalance = parseFloat(state.balance) || 0;
      if (num > currentBalance) return res.status(400).json({ error: 'Saldo insuficiente' });

      const recipientEmail = email || 'joanlazaro83@gmail.com';
      const token = await getPayPalToken();

      const payoutRes = await fetch(`${PAYPAL_API}/v1/payments/payouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sender_batch_header: {
            sender_batch_id: `LANZARUS_${Date.now()}`,
            email_subject: 'Retiro Lanzarus',
            email_message: 'Has retirado dinero de tu cuenta Lanzarus'
          },
          items: [{
            recipient_type: 'EMAIL',
            amount: { value: num.toFixed(2), currency: 'EUR' },
            receiver: recipientEmail,
            note: 'Retiro de fondos Lanzarus',
            sender_item_id: `WITHDRAW_${Date.now()}`
          }]
        })
      });
      const payout = await payoutRes.json();
      
      if (payout.batch_header?.payout_batch_id) {
        const newBalance = parseFloat((currentBalance - num).toFixed(2));
        const newWithdrawals = parseFloat((state.total_withdrawals || 0) + num).toFixed(2);
        await patchState({ balance: newBalance, total_withdrawals: newWithdrawals });
        await addTransaction('WITHDRAWAL', num, `Retiro a PayPal (${recipientEmail})`, payout.batch_header.payout_batch_id);

        return res.status(200).json({
          success: true,
          balance: newBalance,
          amount: num,
          batchId: payout.batch_header.payout_batch_id,
          message: `Retiro de ${num.toFixed(2)}€ enviado a ${recipientEmail} ✅`
        });
      }
      return res.status(500).json({ error: 'Error al procesar retiro' });
    }

    // =============================================
    // INGRESO MANUAL (ADMIN — para cuando cobres AdMob/Amazon)
    // =============================================
    if (req.method === 'POST' && path === '/api/income') {
      const { amount, source, description } = req.body || {};
      const num = parseFloat(amount);
      if (!num || num <= 0) return res.status(400).json({ error: 'Cantidad inválida' });

      const state = await getState();
      const newBalance = parseFloat((state.balance || 0) + num).toFixed(2);
      const newGains = parseFloat((state.net_gains || 0) + num).toFixed(2);
      
      await patchState({ balance: newBalance, net_gains: newGains });
      const tx = await addTransaction('INCOME', num, description || `Ingreso: ${source || 'Manual'}`, '');

      return res.status(200).json({
        success: true,
        balance: parseFloat(newBalance),
        transaction: tx,
        message: `+${num.toFixed(2)}€ registrado ✅`
      });
    }

    // Fallback
    return res.status(404).json({ error: 'Ruta no encontrada' });

  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: err.message });
  }
};