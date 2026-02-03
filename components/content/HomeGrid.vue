<script setup lang="ts">
/**
 * HomeGrid
 * Explicit grid container for the landing page.
 */
</script>

<template>
  <div class="home-grid py-12">
    <UContainer>
      <!-- Title Slot -->
      <div v-if="$slots.title" class="mb-8 text-center">
        <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          <slot name="title" />
        </h2>
      </div>

      <!-- Flex Container -->
      <div class="flex flex-wrap -mx-4">
        <slot name="root" />
        <slot />
      </div>
    </UContainer>
  </div>
</template>

<style scoped>
:deep(div.flex > *) {
  width: 100%;
  padding-left: 1rem;
  padding-right: 1rem;
  margin-bottom: 2rem;
}

@media (min-width: 640px) {
  :deep(div.flex > *) {
    width: 50%;
  }
}

@media (min-width: 1024px) {
  :deep(div.flex > *) {
    width: 33.333333%;
  }
}
</style>
