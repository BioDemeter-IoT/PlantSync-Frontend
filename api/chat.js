export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const HF_TOKEN = process.env.HF_TOKEN;
    if (!HF_TOKEN) {
      return res.status(500).json({ error: 'HF_TOKEN not configured on server' });
    }

    const { messages } = req.body || {};
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required', body: JSON.stringify(req.body).substring(0, 100) });
    }

    // Build Zephyr-style prompt
    const prompt = messages.map(m => {
      if (m.role === 'system') return `<|system|>\n${m.content}</s>`;
      if (m.role === 'user') return `<|user|>\n${m.content}</s>`;
      return `<|assistant|>\n${m.content}</s>`;
    }).join('\n') + '\n<|assistant|>\n';

    const hfRes = await fetch(
      'https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 300,
            temperature: 0.7,
            return_full_text: false,
          },
        }),
      }
    );

    const responseText = await hfRes.text();

    if (!hfRes.ok) {
      return res.status(502).json({
        error: 'HF API error',
        status: hfRes.status,
        details: responseText.substring(0, 300),
      });
    }

    let reply = 'Sorry, I could not generate a response.';
    try {
      const data = JSON.parse(responseText);
      if (Array.isArray(data) && data[0]?.generated_text) {
        reply = data[0].generated_text.trim();
      } else if (data?.generated_text) {
        reply = data.generated_text.trim();
      }
    } catch {
      reply = responseText.substring(0, 500);
    }

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({ error: 'Server error', details: String(error).substring(0, 300) });
  }
}
