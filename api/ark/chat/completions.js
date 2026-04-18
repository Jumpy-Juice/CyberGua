const ARK_CHAT_URL =
  process.env.ARK_CHAT_URL?.trim() ||
  'https://ark.cn-beijing.volces.com/api/v3/chat/completions'

function parseBody(reqBody) {
  if (!reqBody) return {}
  if (typeof reqBody === 'string') {
    try {
      return JSON.parse(reqBody)
    } catch {
      return {}
    }
  }
  if (typeof reqBody === 'object') return reqBody
  return {}
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'Method Not Allowed' } })
    return
  }

  const apiKey = process.env.ARK_API_KEY?.trim()
  if (!apiKey) {
    res.status(500).json({
      error: { message: 'Server missing ARK_API_KEY environment variable' },
    })
    return
  }

  const payload = parseBody(req.body)

  try {
    const upstream = await fetch(ARK_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const raw = await upstream.text()
    res.status(upstream.status)
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.send(raw)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    res.status(502).json({ error: { message: `Upstream request failed: ${message}` } })
  }
}
