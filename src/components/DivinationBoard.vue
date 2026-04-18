<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import gsap from 'gsap'
import { storeToRefs } from 'pinia'
import { useDivinationStore } from '@/store/divination'
import type { ChangeSnapshot } from '@/utils/algorithm'

const store = useDivinationStore()
const { currentSnapshot, stepState } = storeToRefs(store)

const boardRef = ref<HTMLElement | null>(null)
const overlayRef = ref<HTMLElement | null>(null)

const showDivideOverlay = computed(
  () => stepState.value === 'DIVIDE' && currentSnapshot.value == null,
)

const isDrawing = ref(false)
const previewLeft = ref<number | null>(null)
const lineVisible = ref(false)
const lineX1 = ref(0)
const lineY1 = ref(0)
const lineX2 = ref(0)
const lineY2 = ref(0)
const activePointerId = ref<number | null>(null)

const MIN_DRAG = 28

/** 当前参与运算的蓍草 ID（1–49），顺序与分堆一致 */
const activeSticks = ref<number[]>(Array.from({ length: 49 }, (_, i) => i + 1))
/** 已归奇废弃的 ID */
const discardedSticks = ref<number[]>([])

const leftIds = ref<number[]>([])
const rightIds = ref<number[]>([])
const guaYiId = ref<number | null>(null)
const rightAfterGuaIds = ref<number[]>([])

/** 进入 COLLECT 时保存，用于 COLLECT→DIVIDE / FINISH 的归奇动画 */
const collectSnap = ref<ChangeSnapshot | null>(null)

function stickEl(id: number): HTMLElement | null {
  return document.getElementById(`stick-${id}`)
}

function sticksEls(ids: number[]): HTMLElement[] {
  return ids.map(stickEl).filter(Boolean) as HTMLElement[]
}

function killBoardTweens() {
  const root = boardRef.value
  if (root) gsap.killTweensOf(root.querySelectorAll('.stick'))
}

/** 本位扇形：微展、下沉，给上方留空间 */
function layoutBundle(ids: number[]) {
  const n = ids.length
  if (n === 0) return
  const mid = (n - 1) / 2
  ids.forEach((id, i) => {
    const el = stickEl(id)
    if (!el) return
    gsap.set(el, {
      x: (i - mid) * 3,
      y: 80,
      rotation: (i - mid) * 0.5,
      scale: 1,
      opacity: 1,
    })
  })
}

function stickIndexInBundle(id: number) {
  return activeSticks.value.indexOf(id)
}

function stickSplitClass(id: number) {
  if (!showDivideOverlay.value || previewLeft.value == null) return {}
  const idx = stickIndexInBundle(id)
  if (idx < 0) return {}
  const L = previewLeft.value
  return {
    'stick--split-left': idx < L,
    'stick--split-right': idx >= L,
  }
}

function clampSplitLeft(raw: number, total: number) {
  const minSide = 5
  return Math.min(Math.max(Math.round(raw), minSide), total - minSide)
}

function resetBoardVisual() {
  killBoardTweens()
  activeSticks.value = Array.from({ length: 49 }, (_, i) => i + 1)
  discardedSticks.value = []
  leftIds.value = []
  rightIds.value = []
  guaYiId.value = null
  rightAfterGuaIds.value = []
  collectSnap.value = null
  nextTick(() => {
    for (let i = 1; i <= 49; i++) {
      const el = stickEl(i)
      if (el) {
        gsap.set(el, { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, filter: 'none' })
      }
    }
    layoutBundle(activeSticks.value)
  })
}

/** 第一营：分左右，带轻微随机倾角，避免条形码感 */
function animateDivide(_snap: ChangeSnapshot) {
  return new Promise<void>((resolve) => {
    const leftPart = activeSticks.value.slice(0, _snap.left)
    const rightPart = activeSticks.value.slice(_snap.left)
    leftIds.value = leftPart
    rightIds.value = rightPart

    const le = sticksEls(leftPart)
    const re = sticksEls(rightPart)
    const leftRot = le.map(() => -5 + Math.random() * 2)
    const rightRot = re.map(() => 5 + Math.random() * 2)

    const tl = gsap.timeline({ onComplete: () => resolve() })
    tl.to(
      le,
      {
        x: (i: number) => -160 + i * 4,
        y: 80,
        rotation: (i: number) => leftRot[i] ?? -4,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.015,
      },
      0,
    )
    tl.to(
      re,
      {
        x: (i: number) => 160 + i * 4,
        y: 80,
        rotation: (i: number) => rightRot[i] ?? 4,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.015,
      },
      0,
    )
  })
}

