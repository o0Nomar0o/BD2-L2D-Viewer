<template>
  <div class="w-full lg:w-64 lg:h-full bg-gray-800 text-white flex flex-col min-h-0">
    <div class="flex-1 min-h-0 px-2 hidden lg:flex flex-col gap-2">
      <span class="pt-2">Skins</span>
      <select
        v-model="store.selectedSkin"
        class="bg-gray-700 text-white"
      >
        <option v-for="skin in skins" :key="skin" :value="skin">{{ skin }}</option>
      </select>
      <span>Animations</span>
      <div class="overflow-y-auto sidebar-scroll flex-1">
        <div
          v-for="name in animations"
          :key="name"
          class="py-2 pl-2 cursor-pointer"
          :class="{ 'bg-gray-700': name === selectedAnimation }"
          @click="select(name)"
        >
          {{ name }}
        </div>
      </div>
    </div>
    <div class="lg:mt-auto flex flex-col">
      <div v-if="!currentChar?.customFiles" class="p-2">
        <span>Animation Category</span>
        <select v-model="store.animationCategory" class="bg-gray-700 text-white w-full">
          <option value="character">Character</option>
          <option value="ultimate" :disabled="!currentChar?.cutscene">Ultimate</option>
          <option value="dating" :disabled="!currentChar?.dating">Fated Guest</option>
        </select>
      </div>
      <div class="p-2">
        <span>Animation Speed</span>
        <div class="flex items-center gap-2">
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.05"
            v-model.number="store.animationSpeed"
            class="flex-1"
          />
          <span class="w-12 text-right">{{ store.animationSpeed.toFixed(2) }}x</span>
        </div>
      </div>
      <div class="p-2 gap-2 hidden lg:flex">
        <button
          class="bg-gray-600 hover:bg-gray-500 text-white rounded shadow transition px-4 py-2"
          @click="emit('reset-camera')"
        >
          Reset View
        </button>
        <button
          class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow transition px-4 py-2"
          @click="store.playing = !store.playing"
        >
          {{ toggleLabel }}
        </button>
      </div>
      <div class="p-2 flex">
        <button
          class="flex-1 bg-gray-600 hover:bg-gray-500 text-white rounded shadow transition px-4 py-2"
          @click="colorInput?.click()"
        >
          BG Color
        </button>
        <input
          ref="colorInput"
          type="color"
          class="hidden"
          @input="onColorChange"
        />
      </div>
      <div class="p-2 flex gap-2 items-center">
        <button
          class="flex-1 bg-gray-600 hover:bg-gray-500 text-white rounded shadow transition px-4 py-2"
          @click="onScreenshot"
          :disabled="screenshotting"
        >
          <LoadingIcon v-if="screenshotting" />
          <span v-else>Screenshot</span>
        </button>
        <label class="flex items-center gap-1 text-sm whitespace-nowrap">
          <input type="checkbox" v-model="transparentBg" />
          <span>Transparent<br />image/export</span>
        </label>
      </div>
      <div class="p-2 hidden md:flex">
        <button
          class="flex-1 bg-gray-600 hover:bg-gray-500 text-white rounded shadow transition px-4 py-2"
          @click="onExport"
          :disabled="exporting"
        >
          <LoadingIcon v-if="exporting" />
          <span v-else>Export Animation</span>
        </button>
      </div>
      <div class="p-2">
        <label class="flex items-center gap-1 text-sm whitespace-nowrap">
          <input type="checkbox" v-model="store.useCurrentCamera" />
          <span>Use current camera in image/export</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, toRefs, ref, watch } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'

import LoadingIcon from '@/components/icons/LoadingIcon.vue';

const props = defineProps<{ animations: string[]; skins: string[]; exporting: boolean; screenshotting: boolean }>()
const { animations, skins, exporting, screenshotting } = toRefs(props)

const store = useCharacterStore()
const colorInput = ref<HTMLInputElement | null>(null)
const transparentBg = ref(false)

const emit = defineEmits(['select', 'reset-camera', 'screenshot', 'export-animation', 'category-change'])

function select(name: string) {
  emit('select', name)
  store.selectedAnimation = name
}

function onColorChange(e: Event) {
  const input = e.target as HTMLInputElement
  store.backgroundColor = input.value
}

function onScreenshot() {
  emit('screenshot', transparentBg.value)
}

function onExport() {
  emit('export-animation', transparentBg.value)
}

const selectedAnimation = computed(() => store.selectedAnimation)
const toggleLabel = computed(() => (store.playing ? 'Pause' : 'Play'))
const currentChar = computed(() => store.characters.find(c => c.id === store.selectedCharacterId))

watch(() => store.animationCategory, () => {
  emit('category-change');
});
</script>
