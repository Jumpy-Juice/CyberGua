<script setup lang="ts">
import type { HexagramLine } from '@/store/divination'

defineProps<{
  hexagram: HexagramLine[]
}>()

function benIsYang(line: HexagramLine) {
  return line.value === 7 || line.value === 9
}

function bianIsYang(line: HexagramLine) {
  return line.changeTo === '—'
}
</script>

<template>
  <div class="figures">
    <el-row :gutter="20" class="figures__row">
      <el-col :xs="24" :md="12">
        <el-card class="gua-card" shadow="hover">
          <template #header>
            <span class="card-title">本卦</span>
          </template>
          <div v-if="hexagram.length === 0" class="gua-empty">尚未成爻</div>
          <div v-else class="gua-lines gua-lines--ben">
            <div
              v-for="(line, idx) in hexagram"
              :key="'ben-' + idx"
              class="yao-line"
              :class="{ 'moving-yao': line.active }"
            >
              <div class="yao-line__track">
                <div v-if="benIsYang(line)" class="yang-line" />
                <div v-else class="yin-line">
                  <span class="yin-seg" />
                  <span class="yin-seg" />
                </div>
                <span v-if="line.active" class="moving-mark" aria-hidden="true">
                  {{ line.value === 9 ? '○' : '×' }}
                </span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card class="gua-card" shadow="hover">
          <template #header>
            <span class="card-title">变卦</span>
          </template>
          <div v-if="hexagram.length === 0" class="gua-empty">尚未成爻</div>
          <div v-else class="gua-lines gua-lines--bian">
            <div
              v-for="(line, idx) in hexagram"
              :key="'bian-' + idx"
              class="yao-line"
              :class="{ 'moving-yao': line.active }"
            >
              <div class="yao-line__track">
                <div v-if="bianIsYang(line)" class="yang-line" />
                <div v-else class="yin-line">
                  <span class="yin-seg" />
                  <span class="yin-seg" />
                </div>
                <span v-if="line.active" class="moving-mark" aria-hidden="true">
                  {{ line.value === 9 ? '○' : '×' }}
                </span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.figures {
  margin-bottom: 8px;
}

.figures__row {
  align-items: stretch;
}

.gua-card {
  --el-card-bg-color: rgba(255, 253, 248, 0.96);
  --el-card-border-color: var(--paper-edge);
  height: 100%;
}

.card-title {
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--ink);
}

.gua-empty {
  text-align: center;
  color: var(--ink-muted);
  font-size: 0.92rem;
  padding: 24px 0;
}

.gua-lines {
  display: flex;
  flex-direction: column-reverse;
  gap: 0;
  min-height: 140px;
}

.yao-line {
  margin: 10px 0;
}

.yao-line__track {
  display: flex;
  align-items: center;
  gap: 10px;
}

.yang-line {
  flex: 1;
  height: 12px;
  border-radius: 3px;
  background: linear-gradient(180deg, #2a2622, #0f0e0d);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.2) inset;
}

.yin-line {
  flex: 1;
  display: flex;
  justify-content: space-between;
  gap: 18px;
}

.yin-seg {
  flex: 1;
  height: 12px;
  border-radius: 3px;
  background: linear-gradient(180deg, #2a2622, #0f0e0d);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.2) inset;
}

.moving-yao .yang-line,
.moving-yao .yin-seg {
  background: linear-gradient(180deg, #9a2c2c, #6a1a1a);
  box-shadow:
    0 0 0 1px rgba(154, 44, 44, 0.35),
    0 1px 0 rgba(255, 255, 255, 0.15) inset;
}

.moving-mark {
  flex-shrink: 0;
  width: 1.5rem;
  text-align: center;
  font-size: 1rem;
  font-weight: 700;
  color: var(--seal);
}
</style>
