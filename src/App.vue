<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { stepExplanations } from '@/utils/algorithm'
import DivinationBoard from '@/components/DivinationBoard.vue'
import HexagramFigures from '@/components/HexagramFigures.vue'
import HexagramReading from '@/components/HexagramReading.vue'
import AiDivinationPanel from '@/components/AiDivinationPanel.vue'
import KnowledgeDrawer from '@/components/KnowledgeDrawer.vue'
import { useDivinationStore } from '@/store/divination'
import type { HexagramLine } from '@/store/divination'

const store = useDivinationStore()
const {
  isStarted,
  question,
  stepState,
  currentYaoIndex,
  currentChangeIndex,
  hexagram,
  currentDynamicExplain,
} = storeToRefs(store)

const landingDraft = ref('')
const drawerVisible = ref(false)
/** 第三页：卦象与《周易》解读专页 */
const readingPageOpen = ref(false)

const primaryDisabled = computed(
  () => stepState.value === 'FINISH' || stepState.value === 'DIVIDE',
)

const currentExplain = computed(() => stepExplanations[stepState.value])

const readingReady = computed(
  () => stepState.value === 'FINISH' && hexagram.value.length === 6,
)

function buildYaoBroadcast(line: HexagramLine): string {
  const r = line.remainAfter ?? 0
  const v = line.value
  const base = `三变完成。剩余基数 ${r} ÷ 4 = ${v}，得${line.name}`
  if (v === 9) return `${base}（老阳，阳极生阴，为变爻）`
  if (v === 6) return `${base}（老阴，阴极生阳，为变爻）`
  if (v === 7) return `${base}（少阳，阳爻不变）`
  return `${base}（少阴，阴爻不变）`
}

watch(
  () => store.hexagram.length,
  (len, oldLen) => {
    if (len <= (oldLen ?? 0)) return
    const last = store.hexagram[len - 1]
    if (last.remainAfter == null) return
    ElMessage({
      message: buildYaoBroadcast(last),
      type: 'success',
      duration: 6500,
      showClose: true,
      customClass: 'yao-broadcast-msg',
    })
  },
)

watch(isStarted, (started) => {
  if (!started) readingPageOpen.value = false
})

function beginDivination() {
  readingPageOpen.value = false
  store.startGame(landingDraft.value)
}

function onResetToLanding() {
  readingPageOpen.value = false
  landingDraft.value = ''
  store.reset()
}

function openReadingPage() {
  if (readingReady.value) readingPageOpen.value = true
}

function backFromReadingPage() {
  readingPageOpen.value = false
}

function onPrimary() {
  if (!primaryDisabled.value) store.nextStep()
}
</script>

