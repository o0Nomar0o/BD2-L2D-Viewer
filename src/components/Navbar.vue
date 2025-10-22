<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div>
    <nav class="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-transparent text-white p-1 pr-3" data-tauri-drag-region>
      <div class="text-[11px] tracking-widest uppercase opacity-60"></div>
      <div class="flex items-center gap-2 title-controls">
        <div class="hidden md:flex items-center">
          <div class="relative h-6 flex items-center">
            <select
              aria-label="Drag speed"
              class="appearance-none h-6 leading-6 bg-transparent border border-white/30 text-white text-[11px] rounded-md pl-2 pr-6 focus:outline-none focus:ring-1 focus:ring-white/40 align-middle"
              v-model.number="store.dragSpeedMultiplier"
            >
              <option :value="1">1.0x</option>
              <option :value="1.2">1.2x</option>
              <option :value="1.25">1.25x</option>
              <option :value="1.5">1.5x</option>
              <option :value="1.75">1.75x</option>
              <option :value="2">2.0x</option>
            </select>
            <svg class="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <button class="h-6 w-6 flex items-center justify-center rounded-md bg-transparent border border-white/30 hover:bg-white/10 text-[11px]" title="Toggle Animation (Cmd+A)" @click="emit('toggle-animation')">A</button>
          <button class="h-6 w-6 flex items-center justify-center rounded-md bg-transparent border border-white/30 hover:bg-white/10 text-[11px]" title="Toggle Character (Cmd+C)" @click="emit('toggle-character')">C</button>
        </div>
        <div class="flex items-center gap-1">
          <button class="h-6 w-6 flex items-center justify-center rounded-md bg-transparent border border-white/30 hover:bg-white/10" title="Reload" @click="emit('reload')">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-3-6.7"/>
              <polyline points="21 3 21 9 15 9"/>
            </svg>
          </button>
          <button class="h-6 w-6 flex items-center justify-center rounded-md bg-transparent border border-white/30 hover:bg-white/10" 
          @click="">
            <CameraResetIcon />
          </button>
          <button class="h-6 w-6 flex items-center justify-center rounded-md bg-transparent border border-white/30 hover:bg-white/10" title="Upload" @click="showUploadModal = true">
            <PlusIcon class="w-3.5 h-3.5" />
          </button>
          <button class="h-6 w-6 flex items-center justify-center rounded-md bg-transparent border border-white/30 hover:bg-white/10" title="Changelog" @click="showChangelog = true">
            <ChangelogIcon class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </nav>
    <UploadSpineModal v-if="showUploadModal" @close="showUploadModal = false" />
    <ChangelogModal v-if="showChangelog" @close="showChangelog = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useCharacterStore } from '@/stores/characterStore'
import { listen } from '@tauri-apps/api/event'
import ChangelogModal from '@/components/ChangelogModal.vue';
import UploadSpineModal from '@/components/UploadSpineModal.vue';
import CameraResetIcon from '@/components/icons/CameraResetIcon.vue';
import ChangelogIcon from '@/components/icons/ChangelogIcon.vue';
import PlusIcon from '@/components/icons/PlusIcon.vue';



const showChangelog = ref(false);
const showUploadModal = ref(false);

const emit = defineEmits(['toggle-animation', 'toggle-character', 'reload'])

const store = useCharacterStore()


let unlisten: null | (() => void) = null
onMounted(async () => {
  try {
    unlisten = await listen('menu://file-open', () => {
      showUploadModal.value = true
    })
  } catch (_) {
    // ignore if not running under Tauri
  }
})
onUnmounted(() => {
  if (unlisten) {
    unlisten()
    unlisten = null
  }
})
</script>

<style scoped>
.title-controls > * {
  -webkit-app-region: no-drag;
}
</style>
