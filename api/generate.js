const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
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
  return { balance: 0, net_gains: 0, invested_capital: 0, total_withdrawals: 0 };
}

async function patchState(fields) {
  await supa('lanzarus_state?id=eq.main', {
    method: 'PATCH',
    body: JSON.stringify({ ...fields, updated_at: new Date().toISOString() }),
  });
}

async function callGemini(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { workerId, topic, prompt } = req.body;
    if (!topic || !prompt) return res.status(400).json({ error: 'Faltan topic o prompt' });

    let generatedText = '';
    let usedGemini = false;
    try {
      if (GEMINI_API_KEY && GEMINI_API_KEY.length > 10) {
        const fullPrompt = `Eres un experto en marketing de contenidos y monetización digital.
Tema: ${topic}
Instrucciones: ${prompt}

Genera el contenido solicitado de forma profesional.`;
        generatedText = await callGemini(fullPrompt);
        usedGemini = true;
      }
    } catch (e) {}

    if (!generatedText) {
      generatedText = `### Contenido Generado: ${topic}\n\nGuia automatizada sobre ${topic} generada por Lanzarus.`;
    }

    const reward = Math.floor(18 + Math.random() * 22);
    const reinvest70 = parseFloat((reward * 0.7).toFixed(2));
    const net30 = parseFloat((reward * 0.3).toFixed(2));

    const state = await getState();
    const currentBalance = parseFloat(state.balance) || 0;
    const currentNetGains = parseFloat(state.net_gains) || 0;
    const currentInvested = parseFloat(state.invested_capital) || 0;

    const newBalance = parseFloat((currentBalance + net30).toFixed(2));
    const newNetGains = parseFloat((currentNetGains + reward).toFixed(2));
    const newInvested = parseFloat((currentInvested + reinvest70).toFixed(2));

    await patchState({
      balance: newBalance,
      net_gains: newNetGains,
      invested_capital: newInvested,
    });

    return res.status(200).json({
      success: true,
      text: usedGemini ? generatedText : `[Fallback] ${generatedText}`,
      revenue: reward,
      reinvestAmt: reinvest70,
      netAmt: net30,
      balance: newBalance,
      netGains: newNetGains,
      investedCapital: newInvested,
      usedGemini,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}