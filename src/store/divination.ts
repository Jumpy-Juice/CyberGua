import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import {
  calculateSingleChange,
  getSymbolInfo,
  type ChangeSnapshot,
  type ManualSplit,
} from '@/utils/algorithm'

export type StepState =
  | 'INIT'
  | 'DIVIDE'
  | 'GUA_YI'
  | 'SHE_SI'
  | 'COLLECT'
  | 'FINISH'

export interface DynamicExplain {
  title: string
  desc: string
  math: string
}

export interface HexagramLine extends ReturnType<typeof getSymbolInfo> {
  value: 6 | 7 | 8 | 9
  /** 成爻时台面剩余策数（用于展示 ÷4 推演） */
  remainAfter?: number
}

/** 进入第一营：仅切状态，等待手势划线分草（无 snapshot） */
function enterDividePending(
  stepState: { value: StepState },
  currentSnapshot: { value: ChangeSnapshot | null },
) {
  stepState.value = 'DIVIDE'
  currentSnapshot.value = null
}

function resetDivinationCore(
  stepState: { value: StepState },
  currentSticks: { value: number },
  currentYaoIndex: { value: number },
  currentChangeIndex: { value: number },
  currentSnapshot: { value: ChangeSnapshot | null },
  hexagram: { value: HexagramLine[] },
) {
  stepState.value = 'INIT'
  currentSticks.value = 49
  currentYaoIndex.value = 1
  currentChangeIndex.value = 1
  currentSnapshot.value = null
  hexagram.value = []
}

export const useDivinationStore = defineStore('divination', () => {
  const isStarted = ref(false)
  const question = ref('')

  const stepState = ref<StepState>('INIT')
  const currentSticks = ref(49)
  const currentYaoIndex = ref(1)
  const currentChangeIndex = ref(1)
  const currentSnapshot = shallowRef<ChangeSnapshot | null>(null)
  const hexagram = ref<HexagramLine[]>([])

  function nextStep(manual?: ManualSplit) {
    if (stepState.value === 'FINISH') return

    if (stepState.value === 'INIT') {
      enterDividePending(stepState, currentSnapshot)
      return
    }

    if (stepState.value === 'DIVIDE') {
      if (manual != null && currentSnapshot.value == null) {
        const total = currentSticks.value
        let left = Math.round(manual.left)
        let right = Math.round(manual.right)
        if (left + right !== total) {
          right = total - left
        }
        const minSide = 5
        left = Math.min(Math.max(left, minSide), total - minSide)
        right = total - left
        if (right < minSide) {
          right = minSide
          left = total - right
        }
        currentSnapshot.value = calculateSingleChange(total, { left, right })
        return
      }
      if (currentSnapshot.value == null) return
      stepState.value = 'GUA_YI'
      return
    }

    if (stepState.value === 'GUA_YI') {
      stepState.value = 'SHE_SI'
      return
    }

    if (stepState.value === 'SHE_SI') {
      stepState.value = 'COLLECT'
      return
    }

    if (stepState.value === 'COLLECT') {
      const snap = currentSnapshot.value
      if (!snap) return

      if (currentChangeIndex.value < 3) {
        currentSticks.value = snap.remainAfter
        currentChangeIndex.value += 1
        enterDividePending(stepState, currentSnapshot)
        return
      }

      const yaoValue = snap.remainAfter / 4
      const v = yaoValue as 6 | 7 | 8 | 9
      hexagram.value.push({
        value: v,
        ...getSymbolInfo(v),
        remainAfter: snap.remainAfter,
      })

      if (currentYaoIndex.value < 6) {
        currentYaoIndex.value += 1
        currentSticks.value = 49
        currentChangeIndex.value = 1
        enterDividePending(stepState, currentSnapshot)
      } else {
        stepState.value = 'FINISH'
        currentSnapshot.value = null
      }
    }
  }

  function startGame(q: string) {
    question.value = q.trim()
    isStarted.value = true
    resetDivinationCore(
      stepState,
      currentSticks,
      currentYaoIndex,
      currentChangeIndex,
      currentSnapshot,
      hexagram,
    )
  }

  function reset() {
    question.value = ''
    isStarted.value = false
    resetDivinationCore(
      stepState,
      currentSticks,
      currentYaoIndex,
      currentChangeIndex,
      currentSnapshot,
      hexagram,
    )
  }

  const currentDynamicExplain = computed((): DynamicExplain => {
    const snap = currentSnapshot.value
    const s = stepState.value

    switch (s) {
      case 'INIT':
        return {
          title: '大衍之数五十，其用四十有九',
          desc: '取五十根蓍草，遁去其一象太极。剩余 49 根作为本次演算的初始基数。',
          math: '当前总基数：49',
        }
      case 'DIVIDE':
        return {
          title: '第一营：分而为二以象两',
          desc: snap
            ? '信手将蓍草分为左右两堆，左象天，右象地。'
            : '在中央蓍草处横向划线，依线位比例分为天（左）、地（右）两堆。',
          math: snap
            ? `左手(天)：${snap.left} 根，右手(地)：${snap.right} 根`
            : '指尖划过，分天定地。',
        }
      case 'GUA_YI':
        return {
          title: '第二营：挂一以象三',
          desc: '从右手取出一根挂于指间，象天地人三才之「人」。此根不再参与本轮数取。',
          math: snap ? `右手剩余：${snap.right - 1} 根，挂一：1 根` : '',
        }
      case 'SHE_SI':
        return {
          title: '第三营：揲之以四以象四时',
          desc: '左右两手之策，分别以四根为一组依次数去（象征春夏秋冬），取最后的余数（1、2、3 或 4）。',
          math: snap
            ? `左手余数：${snap.leftRemainder}，右手余数：${snap.rightRemainder}`
            : '',
        }
      case 'COLLECT':
        return {
          title: '第四营：归奇于扐以象闰',
          desc: '将左右余数与挂一之策合并，放于一旁（象积闰成月）。一变完成。',
          math: snap
            ? `弃去：1(挂) + ${snap.leftRemainder}(左余) + ${snap.rightRemainder}(右余) = ${snap.discard}。下一变起始基数：${snap.remainAfter}`
            : '',
        }
      case 'FINISH':
        return {
          title: '十有八变而成卦',
          desc:
            hexagram.value.length === 6
              ? '六爻皆定，本卦与变卦已列于右侧。完整卦辞与今译请点页眉「卦象与易解」。'
              : '六爻皆定。卦象将成，请稍候。',
          math:
            hexagram.value.length === 6
              ? '卦象已成：六爻自下而上依次为初、二、三、四、五、上。'
              : '',
        }
      default:
        return {
          title: '演算中',
          desc: '',
          math: '',
        }
    }
  })

  return {
    isStarted,
    question,
    stepState,
    currentSticks,
    currentYaoIndex,
    currentChangeIndex,
    currentSnapshot,
    hexagram,
    currentDynamicExplain,
    nextStep,
    startGame,
    reset,
  }
})
