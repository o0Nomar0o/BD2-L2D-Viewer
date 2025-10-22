<template>
  <div class="bg-gray-900 text-white h-dvh max-h-dvh flex flex-col">
    <Navbar @toggle-animation="toggleAnimationSidebar" @toggle-character="toggleCharacterSidebar" @reload="onReloadAssets" />
    <div class="flex flex-1 flex-col lg:flex-row h-full min-h-0 overflow-hidden">
      <!-- Animation Sidebar -->
      <Motion
        v-if="showAnimationSidebar"
        class="order-1 lg:order-none hidden lg:flex flex-col min-h-0 mt-8 h-[calc(100%-2rem)]"
        :initial="{ x: -256 }"
        :animate="{ x: 0 }"
        :exit="{ x: -256 }"
        :transition="{ stiffness: 300, damping: 30 }"
      >
        <AnimationSidebar
          :animations="animations"
          :skins="skins"
          :exporting="isExporting"
          :screenshotting="isScreenshotting"
          @select="onSelectAnimation"
          @reset-camera="onResetCamera"
          @screenshot="onScreenshot"
          @export-animation="onExportAnimation"
          @category-change="onCategoryChange"
          class="lg:w-64"
        />
      </Motion>
      
      <main class="relative flex-1 overflow-hidden">
        <div class="absolute top-5 left-2 lg:hidden z-10 flex items-center gap-2">
          <button class="p-2" @click="showMobileControls = true">
            <MenuIcon />
          </button>
          <button v-show="!showMobileControls" class="p-2" @click="onResetCamera">
            <CameraResetIcon />
          </button>
          <button
            v-show="!showMobileControls"
            class="p-2"
            @click="store.playing = !store.playing"
          >
            <PauseIcon v-if="store.playing" />
            <PlayIcon v-else />
          </button>
          <select
            v-show="!showMobileControls"
            v-model="store.selectedSkin"
            class="bg-gray-700 text-white"
          >
            <option v-for="skin in skins" :key="skin" :value="skin">{{ skin }}</option>
          </select>
          <select
            v-show="!showMobileControls"
            v-model="store.selectedAnimation"
            class="bg-gray-700 text-white"
          >
            <option v-for="name in animations" :key="name" :value="name">{{ name }}</option>
          </select>
        </div>
        <div class="absolute top-14 left-4 lg:hidden z-10">
          <button
            v-show="!showMobileControls && store.characters.find(c => c.id === store.selectedCharacterId)?.datingHasNoBg && store.animationCategory === 'dating'"
            @click="store.showDatingBg = !store.showDatingBg"
          >
            <BgToggleIcon :active="store.showDatingBg" />
          </button>
        </div>
        <SpineViewer
          ref="viewerRef"
          @animations="animations = $event"
          @skins="skins = $event"
          :key="store.assetReloadToken + ':' + store.selectedCharacterId + ':' + store.animationCategory"
        />
      </main>
      
      <!-- Character Sidebar -->
      <Motion
        v-if="showCharacterSidebar"
        class="hidden lg:flex flex-col min-h-0 mt-8 h-[calc(100%-2rem)]"
        :initial="{ x: 320 }"
        :animate="{ x: 0 }"
        :exit="{ x: 320 }"
        :transition="{stiffness: 300, damping: 30 }"
      >
        <CharacterSidebar
          @select="onSelectCharacter"
          class="lg:w-80"
        />
      </Motion>
    </div>

    <!-- Removed floating toggle buttons -->

    <div
      v-if="showMobileControls"
      class="fixed inset-0 z-20 bg-gray-900 lg:hidden flex flex-col"
    >
      <button
        class="absolute top-7 right-4"
        @click="showMobileControls = false"
      >
        ✕
      </button>
      <div class="flex-1 flex flex-col gap-2 overflow-hidden p-2">
        <div class="flex-none">
          <AnimationSidebar
            :animations="animations"
            :skins="skins"
            :exporting="isExporting"
            :screenshotting="isScreenshotting"
            @select="onSelectAnimation"
            @reset-camera="onResetCamera"
            @screenshot="onScreenshot"
            @export-animation="onExportAnimation"
          />
        </div>
        <div class="flex-1 min-h-0">
          <CharacterSidebar @select="onSelectCharacter" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Motion } from '@motionone/vue'
