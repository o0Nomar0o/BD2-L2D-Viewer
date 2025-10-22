<template>
  <div
    class="fixed inset-0 z-20 bg-gray-800/70 backdrop-blur-sm text-white flex items-center justify-center p-4"
    @click.self="$emit('close')"
  >
    <div class="relative bg-gray-900 p-4 rounded overflow-y-auto max-h-full w-full max-w-3xl">
      <a href="https://github.com/Jelosus2/BD2-L2D-Viewer" target="_blank">
        <GithubIcon class="w-4 h-4" />
      </a>
      <button class="absolute top-2 right-3 cursor-pointer" @click="$emit('close')">✕</button>
      <div v-for="entry in changelog" :key="entry.date" class="mb-4">
        <div class="text-lg font-bold underline">{{ entry.date }}</div>
        <ul class="list-disc list-inside">
          <li v-for="(change, idx) in entry.changes" :key="idx">{{ change }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import changelog from "@/utils/changelog";
import GithubIcon from '@/components/icons/GithubIcon.vue';
</script>