/** 第二营：挂一 — 右上安全区 */
function animateGuaYi() {
  return new Promise<void>((resolve) => {
    if (rightIds.value.length === 0) {
      resolve()
      return
    }
    const take = rightIds.value[rightIds.value.length - 1]
    guaYiId.value = take
    rightAfterGuaIds.value = rightIds.value.slice(0, -1)

    const el = stickEl(take)
    if (!el) {
      resolve()
      return
    }
    gsap.to(el, {
      x: 200,
      y: -100,
      rotation: 15,
      duration: 0.5,
      ease: 'power2.inOut',
      onComplete: () => resolve(),
    })
  })
}

/** 第三营：揲四 — 组内紧凑、组间拉开 */
function animateSheSi(snap: ChangeSnapshot) {
  return new Promise<void>((resolve) => {
    const L = snap.left
    const R = snap.right - 1
    const lr = snap.leftRemainder
    const rr = snap.rightRemainder

    const leftEls = sticksEls(leftIds.value)
    const rightEls = sticksEls(rightAfterGuaIds.value)

    const tl = gsap.timeline({ onComplete: () => resolve() })

    tl.to(
      leftEls,
      {
        x: (i: number) => -240 + Math.floor(i / 4) * 25 + (i % 4) * 4,
        y: 80,
        rotation: 0,
        duration: 0.5,
        ease: 'power2.out',
        stagger: 0.012,
      },
      0,
    )

    tl.to(
      rightEls,
      {
        x: (i: number) => 100 + Math.floor(i / 4) * 25 + (i % 4) * 4,
        y: 80,
        rotation: 0,
        duration: 0.5,
        ease: 'power2.out',
        stagger: 0.012,
      },
      0,
    )

    const leftRemStart = L - lr
    const leftRemEls = leftEls.slice(leftRemStart, leftRemStart + lr)
    if (leftRemEls.length) {
      tl.to(
        leftRemEls,
        {
          filter: 'brightness(1.1)',
          y: '+=10',
          duration: 0.28,
          stagger: 0.04,
        },
        '>-0.05',
      )
    }

    const rightRemStart = R - rr
    const rightRemEls = rightEls.slice(rightRemStart, rightRemStart + rr)
    if (rightRemEls.length) {
      tl.to(
        rightRemEls,
        {
          filter: 'brightness(1.1)',
          y: '+=10',
          duration: 0.28,
          stagger: 0.04,
        },
        '<',
      )
    }
  })
}

/** 第四营：归奇 — 左上弃置 + 余策扇形回本位 */
function animateCollect(snap: ChangeSnapshot) {
  return new Promise<void>((resolve) => {
    const gid = guaYiId.value
    const lr = snap.leftRemainder
    const rr = snap.rightRemainder

    const leftRemIds = leftIds.value.slice(leftIds.value.length - lr, leftIds.value.length)
    const rightRemIds = rightAfterGuaIds.value.slice(
      rightAfterGuaIds.value.length - rr,
      rightAfterGuaIds.value.length,
    )

    const toDiscard = [gid, ...leftRemIds, ...rightRemIds].filter(
      (x): x is number => x != null,
    )

    const discardEls = sticksEls(toDiscard)
    const remainIds = activeSticks.value.filter((id) => !toDiscard.includes(id))
    const remainEls = sticksEls(remainIds)

    const tl = gsap.timeline({
      onComplete: () => {
        for (const id of toDiscard) {
          if (!discardedSticks.value.includes(id)) discardedSticks.value.push(id)
        }
        activeSticks.value = remainIds
        guaYiId.value = null
        leftIds.value = []
        rightIds.value = []
        rightAfterGuaIds.value = []
        resolve()
      },
    })

    if (discardEls.length) {
      tl.to(discardEls, {
        x: (i: number) => -200 + i * 4,
        y: -100,
        rotation: (i: number) => -10 + i * 0.5,
        opacity: 0.4,
        duration: 0.6,
        ease: 'power2.in',
        stagger: 0.03,
      })
    }

    if (remainEls.length) {
      const n = remainEls.length
      const mid = (n - 1) / 2
      tl.to(
        remainEls,
        {
          x: (i: number) => (i - mid) * 3,
          y: 80,
          rotation: (i: number) => (i - mid) * 0.5,
          filter: 'none',
          duration: 0.6,
          stagger: 0.01,
          ease: 'power2.inOut',
        },
        discardEls.length ? '-=0.32' : 0,
      )
    }
  })
}

