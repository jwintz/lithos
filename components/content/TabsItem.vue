<script setup lang="ts">
import { inject, ref, onMounted, type Ref } from 'vue'

const props = defineProps<{
  label: string
  icon?: string
}>()

const context = inject<{ activeIndex: Ref<number>, registerTab: (t: any) => number }>('tabs-context')

const myIndex = ref(-1)

if (context) {
  onMounted(() => {
    myIndex.value = context.registerTab({
      label: props.label,
      icon: props.icon
    })
  })
}
</script>

<template>
  <div v-show="myIndex !== -1 && context?.activeIndex.value === myIndex" class="tabs-item">
    <slot />
  </div>
</template>