<template>
  <transition name="fade" mode="out-in">
    <div v-if="!isStarted" key="landing" class="landing-view">
      <h1 class="landing-title">春秋大衍筮法</h1>
      <p class="landing-lead">
        四营而成易，十有八变而成卦。此为《周易》最古老、最正统的起卦之法。
      </p>
      <p class="landing-hint">
        请闭目静心，默念您心中所问之事，并将其写下（选填）
      </p>
      <el-input
        v-model="landingDraft"
        type="textarea"
        :rows="5"
        resize="none"
        class="landing-input"
        placeholder="在此写下所问……"
      />
      <el-button type="primary" size="large" class="landing-cta" @click="beginDivination">
        净心 · 起卦
      </el-button>
    </div>

    <div v-else key="divination" class="divination-view">
      <el-container class="page-shell">
        <el-header class="top-bar" height="auto">
          <div class="top-bar__inner">
            <div class="top-bar__titles">
              <h1 class="site-title">大衍筮法模拟</h1>
              <p class="question-line">
                所问之事：<span class="question-text">{{ question || '未具名之问' }}</span>
              </p>
            </div>
            <div class="top-bar__actions">
              <el-button
                v-if="readingPageOpen"
                type="primary"
                plain
                class="reading-entry-btn"
                @click="backFromReadingPage"
              >
                返回演算
              </el-button>
              <el-button
                v-else-if="readingReady"
                type="primary"
                class="reading-entry-btn"
                @click="openReadingPage"
              >
                卦象与易解
              </el-button>
              <el-button class="wiki-btn" @click="drawerVisible = true">📖 筮法百科</el-button>
              <el-button type="danger" plain class="reset-btn" @click="onResetToLanding">
                重新起卦
              </el-button>
            </div>
          </div>
        </el-header>

        <KnowledgeDrawer v-model="drawerVisible" />

        <el-main v-if="readingPageOpen && readingReady" class="main-pad result-main">
          <div class="result-stack">
            <header class="result-hero">
              <h2 class="result-hero__title">卦象与易解</h2>
              <p class="result-hero__lead">
                所问：<span class="question-text">{{ question || '未具名之问' }}</span>
              </p>
            </header>
            <HexagramFigures :hexagram="hexagram" />
            <HexagramReading :hexagram="hexagram" />
            <AiDivinationPanel :question="question" :hexagram="hexagram" />
            <div class="result-footer">
              <el-button size="large" class="result-back" @click="backFromReadingPage">
                返回演算
              </el-button>
            </div>
          </div>
        </el-main>

        <el-main v-else class="main-pad">
          <el-row :gutter="20">
            <el-col :xs="24" :lg="16">
              <section class="panel interaction">
                <div class="progress-row">
                  <el-tag type="info" effect="plain" size="large" class="progress-tag">
                    第 {{ currentYaoIndex }} 爻 · 第 {{ currentChangeIndex }} 变
                  </el-tag>
                </div>

                <el-alert
                  type="info"
                  :closable="false"
                  show-icon
                  class="dynamic-explain"
                >
                  <template #title>
                    <span class="dyn-title">{{ currentDynamicExplain.title }}</span>
                  </template>
                  <div class="dyn-body">
                    <p v-if="currentDynamicExplain.desc" class="dyn-desc">
                      {{ currentDynamicExplain.desc }}
                    </p>
                    <p v-if="currentDynamicExplain.math" class="dyn-math">
                      {{ currentDynamicExplain.math }}
                    </p>
                  </div>
                </el-alert>

                <div class="interaction-board">
                  <DivinationBoard class="board-stage" />
                  <div v-show="stepState !== 'DIVIDE'" class="interaction-board__footer">
                    <el-button
                      type="primary"
                      size="large"
                      class="primary-action"
                      :disabled="primaryDisabled"
                      @click="onPrimary"
                    >
                      {{ currentExplain.action }}
                    </el-button>
                  </div>
                </div>
              </section>
            </el-col>

            <el-col :xs="24" :lg="8">
              <div class="hexagram-cards">
                <HexagramFigures :hexagram="hexagram" />
              </div>

              <el-card class="data-panel-card" shadow="never">
                <template #header>
                  <div class="data-panel-header">
                    <span>实时演算数据</span>
                  </div>
                </template>

                <el-descriptions :column="1" size="small" class="custom-descriptions">
                  <el-descriptions-item label="总基数 (台面)">
                    <span class="data-value">{{
                      store.currentSnapshot?.totalBefore ?? store.currentSticks
                    }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="左堆 / 右堆">
                    <span class="data-value">
                      {{ store.currentSnapshot?.left ?? '-' }} /
                      {{ store.currentSnapshot?.right ?? '-' }}
                    </span>
                  </el-descriptions-item>
                  <el-descriptions-item label="挂一后右揲">
                    <span class="data-value">{{
                      store.currentSnapshot ? store.currentSnapshot.right - 1 : '-'
                    }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="左右余 (1-4)">
                    <span class="data-value">
                      {{ store.currentSnapshot?.leftRemainder ?? '-' }} ·
                      {{ store.currentSnapshot?.rightRemainder ?? '-' }}
                    </span>
                  </el-descriptions-item>
                  <el-descriptions-item label="归奇合计 / 剩策">
                    <span class="data-value highlight-value">
                      {{ store.currentSnapshot?.discard ?? '-' }} /
                      {{ store.currentSnapshot?.remainAfter ?? '-' }}
                    </span>
                  </el-descriptions-item>
                </el-descriptions>
              </el-card>
            </el-col>
          </el-row>
        </el-main>
      </el-container>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.8s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.landing-view {
  max-width: 600px;
  margin: 10vh auto;
  padding: 0 20px 48px;
  text-align: center;
}

.landing-title {
  margin: 0 0 20px;
  font-size: clamp(1.65rem, 4vw, 2.1rem);
  font-weight: 600;
  letter-spacing: 0.2em;
  color: var(--ink);
}

.landing-lead {
  margin: 0 0 28px;
  font-size: 1.02rem;
  line-height: 1.85;
  color: var(--ink-muted);
  text-align: justify;
  text-align-last: center;
  letter-spacing: 0.06em;
}

.landing-hint {
  margin: 0 0 12px;
  font-size: 0.92rem;
  color: var(--ink-muted);
  letter-spacing: 0.04em;
}

.landing-input {
  margin-bottom: 28px;
  text-align: left;
}

.landing-input :deep(.el-textarea__inner) {
  border-radius: 10px;
  border-color: rgba(74, 62, 48, 0.22);
  background: rgba(255, 253, 248, 0.85);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04);
  font-family: inherit;
  line-height: 1.75;
  letter-spacing: 0.04em;
}

.landing-input :deep(.el-textarea__inner:focus) {
  border-color: rgba(139, 58, 58, 0.45);
}

.landing-cta {
  min-width: 200px;
  letter-spacing: 0.18em;
  padding: 12px 28px;
}

.divination-view {
  min-height: 100vh;
}

.page-shell {
  min-height: 100vh;
  background: var(--paper);
  padding: 20px 20px 40px;
}

.top-bar {
  padding: 8px 0 20px;
  border-bottom: 1px solid var(--paper-edge);
}

.top-bar__inner {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  max-width: 100%;
}

.top-bar__titles {
  text-align: center;
}

.site-title {
  margin: 0 0 8px;
  font-size: clamp(1.35rem, 3vw, 1.75rem);
  letter-spacing: 0.12em;
  color: var(--ink);
}

.question-line {
  margin: 0;
  font-size: 0.92rem;
  color: var(--ink-muted);
  letter-spacing: 0.06em;
}

.question-text {
  color: var(--ink);
  font-weight: 500;
}

.top-bar__actions {
  position: absolute;
  right: 0;
  top: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

.wiki-btn {
  border-color: rgba(74, 62, 48, 0.22);
  background: rgba(255, 253, 248, 0.92);
  color: var(--ink);
  letter-spacing: 0.06em;
}

.main-pad {
  padding-top: 20px;
}

.result-main {
  padding-bottom: 48px;
}

.result-stack {
  max-width: 920px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.result-hero {
  text-align: center;
  padding: 4px 12px 8px;
}

.result-hero__title {
  margin: 0 0 10px;
  font-size: clamp(1.25rem, 3vw, 1.55rem);
  font-weight: 600;
  letter-spacing: 0.18em;
  color: var(--ink);
}

.result-hero__lead {
  margin: 0;
  font-size: 0.95rem;
  color: var(--ink-muted);
  letter-spacing: 0.06em;
}

.result-footer {
  display: flex;
  justify-content: center;
  padding: 8px 0 12px;
}

.result-back {
  min-width: 200px;
  letter-spacing: 0.12em;
}

.reading-entry-btn {
  letter-spacing: 0.1em;
}

.hexagram-cards {
  margin-bottom: 16px;
}

.panel.interaction {
  background: rgba(255, 253, 248, 0.92);
  border: 1px solid var(--paper-edge);
  border-radius: 12px;
  padding: 16px 18px 20px;
}

.progress-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.dynamic-explain {
  margin-bottom: 16px;
  --el-alert-bg-color: rgba(255, 253, 248, 0.88);
  --el-alert-border-color: rgba(74, 62, 48, 0.2);
  align-items: flex-start;
}

.dynamic-explain :deep(.el-alert__title) {
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--ink);
  line-height: 1.45;
}

.dyn-title {
  display: block;
}

.dyn-body {
  margin-top: 6px;
}

.dyn-desc {
  margin: 0 0 8px;
  font-size: 0.95rem;
  line-height: 1.85;
  color: var(--ink-muted);
  letter-spacing: 0.03em;
  text-align: justify;
}

.dyn-math {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 600;
  font-family: ui-monospace, Consolas, monospace;
  line-height: 1.6;
  color: #1a5276;
  letter-spacing: 0.02em;
}

.interaction-board {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 560px;
  border: 1px dashed rgba(74, 62, 48, 0.22);
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.35), transparent);
  padding: 12px 12px 20px;
  overflow: visible;
}