function onPointerDown(e: PointerEvent) {
  if (!showDivideOverlay.value || !overlayRef.value) return
  const el = overlayRef.value
  el.setPointerCapture(e.pointerId)
  activePointerId.value = e.pointerId
  const r = el.getBoundingClientRect()
  const x = e.clientX - r.left
  const y = e.clientY - r.top
  isDrawing.value = true
  lineVisible.value = true
  lineX1.value = x
  lineY1.value = y
  lineX2.value = x
  lineY2.value = y
  const total = activeSticks.value.length
  const W = r.width || 1
  previewLeft.value = clampSplitLeft((x / W) * total, total)
}

function onPointerMove(e: PointerEvent) {
  if (!isDrawing.value || !overlayRef.value) return
  const el = overlayRef.value
  const r = el.getBoundingClientRect()
  const x = e.clientX - r.left
  const y = e.clientY - r.top
  lineX2.value = x
  lineY2.value = y
  const total = activeSticks.value.length
  const W = r.width || 1
  previewLeft.value = clampSplitLeft((x / W) * total, total)
}

function onPointerUp(e: PointerEvent) {
  if (!overlayRef.value) return
  if (activePointerId.value === e.pointerId) {
    try {
      overlayRef.value.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    activePointerId.value = null
  }
  if (!isDrawing.value) return
  const el = overlayRef.value
  const r = el.getBoundingClientRect()
  const dx = lineX2.value - lineX1.value
  const dy = lineY2.value - lineY1.value
  const dist = Math.hypot(dx, dy)
  const total = activeSticks.value.length
  const W = r.width || 1
  const endX = e.clientX - r.left
  const left = clampSplitLeft((endX / W) * total, total)
  const right = total - left

  isDrawing.value = false
  lineVisible.value = false
  previewLeft.value = null

  if (dist < MIN_DRAG || left < 5 || right < 5) return

  store.nextStep({ left, right })
}

function onPointerLeave(e: PointerEvent) {
  if (e.buttons === 0 && isDrawing.value) {
    isDrawing.value = false
    lineVisible.value = false
    previewLeft.value = null
  }
}

async function runStateAnimation(newState: string, oldState: string | undefined) {
  const snap = currentSnapshot.value

  if (newState === 'DIVIDE') {
    if (oldState === 'INIT' || oldState === undefined) {
      return
    }
    if (oldState === 'COLLECT' && collectSnap.value) {
      killBoardTweens()
      await animateCollect(collectSnap.value)
      collectSnap.value = null
      await nextTick()
      if (currentSnapshot.value) await animateDivide(currentSnapshot.value)
      return
    }
  }

  if (newState === 'GUA_YI' && oldState === 'DIVIDE' && snap) {
    await animateGuaYi()
    return
  }

  if (newState === 'SHE_SI' && oldState === 'GUA_YI' && snap) {
    await animateSheSi(snap)
    return
  }

  if (newState === 'COLLECT' && oldState === 'SHE_SI' && snap) {
    collectSnap.value = { ...snap }
    return
  }

  if (newState === 'FINISH' && oldState === 'COLLECT' && collectSnap.value) {
    killBoardTweens()
    await animateCollect(collectSnap.value)
    collectSnap.value = null
  }
}

/** 新爻开始：基数回到 49 时重建台面，避免沿用上一爻归奇后的少量 activeSticks */
watch(
  () => [store.stepState, store.currentSnapshot, store.currentSticks] as const,
  ([state, snap, sticks]) => {
    if (state !== 'DIVIDE' || snap != null) return
    if (sticks !== 49) return
    if (activeSticks.value.length === 49) return
    killBoardTweens()
    discardedSticks.value = []
    activeSticks.value = Array.from({ length: 49 }, (_, i) => i + 1)
    leftIds.value = []
    rightIds.value = []
    guaYiId.value = null
    rightAfterGuaIds.value = []
    void nextTick(() => {
      for (let i = 1; i <= 49; i++) {
        const el = stickEl(i)
        if (el) {
          gsap.set(el, { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, filter: 'none' })
        }
      }
      layoutBundle(activeSticks.value)
    })
  },
  { flush: 'post' },
)

watch(
  () => store.currentSnapshot,
  async (snap, prevSnap) => {
    await nextTick()
    if (stepState.value !== 'DIVIDE' || !snap) return
    if (prevSnap == null && snap != null) {
      await animateDivide(snap)
      store.nextStep()
    }
  },
  { flush: 'post' },
)

watch(
  () => store.stepState,
  (newState, oldState) => {
    void runStateAnimation(newState, oldState)
  },
  { flush: 'post' },
)

watch(
  () => store.isStarted,
  (started) => {
    if (!started) {
      killBoardTweens()
      resetBoardVisual()
    }
  },
)

onMounted(() => {
  nextTick(() => {
    layoutBundle(activeSticks.value)
  })
})

onUnmounted(() => {
  killBoardTweens()
})
</script>

<template>
  <div ref="boardRef" class="board-container">
    <div class="zones-background" aria-hidden="true">
      <div class="zone zone-top-left">
        <span>归奇 (弃置)</span>
      </div>
      <div class="zone zone-top-right">
        <span>象人 (挂一)</span>
      </div>
      <div class="zone zone-left">
        <span>象天 (左手)</span>
      </div>
      <div class="zone zone-center">
        <span>太极 (本位)</span>
      </div>
      <div class="zone zone-right">
        <span>象地 (右手)</span>
      </div>
    </div>

    <div
      v-for="i in 49"
      :id="`stick-${i}`"
      :key="i"
      class="stick"
      :class="[
        { 'stick--discarded': discardedSticks.includes(i) },
        stickSplitClass(i),
      ]"
    />

    <div
      v-show="showDivideOverlay"
      ref="overlayRef"
      class="interaction-overlay"
      @pointerdown.prevent="onPointerDown"
      @pointermove.prevent="onPointerMove"
      @pointerup.prevent="onPointerUp"
      @pointercancel.prevent="onPointerUp"
      @pointerleave="onPointerLeave"
    >
      <svg
        v-show="lineVisible"
        class="divide-line-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line
          :x1="lineX1"
          :y1="lineY1"
          :x2="lineX2"
          :y2="lineY2"
          stroke="rgba(212, 184, 100, 0.75)"
          stroke-width="3"
          stroke-linecap="round"
        />
      </svg>
    </div>

    <p v-show="showDivideOverlay" class="divide-hint">指尖划过，分天定地</p>
  </div>
