import cors from 'cors'
import express from 'express'

const app = express()

app.use(cors())
app.use(express.json({ limit: '1mb' }))

const ARK_CHAT_URL =
  process.env.ARK_CHAT_URL?.trim() ||
  'https://ark.cn-beijing.volces.com/api/v3/chat/completions'

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/ark/chat/completions', async (req, res) => {
  const apiKey = process.env.ARK_API_KEY?.trim()
  if (!apiKey) {
    res.status(500).json({ error: { message: 'Missing ARK_API_KEY' } })
    return
  }

  try {
    const upstream = await fetch(ARK_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    })

    const raw = await upstream.text()
    res.status(upstream.status)
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.send(raw)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    res.status(502).json({ error: { message: `Upstream request failed: ${message}` } })
  }
})

const port = Number(process.env.PORT || 3000)
app.listen(port, () => {
  console.log(`ark-proxy listening on :${port}`)
})
