<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const tableData = [
  {
    num: 7,
    name: '少阳',
    type: '阳爻',
    moving: '不变',
    symbol: '—',
    change: '保持阳爻',
  },
  {
    num: 8,
    name: '少阴',
    type: '阴爻',
    moving: '不变',
    symbol: '- -',
    change: '保持阴爻',
  },
  {
    num: 9,
    name: '老阳',
    type: '阳爻',
    moving: '变爻',
    symbol: '○',
    change: '转为阴爻',
  },
  {
    num: 6,
    name: '老阴',
    type: '阴爻',
    moving: '变爻',
    symbol: '×',
    change: '转为阳爻',
  },
]
</script>

<template>
  <el-drawer v-model="visible" title="大衍筮法百科" direction="rtl" size="min(520px, 92vw)" class="knowledge-drawer">
    <div class="drawer-body">
      <section class="kb-section">
        <h2 class="kb-h2">一、核心基础概念</h2>
        <el-descriptions :column="1" border class="kb-desc">
          <el-descriptions-item label="爻与三变">
            每一爻由<strong>三变</strong>（三轮四营）定出：三变结束后，台面剩余策数除以四，得
            <strong>6、7、8、9</strong>
            四数之一，对应阴阳老少。
          </el-descriptions-item>
          <el-descriptions-item label="四象与动静">
            <strong>少阳（7）</strong>、<strong>少阴（8）</strong>为<strong>主不变</strong>之爻；<strong>老阳（9）</strong>、<strong>老阴（6）</strong>为<strong>主变</strong>之爻。动则本卦该爻在变卦中阴阳互转。
          </el-descriptions-item>
          <el-descriptions-item label="本卦与变卦">
            依六爻自下而上先画<strong>本卦</strong>；凡遇老阳、老阴之变爻，则在<strong>变卦</strong>中按阴阳反转绘出，不变之爻两卦相同。
          </el-descriptions-item>
          <el-descriptions-item label="四营十八变">
            每一变含<strong>四营</strong>（分二、挂一、揲四、归奇）；一爻需三变，六爻共<strong>十八变</strong>，所谓「十有八变而成卦」。
          </el-descriptions-item>
        </el-descriptions>
      </section>

      <section class="kb-section">
        <h2 class="kb-h2">二、大衍筮法操作流程</h2>
        <ol class="kb-ol">
          <li>
            <strong>五十取一</strong>：大衍之数五十，<strong>其用四十有九</strong>——取五十策而虚其一，象太极不动；四十九策为起算之基数。
          </li>
          <li>
            <strong>第一营 · 分而为二以象两</strong>：信手分策为左右两堆，象<strong>天、地</strong>两仪。
          </li>
          <li>
            <strong>第二营 · 挂一以象三</strong>：从右取一策挂于指间，象<strong>人</strong>，与天地并列为三才。
          </li>
          <li>
            <strong>第三营 · 揲之以四以象四时</strong>：左右各以四策为一组数去，余数必为 1、2、3 或 4（整除则余四），象<strong>春夏秋冬</strong>四时。
          </li>
          <li>
            <strong>第四营 · 归奇于扐以象闰</strong>：合左右之余与挂一之策置于一旁，象历法中的<strong>闰余</strong>；一变乃成。三变定一爻，六爻成卦。
          </li>
        </ol>
      </section>

      <section class="kb-section">
        <h2 class="kb-h2">三、关键结果对应表</h2>
        <el-table :data="tableData" stripe border class="kb-table" size="small">
          <el-table-column prop="num" label="爻数" width="72" align="center" />
          <el-table-column prop="name" label="名称" width="88" align="center" />
          <el-table-column prop="type" label="爻性" width="88" align="center" />
          <el-table-column prop="moving" label="变爻与否" width="100" align="center" />
          <el-table-column prop="symbol" label="符号" width="72" align="center" />
          <el-table-column prop="change" label="变卦处理" min-width="120" />
        </el-table>
      </section>
    </div>
  </el-drawer>
</template>

<style scoped>
.drawer-body {
  padding: 0 4px 24px;
  font-size: 0.95rem;
  line-height: 1.75;
  color: var(--ink-muted);
}

.kb-section {
  margin-bottom: 28px;
}

.kb-h2 {
  margin: 0 0 14px;
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--ink);
  border-left: 3px solid var(--seal);
  padding-left: 10px;
}

.kb-desc {
  --el-descriptions-item-bordered-label-background: rgba(252, 250, 242, 0.9);
}

.kb-ol {
  margin: 0;
  padding-left: 1.25rem;
  display: grid;
  gap: 12px;
}

.kb-ol li {
  padding-left: 4px;
}

.kb-table {
  width: 100%;
}
</style>

<style>
/* 抽屉标题新中式 */
.knowledge-drawer .el-drawer__header {
  margin-bottom: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--paper-edge, #d4c4a8);
}

.knowledge-drawer .el-drawer__title {
  font-weight: 600;
  letter-spacing: 0.15em;
  color: var(--ink, #2a2622);
}
</style>