</template>

<style scoped>
.board-container {
  position: relative;
  width: 100%;
  min-height: 520px;
  height: 520px;
  box-sizing: border-box;
  padding: 100px 16px 32px;
  overflow: visible;
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.25), rgba(252, 250, 242, 0.6));
}

.zones-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.zone {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  background: transparent;
  box-sizing: border-box;
}

.zone span {
  font-family: 'KaiTi', 'STKaiti', '楷体', serif;
  font-size: 28px;
  font-weight: bold;
  letter-spacing: 4px;
  color: #8b7355;
  opacity: 0.38;
  text-align: center;
  line-height: 1.35;
  user-select: none;
}

.zone-top-left span,
.zone-top-right span {
  margin-top: 40px;
}

.zone-left {
  left: 0;
  top: 28%;
  width: 28%;
  height: 52%;
  border-right: 1px dashed #e0d5c1;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 12px;
}

.zone-right {
  right: 0;
  top: 28%;
  width: 28%;
  height: 52%;
  border-left: 1px dashed #e0d5c1;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 12px;
}

.zone-top-right {
  right: 0;
  top: 0;
  width: 32%;
  height: 26%;
  align-items: flex-start;
  justify-content: center;
}

.zone-top-left {
  left: 0;
  top: 0;
  width: 32%;
  height: 26%;
  align-items: flex-start;
  justify-content: center;
}

.zone-center {
  left: 50%;
  top: 50%;
  width: 40%;
  height: 50%;
  transform: translate(-50%, -50%);
  border: 1px dashed rgba(224, 213, 193, 0.55);
  border-radius: 10px;
  background: transparent;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 14px;
}

.stick {
  position: absolute;
  left: 50%;
  bottom: 50%;
  z-index: 10;
  width: 5px;
  height: 160px;
  margin-left: -2.5px;
  border-radius: 3px;
  transform-origin: bottom center;
  background: linear-gradient(to right, #e8d0a9, #d4b886, #b08d55);
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.15);
  will-change: transform, opacity;
  pointer-events: none;
}

.stick--discarded {
  opacity: 0.4;
}

.interaction-overlay {
  position: absolute;
  z-index: 25;
  left: 10%;
  right: 10%;
  top: 24%;
  bottom: 22%;
  cursor: crosshair;
  touch-action: none;
  background: transparent;
}

.divide-line-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
}

.divide-hint {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 8px;
  margin: 0;
  text-align: center;
  font-size: 0.82rem;
  color: rgba(90, 78, 62, 0.48);
  letter-spacing: 0.18em;
  z-index: 18;
  pointer-events: none;
}

.stick--split-left,
.stick--split-right {
  filter: brightness(1.14) saturate(1.05);
  transition: filter 0.12s ease, box-shadow 0.12s ease;
}

.stick--split-left {
  box-shadow:
    1px 1px 3px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(212, 184, 100, 0.42);
}

.stick--split-right {
  box-shadow:
    1px 1px 3px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(180, 160, 130, 0.36);
}
</style>
