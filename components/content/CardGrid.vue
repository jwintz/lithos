<script setup lang="ts">
/**
 * CardGrid - Alias for ULandingGrid/UPageGrid
 * Allows usage of ::card-grid in markdown
 */
defineOptions({ inheritAttrs: false })
</script>

<template>
  <ULandingGrid v-bind="$attrs">
    <template #title>
      <slot name="title" />
    </template>
    <slot name="root" />
    <slot />
  </ULandingGrid>
</template>
