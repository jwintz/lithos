<script setup lang="ts">
/**
 * ULandingHero - Alias for UPageHero
 * Maps legacy u-landing-hero to Nuxt UI v4's UPageHero
 */

// Pass through all props and attrs
defineOptions({ inheritAttrs: false })
</script>

<template>
  <UPageHero v-bind="$attrs">
    <template v-for="(_, slot) in $slots" #[slot]="scope">
      <slot :name="slot" v-bind="scope || {}" />
    </template>
  </UPageHero>
</template>
