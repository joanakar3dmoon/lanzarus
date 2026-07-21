export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Invalid messages' });

  const SYSTEM = `Eres un asesor financiero experto y directo. Ayudas a inversores españoles con consejos sobre inversiones, ahorro, criptomonedas, ETFs e ingresos pasivos. Respuestas cortas, claras y accionables. Máximo 4 frases. Sin rodeos.`;

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [{ role: 'system', content: SYSTEM }, ...messages.slice(-6)],
        max_tokens: 300,
        temperature: 0.7
      })
    });

    const data = await groqRes.json();
    const answer = data.choices?.[0]?.message?.content || 'Sin respuesta';
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ answer });
  } catch (e) {
    return res.status(500).json({ error: 'Error al conectar con IA' });
  }
}
