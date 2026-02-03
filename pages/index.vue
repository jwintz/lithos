<script setup lang="ts">
/**
 * Landing Page
 * 
 * Full-width landing page without sidebars.
 * Renders content/index.md with the landing layout.
 */
import type { Collections } from '@nuxt/content'

definePageMeta({
  layout: 'landing',
})

const { data: page } = await useAsyncData('landing', () => 
  queryCollection('docs' as keyof Collections).path('/').first()
)

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Landing page not found', fatal: true })
}

const title = page.value.seo?.title || page.value.title
const description = page.value.seo?.description || page.value.description

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
})
</script>

<template>
  <div class="landing-page">
    <ContentRenderer v-if="page" :value="page" />
  </div>
</template>
