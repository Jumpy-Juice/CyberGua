import { ARK_SYSTEM_PROMPT } from '@/constants/arkPrompt'

function chatUrl(): string {
  const p = import.meta.env.VITE_ARK_CHAT_PATH?.trim()
  if (p) return p
  return '/api/ark/chat/completions'
}

function extractAssistantText(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const rec = data as Record<string, unknown>
  const choices = rec.choices
  if (!Array.isArray(choices) || choices.length === 0) return ''
  const msg = choices[0] as Record<string, unknown> | undefined
  const message = msg?.message as Record<string, unknown> | undefined
  const content = message?.content
  return typeof content === 'string' ? content.trim() : ''
}

/**
 * 调用火山方舟 OpenAI 兼容「对话」接口，返回助手正文。
 * 开发环境默认请求同源 `/api/ark/...`，由 Vite 代理转发并附带 Authorization。
 */
export async function requestArkInterpretation(input: {
  question: string
  context: string
}): Promise<string> {
  const model = import.meta.env.VITE_ARK_MODEL?.trim()
  if (!model) {
    throw new Error(
      '未配置 VITE_ARK_MODEL：请在 .env.local 中填写模型 ID（如 doubao-seed-2-0-pro-260215）或接入点 ep-…',
    )
  }

  const userBlock = [
    '【占问】',
    input.question.trim() || '（用户未写下具体问题，仅泛问吉凶或默占。）',
    '',
    '【程序整理的卦象与经文摘要】',
    input.context,
  ].join('\n')

  const res = await fetch(chatUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: ARK_SYSTEM_PROMPT },
        { role: 'user', content: userBlock },
      ],
      temperature: 0.65,
      max_tokens: 2048,
    }),
  })

  const raw = await res.text()
  if (!res.ok) {
    let detail = raw.slice(0, 400)
    try {
      const j = JSON.parse(raw) as Record<string, unknown>
      const err = j.error as Record<string, unknown> | undefined
      if (err && typeof err.message === 'string') detail = err.message
    } catch {
      /* use raw */
    }
    throw new Error(`方舟接口错误 (${res.status})：${detail || res.statusText}`)
  }

  let data: unknown
  try {
    data = JSON.parse(raw) as unknown
  } catch {
    throw new Error('方舟返回非 JSON，无法解析')
  }

  const text = extractAssistantText(data)
  if (!text) throw new Error('模型未返回正文，请检查接入点与模型是否可用')
  return text
}
