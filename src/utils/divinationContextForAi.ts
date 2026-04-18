import type { HexagramLine } from '@/store/divination'
import guaData from '@/assets/gua_data.json'
import { bianGuaYang, hexagramKeyFromValues, yaoCiName } from '@/utils/hexagramLookup'

type GuaKey = keyof typeof guaData
type GuaEntry = (typeof guaData)[GuaKey] & {
  yong?: { name: string; text: string; trans: string }
}

function lineYang(v: HexagramLine): boolean {
  return v.value === 7 || v.value === 9
}

function yaoOrderLabel(i: number): string {
  const labels = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻']
  return labels[i] ?? `第${i + 1}爻`
}

function lineKind(line: HexagramLine): string {
  const v = line.value
  if (v === 9) return '老阳（动，阳极生阴）'
  if (v === 6) return '老阴（动，阴极生阳）'
  if (v === 7) return '少阳（不变）'
  return '少阴（不变）'
}

/** 将本卦、变卦与经文摘要整理为发给大模型的纯文本（与页面「解卦」同源数据） */
export function buildDivinationContextForAi(hexagram: HexagramLine[]): string | null {
  if (hexagram.length !== 6) return null

  const ben = hexagram.map(lineYang)
  const moving = hexagram.map((l) => l.active)
  const benKey = hexagramKeyFromValues(hexagram)
  if (!benKey || !(benKey in guaData)) return null
  const benEntry = guaData[benKey as GuaKey] as GuaEntry

  const bianKey = hexagramKeyFromValues(
    bianGuaYang(ben, moving).map((yang) => ({
      value: yang ? (7 as const) : (8 as const),
    })),
  )
  const bianEntry =
    bianKey && bianKey !== benKey && bianKey in guaData
      ? (guaData[bianKey as GuaKey] as GuaEntry)
      : null

  const lines: string[] = []
  lines.push('【爻象自下而上】')
  hexagram.forEach((line, i) => {
    lines.push(`${yaoOrderLabel(i)}：${lineKind(line)}`)
  })
  lines.push('')
  lines.push(`【本卦】${benKey}`)
  lines.push('卦辞（原文）：' + benEntry.guaci)
  if (benEntry.guaci_trans && benEntry.guaci_trans !== '【译文】') {
    lines.push('卦辞（今译）：' + benEntry.guaci_trans)
  }

  const movingIndices: number[] = []
  hexagram.forEach((l, i) => {
    if (l.active) movingIndices.push(i)
  })

  if (movingIndices.length) {
    lines.push('')
    lines.push('【动爻爻辞（本卦）】')
    for (const i of movingIndices) {
      const y = benEntry.yaoci[i]
      const name = y?.name ?? yaoCiName(i, lineYang(hexagram[i]!))
      lines.push(`— ${name} —`)
      lines.push('原文：' + (y?.text ?? ''))
      if (y?.trans && y.trans !== '【译文】') lines.push('今译：' + y.trans)
    }
  } else {
    lines.push('')
    lines.push('【动爻】无（六爻皆不变，以卦辞为主。）')
  }

  if (benEntry.yong) {
    lines.push('')
    lines.push(`【${benEntry.yong.name}】`)
    lines.push('原文：' + benEntry.yong.text)
    lines.push('今译：' + benEntry.yong.trans)
  }

  if (bianEntry && bianKey !== benKey) {
    lines.push('')
    lines.push(`【变卦】${bianKey}`)
    lines.push('卦辞（原文）：' + bianEntry.guaci)
    if (bianEntry.guaci_trans && bianEntry.guaci_trans !== '【译文】') {
      lines.push('卦辞（今译）：' + bianEntry.guaci_trans)
    }
  }

  return lines.join('\n')
}
