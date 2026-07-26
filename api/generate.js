const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tolzqxflecqbjdefohom.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const AMAZON_TAG = 'r3dm01-21';

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

async function searchAmazonProducts(query) {
  try {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
    const url = `https://www.amazon.es/s?k=${encodeURIComponent(query)}&__mk_es_ES=%C3%85M%C3%85%C5%BD%C3%95%C3%91`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-ES,es;q=0.9',
      },
    });
    const html = await res.text();
    
    const products = [];
    // Extract ASINs from data-asin attributes
    const asinRegex = /data-asin="([A-Z0-9]{10})"/g;
    let match;
    const asins = [];
    while ((match = asinRegex.exec(html)) !== null) {
      if (match[1] !== '') asins.push(match[1]);
    }
    
    // Get unique ASINs, skip first (usually empty/promoted)
    const uniqueAsins = [...new Set(asins)].filter(a => a.length === 10);
    
    // Extract product info from sections
    const sections = html.split('data-component-type="s-search-result"');
    for (let i = 1; i < sections.length && i <= 5; i++) {
      const sec = sections[i];
      
      // Extract ASIN
      const asinM = sec.match(/data-asin="([A-Z0-9]{10})"/);
      const asin = asinM ? asinM[1] : (uniqueAsins[i-1] || '');
      if (!asin) continue;
      
      // Extract title
      let title = '';
      const titlePatterns = [
        /<span[^>]*class="a-text-normal"[^>]*>([^<]+)/,
        /class="a-size-medium[^"]*"[^>]*>([^<]+)/,
        /class="a-size-base-plus[^"]*"[^>]*>([^<]+)/,
        /aria-label="([^"]+)/,
        /alt="([^"]+)/,
      ];
      for (const pat of titlePatterns) {
        const tm = sec.match(pat);
        if (tm && tm[1].trim().length > 3) {
          title = tm[1].trim();
          break;
        }
      }
      if (!title) continue;
      
      // Extract price
      let price = '';
      const priceM = sec.match(/a-offscreen[^>]*>([^<€]*[0-9.,]+)/);
      if (priceM) price = priceM[1].trim();
      
      // Extract rating
      let rating = '';
      const ratingM = sec.match(/a-icon-alt[^>]*>([^<]+(?:de \d+ estrellas|estrellas de \d+))/);
      if (ratingM) {
        const r = ratingM[1].match(/([0-4](?:[.,]\d+)?|5)/);
        if (r) rating = r[1].replace(',', '.');
      }
      
      // Extract image
      let image = '';
      const imgM = sec.match(/src="(https:\/\/[^"]+\.jpg[^"]*)"/);
      if (imgM) image = imgM[1];
      
      products.push({
        asin,
        title: title.replace(/&#x27;/g, "'").replace(/&amp;/g, '&'),
        price,
        rating,
        image,
        url: `https://www.amazon.es/dp/${asin}?tag=${AMAZON_TAG}`,
      });
    }
    
    return products;
  } catch (e) {
    console.error('Amazon search error:', e.message);
    return [];
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { workerId, topic, prompt } = req.body;
    if (!topic || !prompt) return res.status(400).json({ error: 'Faltan topic o prompt' });

    // Search Amazon for products related to the topic
    const amazonProducts = await searchAmazonProducts(topic);

    let generatedText = '';
    let usedGemini = false;

    try {
      if (GEMINI_API_KEY && GEMINI_API_KEY.length > 10) {
        // Build product info for the prompt
        let productList = '';
        if (amazonProducts.length > 0) {
          productList = 'Productos relacionados en Amazon:\n' + amazonProducts.map(p => 
            `- ${p.title}${p.price ? ' (' + p.price + '€)' : ''}${p.rating ? ' ★' + p.rating : ''} - ${p.url}`
          ).join('\n');
        }

        const fullPrompt = `Eres un creador de contenido digital experto en marketing de afiliados.
Tema: ${topic}
Instrucciones: ${prompt}

${productList ? `\nIncluye estos productos de Amazon de forma natural en el contenido (como recomendaciones o enlaces útiles), con sus enlaces de afiliado:\n${productList}\n` : 'Busca productos relacionados con el tema en Amazon.es e incluye enlaces de afiliado (tag: r3dm01-21) de forma natural en el contenido.'}

IMPORTANTE: Genera contenido útil y atractivo. Los enlaces de productos deben integrarse de forma natural, como recomendaciones genuinas.`;

        generatedText = await callGemini(fullPrompt);
        usedGemini = true;
      }
    } catch (e) {}

    if (!generatedText) {
      // Fallback: generate basic content with product links
      let fallback = `### ${topic}\n\nContenido generado por Lanzarus sobre ${topic}.\n\n`;
      if (amazonProducts.length > 0) {
        fallback += '**Productos recomendados:**\n\n';
        amazonProducts.forEach(p => {
          fallback += `- [${p.title}${p.price ? ' (' + p.price + '€)' : ''}](${p.url})\n`;
        });
      }
      generatedText = fallback;
    }

    // Get current state (real data only, no fake money added)
    const state = await getState();

    return res.status(200).json({
      success: true,
      text: generatedText,
      amazonProducts,
      amazonProductsCount: amazonProducts.length,
      balance: state.balance || 0,
      netGains: state.net_gains || 0,
      investedCapital: state.invested_capital || 0,
      usedGemini,
      // Provide the search link for more products
      amazonSearchUrl: `https://www.amazon.es/s?k=${encodeURIComponent(topic)}&tag=${AMAZON_TAG}`,
    });
  } catch (err) {
    console.error('Generate error:', err);
    return res.status(500).json({ error: err.message });
  }
};