export interface ChangeSnapshot {
  totalBefore: number
  left: number
  right: number
  guaYi: number
  leftRemainder: number
  rightRemainder: number
  discard: number
  remainAfter: number
}

export interface ManualSplit {
  left: number
  right: number
}

export const calculateSingleChange = (
  currentSticks: number,
  manual?: ManualSplit | null,
): ChangeSnapshot => {
  let left: number
  let originalRight: number

  if (manual != null) {
    left = manual.left
    originalRight = manual.right
    if (left + originalRight !== currentSticks) {
      throw new Error('manual split must sum to currentSticks')
    }
  } else {
    // 1. 分而为二 (随机拆分，保证每边至少有足够揲四的量)
    left = Math.floor(Math.random() * (currentSticks - 10)) + 5
    originalRight = currentSticks - left
  }

  // 2. 挂一
  const guaYi = 1
  const rightAfterGuaYi = originalRight - 1

  // 3. 揲之以四 (余数只能是 1, 2, 3, 4)
  const leftRemainder = left % 4 === 0 ? 4 : left % 4
  const rightRemainder = rightAfterGuaYi % 4 === 0 ? 4 : rightAfterGuaYi % 4

  // 4. 归奇 (挂一 + 左右余数)
  const discard = guaYi + leftRemainder + rightRemainder
  const remainAfter = currentSticks - discard

  return {
    totalBefore: currentSticks,
    left,
    right: originalRight,
    guaYi,
    leftRemainder,
    rightRemainder,
    discard,
    remainAfter,
  }
}

export interface SymbolInfo {
  name: string
  symbol: string
  active: boolean
  changeTo: string
}

export const getSymbolInfo = (value: 6 | 7 | 8 | 9): SymbolInfo => {
  const map: Record<6 | 7 | 8 | 9, SymbolInfo> = {
    6: { name: '老阴', symbol: '- -', active: true, changeTo: '—' },
    7: { name: '少阳', symbol: '—', active: false, changeTo: '—' },
    8: { name: '少阴', symbol: '- -', active: false, changeTo: '- -' },
    9: { name: '老阳', symbol: '—', active: true, changeTo: '- -' },
  }
  return map[value]
}

export interface StepExplanation {
  title: string
  text: string
  action: string
}

/** 与状态机 stepState 对应的仪式化解说（标题 / 正文 / 主按钮） */
export const stepExplanations: Record<
  'INIT' | 'DIVIDE' | 'GUA_YI' | 'SHE_SI' | 'COLLECT' | 'FINISH',
  StepExplanation
> = {
  INIT: {
    title: '大衍之数五十，其用四十有九',
    text: '取五十根蓍草，遁去其一，象太极不变。剩余四十九根作为演算基数。',
    action: '点击分草',
  },
  DIVIDE: {
    title: '第一营：分而为二以象两',
    text: '在中央蓍草堆上横向划线，依线位比例分为天（左）、地（右）两堆。',
    action: '请划线分草',
  },
  GUA_YI: {
    title: '第二营：挂一以象三',
    text: '从右侧取出一根蓍草，挂于指间，象征天地人三才中的“人”。',
    action: '点击揲四',
  },
  SHE_SI: {
    title: '第三营：揲之以四以象四时',
    text: '左右两手之策，分别以四根为一组依次数去，象征春夏秋冬四时交替。',
    action: '点击归奇',
  },
  COLLECT: {
    title: '第四营：归奇于扐以象闰',
    text: '将左右两手最后的余数与挂一之策合并，放于一旁，象征积闰成月。一变完成。',
    action: '进入下一变',
  },
  FINISH: {
    title: '十有八变而成卦',
    text: '六爻皆定，本卦与变卦已出。请解卦。',
    action: '查看卦辞',
  },
}
