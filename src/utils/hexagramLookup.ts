/**
 * 文王序六十四卦：下卦（初–三爻）、上卦（四–上爻）各为八卦之一。
 * 八卦自下而上阴阳：坤000、艮001、坎010、巽011、震100、离101、兑110、乾111。
 * 与 `gua_data.json` 键名一致。
 */
export const GUA_KEYS_KING_WEN: readonly string[] = [
  '乾为天',
  '坤为地',
  '水雷屯',
  '山水蒙',
  '水天需',
  '天水讼',
  '地水师',
  '水地比',
  '风天小畜',
  '天泽履',
  '地天泰',
  '天地否',
  '天火同人',
  '火天大有',
  '地山谦',
  '雷地豫',
  '泽雷随',
  '山风蛊',
  '地泽临',
  '风地观',
  '火雷噬嗑',
  '山火贲',
  '山地剥',
  '地雷复',
  '天雷无妄',
  '山天大畜',
  '山雷颐',
  '泽风大过',
  '坎为水',
  '离为火',
  '泽山咸',
  '雷风恒',
  '天山遯',
  '雷天大壮',
  '火地晋',
  '地火明夷',
  '风火家人',
  '火泽睽',
  '水山蹇',
  '雷水解',
  '山泽损',
  '风雷益',
  '泽天夬',
  '天风姤',
  '泽地萃',
  '地风升',
  '泽水困',
  '水风井',
  '泽火革',
  '火风鼎',
  '震为雷',
  '艮为山',
  '风山渐',
  '雷泽归妹',
  '雷火丰',
  '火山旅',
  '巽为风',
  '兑为泽',
  '风水涣',
  '水泽节',
  '风泽中孚',
  '雷山小过',
  '水火既济',
  '火水未济',
]

/** 下卦、上卦索引（各 0–7）→ 文王序卦名在 GUA_KEYS_KING_WEN 中的下标 */
const LOWER_UPPER_TO_INDEX: readonly number[][] = [
  [1, 22, 7, 19, 15, 34, 44, 11],
  [14, 51, 38, 52, 61, 55, 30, 32],
  [6, 3, 28, 58, 39, 63, 46, 5],
  [45, 17, 47, 56, 31, 49, 27, 43],
  [23, 26, 2, 41, 50, 20, 16, 24],
  [35, 21, 62, 36, 54, 29, 48, 12],
  [18, 40, 59, 60, 53, 37, 57, 9],
  [10, 25, 4, 8, 33, 13, 42, 0],
]

export function trigramIndexFromLines(yang: readonly boolean[]): number {
  let t = 0
  if (yang[0]) t |= 1
  if (yang[1]) t |= 2
  if (yang[2]) t |= 4
  return t
}

export function hexagramKeyFromYaoYang(yangSix: readonly boolean[]): string {
  if (yangSix.length !== 6) return ''
  const lo = trigramIndexFromLines(yangSix.slice(0, 3))
  const hi = trigramIndexFromLines(yangSix.slice(3, 6))
  const idx = LOWER_UPPER_TO_INDEX[lo][hi]
  return GUA_KEYS_KING_WEN[idx] ?? ''
}

/** 爻名：初九、六二…（与本卦阴阳一致） */
export function yaoCiName(lineIndex: number, yang: boolean): string {
  const d = yang ? '九' : '六'
  if (lineIndex === 0) return `初${d}`
  if (lineIndex === 5) return `上${d}`
  const mid = ['二', '三', '四', '五'][lineIndex - 1]
  return `${mid}${d}`
}

export function hexagramKeyFromValues(
  values: readonly { value: 6 | 7 | 8 | 9 }[],
): string {
  if (values.length !== 6) return ''
  const yang = values.map((v) => v.value === 7 || v.value === 9)
  return hexagramKeyFromYaoYang(yang)
}

/** 变卦：动爻阴阳翻转 */
export function bianGuaYang(ben: readonly boolean[], moving: readonly boolean[]): boolean[] {
  return ben.map((y, i) => (moving[i] ? !y : y))
}
