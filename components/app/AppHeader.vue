<script setup lang="ts">
/**
 * AppHeader - Custom header for Lithos
 *
 * Overrides Docus default to fix baseURL double-prefix issue.
 * Uses the base "/" path - NuxtLink handles baseURL automatically.
 */

const appConfig = useAppConfig()
const site = useSiteConfig()

const links = computed(() => appConfig.github && appConfig.github.url
  ? [
      {
        'icon': 'i-simple-icons-github',
        'to': appConfig.github.url,
        'target': '_blank',
        'aria-label': 'GitHub',
      },
    ]
  : [])
</script>

<template>
  <UHeader
    :ui="{ center: 'flex-1' }"
    to="/"
    :title="appConfig.header?.title || site.name"
  >
    <AppHeaderCenter />

    <template #title>
      <AppHeaderLogo class="h-6 w-auto shrink-0" />
    </template>

    <template #right>
      <AppHeaderCTA />

      <UContentSearchButton class="lg:hidden" />

      <ClientOnly>
        <UColorModeButton />

        <template #fallback>
          <div class="h-8 w-8 animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-md" />
        </template>
      </ClientOnly>

      <template v-if="links?.length">
        <UButton
          v-for="(link, index) of links"
          :key="index"
          v-bind="{ color: 'neutral', variant: 'ghost', ...link }"
        />
      </template>
    </template>

    <template #toggle="{ open, toggle }">
      <IconMenuToggle
        :open="open"
        class="lg:hidden"
        @click="toggle"
      />
    </template>

    <template #body>
      <AppHeaderBody />
    </template>
  </UHeader>
</template>
