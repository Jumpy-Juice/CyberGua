<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { HexagramLine } from '@/store/divination'
import { requestArkInterpretation } from '@/api/arkChat'
import { buildDivinationContextForAi } from '@/utils/divinationContextForAi'

const props = defineProps<{
  question: string
  hexagram: HexagramLine[]
}>()

const loading = ref(false)
const errorMsg = ref('')
const answerText = ref('')

const modelConfigured = computed(() => !!import.meta.env.VITE_ARK_MODEL?.trim())

const hexSig = computed(() =>
  props.hexagram.map((l) => `${l.value}${l.active ? '1' : '0'}`).join(','),
)

const canRequest = computed(() => {
  if (props.hexagram.length !== 6) return false
  return buildDivinationContextForAi(props.hexagram) != null
})

watch(hexSig, () => {
  answerText.value = ''
  errorMsg.value = ''
})

async function generate() {
  errorMsg.value = ''
  const ctx = buildDivinationContextForAi(props.hexagram)
  if (!ctx) {
    ElMessage.warning('卦象未成，无法请求解读')
    return
  }
  loading.value = true
  try {
    answerText.value = await requestArkInterpretation({
      question: props.question,
      context: ctx,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    errorMsg.value = msg
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="ai-panel">
    <h3 class="ai-panel__title">AI 参考解读</h3>
    <p class="ai-panel__hint">
      根据您的占问、卦象与上文「解卦」经文摘要，调用方舟大模型生成连贯参考（仅供思考，非定论）。
    </p>
    <p v-if="!modelConfigured" class="ai-panel__config">
      尚未配置模型：请在项目根目录复制 <code>.env.example</code> 为 <code>.env.local</code>，填写
      <code>ARK_API_KEY</code> 与 <code>VITE_ARK_MODEL</code> 后重启
      <code>npm run dev</code>。
    </p>
    <div class="ai-panel__actions">
      <el-button
        type="primary"
        :loading="loading"
        :disabled="!canRequest || !modelConfigured"
        @click="generate"
      >
        生成 AI 参考解答
      </el-button>
    </div>
    <el-alert
      v-if="errorMsg"
      type="error"
      :closable="false"
      class="ai-panel__alert"
      :title="errorMsg"
    />
    <article v-if="answerText" class="ai-panel__answer" aria-live="polite">
      {{ answerText }}
    </article>
  </section>
</template>

<style scoped>
.ai-panel {
  margin-top: 4px;
  padding: 16px 18px;
  border-radius: 10px;
  border: 1px solid rgba(26, 82, 118, 0.22);
  background: rgba(248, 252, 255, 0.92);
}

.ai-panel__title {
  margin: 0 0 10px;
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--ink);
}

.ai-panel__hint {
  margin: 0 0 10px;
  font-size: 0.9rem;
  line-height: 1.75;
  color: var(--ink-muted);
  letter-spacing: 0.03em;
}

.ai-panel__config {
  margin: 0 0 12px;
  font-size: 0.88rem;
  line-height: 1.65;
  color: #8b3a3a;
  letter-spacing: 0.02em;
}

.ai-panel__config code {
  font-size: 0.84em;
  padding: 0 4px;
  border-radius: 4px;
  background: rgba(74, 62, 48, 0.08);
}

.ai-panel__actions {
  margin-bottom: 12px;
}

.ai-panel__alert {
  margin-bottom: 12px;
}

.ai-panel__answer {
  margin: 0;
  padding-top: 4px;
  font-size: 0.95rem;
  line-height: 1.85;
  letter-spacing: 0.04em;
  color: var(--ink);
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
