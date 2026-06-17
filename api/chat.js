export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const HF_TOKEN = process.env.HF_TOKEN;
    if (!HF_TOKEN) {
      return new Response(JSON.stringify({ error: 'Token not set' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body', details: String(e) }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { messages } = body;
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages array required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Use simple text generation endpoint (more reliable on free tier)
    const prompt = messages.map(m => {
      if (m.role === 'system') return `<|system|>\n${m.content}</s>`;
      if (m.role === 'user') return `<|user|>\n${m.content}</s>`;
      return `<|assistant|>\n${m.content}</s>`;
    }).join('\n') + '\n<|assistant|>\n';

    const hfResponse = await fetch(
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

    const responseText = await hfResponse.text();

    if (!hfResponse.ok) {
      return new Response(JSON.stringify({ 
        error: 'HF API error', 
        status: hfResponse.status, 
        details: responseText.substring(0, 300)
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
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

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error', details: String(error).substring(0, 300) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
