export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { admob = 0, affiliate = 0, total = 0, goal = 50 } = req.body || {};
  const ingresos = parseFloat(total) || (parseFloat(admob) + parseFloat(affiliate));
  const restaMeta = Math.max(0, parseFloat(goal) - ingresos).toFixed(2);
  const porcentaje = Math.min(100, ((ingresos / parseFloat(goal)) * 100)).toFixed(1);

  const SYSTEM = `Eres un bot de reinversión financiera para creadores de apps independientes en España. 
Tu trabajo es analizar los ingresos actuales del usuario (AdMob + afiliados Amazon) y generar un plan de reinversión concreto, accionable y realista.
Siempre estructura tu respuesta en 3 secciones:
1. 📊 ANÁLISIS — qué significan estos números ahora mismo
2. 🔄 REINVERSIÓN — exactamente dónde y cuánto reinvertir (porcentajes concretos)
3. 🚀 PRÓXIMO HITO — qué hacer esta semana para crecer más rápido
Sé directo, sin rodeos, máximo 8 frases en total.`;

  const userMsg = `Mis ingresos actuales:
- AdMob: €${admob}
- Afiliados Amazon: €${affiliate}
- Total acumulado: €${ingresos.toFixed(2)}
- Meta: €${goal} (llevo ${porcentaje}%, faltan €${restaMeta})

Dame mi plan de reinversión ahora mismo.`;

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: userMsg }
        ],
        max_tokens: 400,
        temperature: 0.6
      })
    });

    const data = await groqRes.json();
    const plan = data.choices?.[0]?.message?.content || 'Sin respuesta';
    return res.status(200).json({ plan, ingresos: ingresos.toFixed(2), porcentaje, restaMeta });
  } catch (e) {
    return res.status(500).json({ error: 'Error al generar plan' });
  }
}
