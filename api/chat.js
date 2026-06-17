export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // Edge functions always receive the method correctly
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed', method: request.method }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const HF_TOKEN = process.env.HF_TOKEN;
  if (!HF_TOKEN) {
    return new Response(JSON.stringify({ error: 'HF_TOKEN not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages array is required', received: typeof body }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Use HuggingFace Inference API with a model that works on free tier
    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'HuggingFaceH4/zephyr-7b-beta',
          messages: messages,
          max_tokens: 400,
          temperature: 0.7,
        }),
      }
    );

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      return new Response(JSON.stringify({ 
        error: 'AI service unavailable', 
        status: hfResponse.status, 
        details: errorText.substring(0, 200) 
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await hfResponse.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal error', details: String(error).substring(0, 200) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
