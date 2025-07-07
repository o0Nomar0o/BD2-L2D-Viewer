<template>
  <div class="bg-gray-900 text-white h-dvh max-h-dvh flex flex-col">
    <Navbar />
    <div class="flex flex-1 flex-col md:flex-row h-full min-h-0 overflow-hidden">
      <div class="order-1 md:order-none hidden md:flex flex-col min-h-0">
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
          class="md:w-64"
        />
      </div>
      <main class="relative flex-1 p-2 overflow-hidden">
        <div class="absolute top-2 left-2 md:hidden z-10 flex items-center gap-2">
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
        <SpineViewer ref="viewerRef" @animations="animations = $event" @skins="skins = $event" />
      </main>
      <div class="hidden md:flex flex-col min-h-0">
        <CharacterSidebar
          @select="onSelectCharacter"
          class="md:w-80"
        />
      </div>
    </div>
    <div
      v-if="showMobileControls"
      class="fixed inset-0 z-20 bg-gray-900 md:hidden flex flex-col"
    >
      <button
        class="absolute top-3 right-4"
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
import Navbar from '@/components/Navbar.vue'
import CharacterSidebar from '@/components/CharacterSideBar.vue'
import AnimationSidebar from '@/components/AnimationSideBar.vue'
import SpineViewer from '@/components/SpineViewer.vue'
import { ref, watchEffect } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { buildUrl } from './utils/urlSync'

import CameraResetIcon from '@/components/icons/CameraResetIcon.vue';
import MenuIcon from '@/components/icons/MenuIcon.vue';
import PauseIcon from '@/components/icons/PauseIcon.vue';
import PlayIcon from '@/components/icons/PlayIcon.vue';

const store = useCharacterStore()

const animations = ref<string[]>([])
const skins = ref<string[]>([])
const viewerRef = ref<InstanceType<typeof SpineViewer> | null>(null)
const isExporting = ref(false)
const isScreenshotting = ref(false)
const showMobileControls = ref(false)

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

function onCategoryChange() {
  showMobileControls.value = false;
}

watchEffect(() => {
  const query = buildUrl(store)
  history.replaceState(null, '', `${window.location.pathname}?${query}`)
}, { flush: 'sync' })
</script>
