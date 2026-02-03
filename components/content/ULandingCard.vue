<script setup lang="ts">
/**
 * ULandingCard - Alias for UPageCard
 * Maps legacy u-landing-card to Nuxt UI v4's UPageCard
 */

defineOptions({ inheritAttrs: false })
</script>

<template>
  <UPageCard v-bind="$attrs">
    <template v-for="(_, slot) in $slots" #[slot]="scope">
      <slot :name="slot" v-bind="scope || {}" />
    </template>
  </UPageCard>
</template>
