const ARK_CHAT_URL =
  process.env.ARK_CHAT_URL?.trim() ||
  'https://ark.cn-beijing.volces.com/api/v3/chat/completions'

function json(data, statusCode = 200) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(data),
  }
}

function parseBody(raw) {
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }

  if (event.httpMethod !== 'POST') {
    return json({ error: { message: 'Method Not Allowed' } }, 405)
  }

  const apiKey = process.env.ARK_API_KEY?.trim()
  if (!apiKey) {
    return json(
      { error: { message: 'Server missing ARK_API_KEY environment variable' } },
      500,
    )
  }

  try {
    const payload = parseBody(event.body)
    const upstream = await fetch(ARK_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const text = await upstream.text()
    return {
      statusCode: upstream.status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: text,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return json({ error: { message: `Upstream request failed: ${message}` } }, 502)
  }
}
