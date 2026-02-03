<script setup lang="ts">
/**
 * Card - Alias for ULandingCard/UPageCard
 * Allows usage of ::card in markdown
 */
defineOptions({ inheritAttrs: false })
</script>

<template>
  <ULandingCard v-bind="$attrs">
    <template v-for="(_, slot) in $slots" #[slot]="scope">
      <slot :name="slot" v-bind="scope || {}" />
    </template>
  </ULandingCard>
</template>
