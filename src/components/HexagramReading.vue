<script setup lang="ts">
import { computed } from 'vue'
import type { HexagramLine } from '@/store/divination'
import guaData from '@/assets/gua_data.json'
import {
  bianGuaYang,
  hexagramKeyFromValues,
  yaoCiName,
} from '@/utils/hexagramLookup'

type GuaKey = keyof typeof guaData
type GuaEntry = (typeof guaData)[GuaKey] & {
  yong?: { name: string; text: string; trans: string }
}

const props = defineProps<{
  hexagram: HexagramLine[]
}>()

function lineYang(v: HexagramLine): boolean {
  return v.value === 7 || v.value === 9
}

const benKey = computed(() =>
  props.hexagram.length === 6 ? hexagramKeyFromValues(props.hexagram) : '',
)

const benEntry = computed((): GuaEntry | null => {
  const k = benKey.value
  if (!k || !(k in guaData)) return null
  return guaData[k as GuaKey]
})

const bianKey = computed(() => {
  if (props.hexagram.length !== 6) return ''
  const ben = props.hexagram.map(lineYang)
  const moving = props.hexagram.map((l) => l.active)
  return hexagramKeyFromValues(
    bianGuaYang(ben, moving).map((yang) => ({
      value: yang ? (7 as const) : (8 as const),
    })),
  )
})

const bianEntry = computed((): GuaEntry | null => {
  const k = bianKey.value
  if (!k || k === benKey.value || !(k in guaData)) return null
  return guaData[k as GuaKey]
})

const movingIndices = computed(() => {
  const out: number[] = []
  props.hexagram.forEach((l, i) => {
    if (l.active) out.push(i)
  })
  return out
})
</script>

<template>
  <div v-if="hexagram.length === 6 && benEntry" class="reading">
    <h3 class="reading__title">解卦 · 今译</h3>
    <p class="reading__names">
      <span class="reading__tag">本卦 {{ benKey }}</span>
      <span v-if="bianKey && bianKey !== benKey" class="reading__tag reading__tag--bian">
        变卦 {{ bianKey }}
      </span>
    </p>

    <section class="reading__block">
      <h4>卦辞</h4>
      <p class="reading__line">{{ benEntry.guaci }}</p>
      <p v-if="benEntry.guaci_trans && benEntry.guaci_trans !== '【译文】'" class="reading__trans">
        {{ benEntry.guaci_trans }}
      </p>
    </section>

    <section v-if="movingIndices.length" class="reading__block">
      <h4>动爻爻辞（本卦）</h4>
      <div
        v-for="i in movingIndices"
        :key="'mv-' + i"
        class="reading__yao"
      >
        <p class="reading__yao-name">
          {{ benEntry!.yaoci[i]?.name ?? yaoCiName(i, lineYang(hexagram[i]!)) }}
        </p>
        <p class="reading__line">{{ benEntry!.yaoci[i]?.text }}</p>
        <p
          v-if="benEntry!.yaoci[i]?.trans && benEntry!.yaoci[i]!.trans !== '【译文】'"
          class="reading__trans"
        >
          {{ benEntry!.yaoci[i]?.trans }}
        </p>
      </div>
    </section>
    <p v-else class="reading__hint">六爻皆不变，可参卦辞；若占变，请看重卦之动爻。</p>

    <section v-if="benEntry.yong" class="reading__block">
      <h4>{{ benEntry.yong.name }}</h4>
      <p class="reading__line">{{ benEntry.yong.text }}</p>
      <p class="reading__trans">{{ benEntry.yong.trans }}</p>
    </section>

    <section v-if="bianEntry && bianKey !== benKey" class="reading__block reading__block--sub">
      <h4>变卦卦辞（参考）</h4>
      <p class="reading__line">{{ bianEntry.guaci }}</p>
      <p
        v-if="bianEntry.guaci_trans && bianEntry.guaci_trans !== '【译文】'"
        class="reading__trans"
      >
        {{ bianEntry.guaci_trans }}
      </p>
    </section>
  </div>
</template>

<style scoped>
.reading {
  margin-top: 0;
  padding: 16px 18px;
  border-radius: 10px;
  border: 1px solid var(--paper-edge);
  background: rgba(255, 253, 248, 0.96);
}

.reading__title {
  margin: 0 0 12px;
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--ink);
}

.reading__names {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 14px;
}

.reading__tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.88rem;
  letter-spacing: 0.08em;
  background: rgba(74, 62, 48, 0.08);
  color: var(--ink);
}

.reading__tag--bian {
  background: rgba(154, 44, 44, 0.1);
  color: #6a1a1a;
}

.reading__block {
  margin-bottom: 14px;
}

.reading__block:last-child {
  margin-bottom: 0;
}

.reading__block--sub {
  opacity: 0.95;
}

.reading__block h4 {
  margin: 0 0 8px;
  font-size: 0.92rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--ink-muted);
}

.reading__line {
  margin: 0 0 6px;
  font-size: 0.95rem;
  line-height: 1.75;
  color: var(--ink);
  letter-spacing: 0.04em;
}

.reading__trans {
  margin: 0 0 8px;
  font-size: 0.9rem;
  line-height: 1.8;
  color: var(--ink-muted);
  text-align: justify;
}

.reading__yao {
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px dashed rgba(74, 62, 48, 0.15);
}

.reading__yao:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.reading__yao-name {
  margin: 0 0 4px;
  font-size: 0.88rem;
  font-weight: 600;
  color: #1a5276;
  letter-spacing: 0.08em;
}

.reading__hint {
  margin: 0 0 12px;
  font-size: 0.88rem;
  color: var(--ink-muted);
  line-height: 1.65;
}
</style>
