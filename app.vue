<script setup lang="ts">
const userStore = useUserStore()

onMounted(() => {
    if (import.meta.client) {
        const savedTheme = localStorage.getItem('ciplow_accent_theme') as any
        if (savedTheme) {
            userStore.setAccentTheme(savedTheme)
        }
    }
})
</script>

<template>
    <div>
        <VitePwaManifest />
        <NuxtRouteAnnouncer />
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </div>
</template>
