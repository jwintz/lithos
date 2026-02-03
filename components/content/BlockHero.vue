<script setup lang="ts">
/**
 * BlockHero - Alias for ULandingHero/UPageHero
 * Allows usage of ::block-hero in markdown
 */
defineOptions({ inheritAttrs: false })
</script>

<template>
  <ULandingHero v-bind="$attrs">
    <template v-for="(_, slot) in $slots" #[slot]="scope">
      <slot :name="slot" v-bind="scope || {}" />
    </template>
  </ULandingHero>
</template>