import Navbar from '@/components/Navbar.vue'
import CharacterSidebar from '@/components/CharacterSideBar.vue'
import AnimationSidebar from '@/components/AnimationSideBar.vue'
import SpineViewer from '@/components/SpineViewer.vue'
import { ref, watchEffect, onMounted, onUnmounted } from 'vue'
import { listen } from '@tauri-apps/api/event'
import { useCharacterStore } from '@/stores/characterStore'
import { buildUrl } from './utils/urlSync'

import CameraResetIcon from '@/components/icons/CameraResetIcon.vue';
import MenuIcon from '@/components/icons/MenuIcon.vue';
import PauseIcon from '@/components/icons/PauseIcon.vue';
import PlayIcon from '@/components/icons/PlayIcon.vue';
import BgToggleIcon from '@/components/icons/BgToggleIcon.vue';



const store = useCharacterStore()

const animations = ref<string[]>([])
const skins = ref<string[]>([])
const viewerRef = ref<InstanceType<typeof SpineViewer> | null>(null)
const isExporting = ref(false)
const isScreenshotting = ref(false)
const showMobileControls = ref(false)

// Sidebar visibility states
const showAnimationSidebar = ref(true)
const showCharacterSidebar = ref(true)

// Toggle functions
function toggleAnimationSidebar() {
  showAnimationSidebar.value = !showAnimationSidebar.value
}

function toggleCharacterSidebar() {
  showCharacterSidebar.value = !showCharacterSidebar.value
}

// Keyboard shortcuts
function handleKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  if (target) {
    const tag = (target.tagName || '').toUpperCase()
    const isEditable = (target as any).isContentEditable
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || isEditable) {
      return
    }
  }

  if (event.metaKey || event.ctrlKey) {
    switch (event.key.toLowerCase()) {
      case 'a':
        event.preventDefault()
        toggleAnimationSidebar()
        return
      case 'c':
        event.preventDefault()
        toggleCharacterSidebar()
        return
    }
  }

  
  switch (event.key) {
    case ' ': // Space key
    case 'Spacebar':
      event.preventDefault()
      store.playing = !store.playing
      return
    case 'ArrowUp': {
      const list = animations.value
      if (!list.length) return
      const currentIndex = list.findIndex((n) => n === store.selectedAnimation)
      const nextIndex = currentIndex < 0 ? list.length - 1 : (currentIndex - 1 + list.length) % list.length
      store.selectedAnimation = list[nextIndex]
      event.preventDefault()
      return
    }
    case 'ArrowDown': {
      const list = animations.value
      if (!list.length) return
      const currentIndex = list.findIndex((n) => n === store.selectedAnimation)
      const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % list.length
      store.selectedAnimation = list[nextIndex]
      event.preventDefault()
      return
    }
  }
}


// Lifecycle hooks
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  // Listen for native menu File > Open… to open the upload modal
  try {
    listen('menu://file-open', () => {
      const nav = document.querySelector('nav')
      // Emit to Navbar via a custom event
      const ev = new CustomEvent('open-upload-modal')
      nav?.dispatchEvent(ev)
    })
  } catch (_) {}
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

function onSelectCharacter(id: string) {
  if (id === store.selectedCharacterId) return
  store.selectedCharacterId = id
  store.selectedAnimation = ''
  store.selectedSkin = ''
  animations.value = []
  skins.value = []
  showMobileControls.value = false
}

function onSelectAnimation(name: string) {
  store.selectedAnimation = name
  showMobileControls.value = false
}

function onResetCamera() {
  viewerRef.value?.resetCamera()
}

function onScreenshot(value: boolean) {
  if (!viewerRef.value) return
  showMobileControls.value = false
  showMobileControls.value = false
  isScreenshotting.value = true
  viewerRef.value.saveScreenshot(value)
  isScreenshotting.value = false
}

async function onExportAnimation(value: boolean) {
  if (!viewerRef.value) return
  showMobileControls.value = false
  isExporting.value = true
  await viewerRef.value.exportAnimation(value)
  isExporting.value = false
}

function onReloadAssets() {
  // Reload the current character by toggling a key path through store changes
  // This triggers SpineViewer's watchers to dispose and reload
  const id = store.selectedCharacterId
  store.selectedCharacterId = ''
  // nextTick not required; minimal delay is fine
  setTimeout(() => {
    store.selectedCharacterId = id
  }, 0)
}

function onCategoryChange() {
  showMobileControls.value = false;
}

watchEffect(() => {
  const query = buildUrl(store)
  history.replaceState(null, '', `${window.location.pathname}?${query}`)
}, { flush: 'sync' })
</script>
