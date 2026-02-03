<script setup lang="ts">
/**
 * ULandingGrid - Wrapper for UPageGrid with UContainer
 * Maps legacy u-landing-grid to Nuxt UI v4's UPageGrid with proper container
 */

defineOptions({ inheritAttrs: false })
</script>

<template>
  <UContainer class="py-12">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <slot />
    </div>
  </UContainer>
</template>
