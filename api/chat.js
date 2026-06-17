import https from 'https';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const HF_TOKEN = (process.env.HF_TOKEN || '').replace(/[\uFEFF\u200B\u00A0]/g, '').trim();
    if (!HF_TOKEN) {
      return res.status(500).json({ error: 'HF_TOKEN not configured' });
    }

    const { messages } = req.body || {};
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    // Build Zephyr-style prompt
    const prompt = messages.map(m => {
      if (m.role === 'system') return `<|system|>\n${m.content}</s>`;
      if (m.role === 'user') return `<|user|>\n${m.content}</s>`;
      return `<|assistant|>\n${m.content}</s>`;
    }).join('\n') + '\n<|assistant|>\n';

    const payload = JSON.stringify({
      inputs: prompt,
      parameters: { max_new_tokens: 300, temperature: 0.7, return_full_text: false },
    });

    // Try multiple HF endpoints
    const endpoints = [
      'huggingface.co',
      'api-inference.huggingface.co',
    ];

    let hfResponse = null;
    let lastError = '';

    for (const host of endpoints) {
      try {
        hfResponse = await makeRequest(
          host,
          '/models/HuggingFaceH4/zephyr-7b-beta',
          HF_TOKEN,
          payload
        );
        if (hfResponse.status === 200) break;
      } catch (e) {
        lastError = String(e);
        hfResponse = null;
      }
    }

    if (!hfResponse) {
      return res.status(502).json({ error: 'All HF endpoints failed', details: lastError });
    }

    if (hfResponse.status !== 200) {
      return res.status(502).json({
        error: 'HF API error',
        status: hfResponse.status,
        details: hfResponse.body.substring(0, 300),
      });
    }

    let reply = 'Sorry, I could not generate a response.';
    try {
      const data = JSON.parse(hfResponse.body);
      if (Array.isArray(data) && data[0]?.generated_text) {
        reply = data[0].generated_text.trim();
      }
    } catch {
      reply = hfResponse.body.substring(0, 500);
    }

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({ error: 'Server error', details: String(error).substring(0, 300) });
  }
}

function makeRequest(hostname, path, token, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      path,
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        resolve({ status: response.statusCode, body: data });
      });
    });

    req.on('error', (err) => reject(err));
    req.setTimeout(25000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}