.board-stage {
  flex: 1;
  min-height: 520px;
  width: 100%;
}

.interaction-board__footer {
  flex-shrink: 0;
  padding-top: 16px;
  text-align: center;
}

.primary-action {
  min-width: 220px;
  font-size: 1rem;
  letter-spacing: 0.06em;
}

.data-panel-card {
  --el-card-bg-color: rgba(255, 253, 248, 0.96);
  --el-card-border-color: var(--paper-edge);
}

.data-panel-header {
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--ink);
  font-size: 0.95rem;
}

.custom-descriptions {
  --el-descriptions-item-bordered-label-background: rgba(252, 250, 242, 0.85);
}

.custom-descriptions :deep(.el-descriptions__label) {
  color: var(--ink-muted);
  font-size: 0.82rem;
}

.custom-descriptions :deep(.el-descriptions__content) {
  font-size: 0.88rem;
}

.data-value {
  font-family: ui-monospace, 'Cascadia Code', Consolas, monospace;
  font-weight: 500;
  color: var(--ink);
}

.highlight-value {
  color: #1a5276;
  font-weight: 600;
}

@media (max-width: 992px) {
  .top-bar__actions {
    position: static;
    margin-top: 12px;
    justify-content: center;
  }

  .top-bar__inner {
    flex-direction: column;
    align-items: center;
  }
}
</style>
