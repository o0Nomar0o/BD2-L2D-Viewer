<template>
  <div
    class="fixed inset-0 z-20 bg-gray-800/70 backdrop-blur-sm text-white flex items-center justify-center p-4"
    @click.self="$emit('close')"
  >
    <div class="relative bg-gray-900 p-4 rounded w-full max-w-lg">
      <button class="absolute top-2 right-3 cursor-pointer" @click="$emit('close')">✕</button>
      <h2 class="text-lg font-bold mb-2">Upload Spine Folder</h2>
      <p class="mb-2">
        Select a folder that contains your <strong>.atlas</strong>, <strong>.skel</strong> or <strong>.json</strong>, and related <strong>.png</strong> files (Spine 4.1).
        The character name will be taken from the folder name.
      </p>
      <div
        class="border-2 border-dashed rounded p-4 text-center mb-2"
        @dragover.prevent
        @drop.prevent="onDrop"
      >
        <input
          ref="fileInput"
          type="file"
          webkitdirectory
          directory
          class="hidden"
          @change="onFiles"
        />
        <p class="mb-2">
          Drag a folder here or
          <span class="text-blue-400 underline cursor-pointer" @click="fileInput?.click()">choose folder</span>
        </p>
        <div v-if="fileNames.length" class="text-sm break-words">{{ fileNames.join(', ') }}</div>
      </div>
      <div class="min-h-[1.5em] text-sm mb-2" :class="msgClass">{{ message }}</div>
      <div class="text-right">
        <button
          class="bg-gray-600 hover:bg-gray-500 text-white rounded px-4 py-2"
          @click="process"
          :disabled="loading || !files.length"
        >
          <LoadingIcon v-if="loading" />
          <span v-else>Upload</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'

import LoadingIcon from '@/components/icons/LoadingIcon.vue'

const emit = defineEmits(['close'])
const store = useCharacterStore()

const fileInput = ref<HTMLInputElement | null>(null)
const files = ref<File[]>([])
const message = ref('')
const success = ref(false)
const loading = ref(false)

const fileNames = computed(() => files.value.map(f => f.name))
const msgClass = computed(() => (success.value ? 'text-green-400' : 'text-red-400'))

function onFiles(e: Event) {
  const list = Array.from((e.target as HTMLInputElement).files || [])
  files.value = list
}

function onDrop(e: DragEvent) {
  const list = Array.from(e.dataTransfer?.files || [])
  files.value = list
}

function getFolderName(): string | undefined {
  if (!files.value.length) return undefined
  // Prefer folder from webkitRelativePath when available
  const withRel = files.value.find(f => (f as any).webkitRelativePath && (f as any).webkitRelativePath.includes('/'))
  if (withRel) {
    const rel = String((withRel as any).webkitRelativePath)
    const top = rel.split('/')[0]
    if (top) return top
  }
  // Fallback: use base name (without extension) from atlas or first file
  const atlas = files.value.find(f => f.name.toLowerCase().endsWith('.atlas'))
  const baseFrom = (atlas ?? files.value[0]).name
  const dot = baseFrom.lastIndexOf('.')
  return dot > 0 ? baseFrom.slice(0, dot) : baseFrom
}

function process() {
  message.value = ''
  success.value = false
  if (!files.value.length) {
    message.value = 'Please select a folder.'
    return
  }

  const folderName = getFolderName()
  if (!folderName) {
    message.value = 'Could not determine folder name.'
    return
  }

  const atlas = files.value.find(f => f.name.toLowerCase().endsWith('.atlas'))
  const json = files.value.find(f => f.name.toLowerCase().endsWith('.json'))
  const skel = files.value.find(f => f.name.toLowerCase().endsWith('.skel'))
  const textures = files.value.filter(f => f.name.toLowerCase().endsWith('.png'))
  if (!atlas || (!skel && !json)) {
    message.value = 'Atlas and/or skeleton files are missing.'
    return
  }

  loading.value = true
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const atlasText = String(reader.result)
      const regex = /([^\s]+\.png)/g
      const referenced = Array.from(atlasText.matchAll(regex)).map(m => m[1])
      const missing = referenced.filter(n => !textures.some(t => t.name === n))
      if (missing.length > 0) {
        message.value = `Missing images: ${missing.join(', ')}`
        loading.value = false
        return
      }
      const skelUrl = skel ? URL.createObjectURL(skel) : undefined
      const jsonUrl = json ? URL.createObjectURL(json) : undefined
      const atlasUrl = URL.createObjectURL(atlas)
      const base = atlasUrl.slice(0, atlasUrl.lastIndexOf('/') + 1)
      const images = Object.fromEntries(textures.map(t => [base + t.name, URL.createObjectURL(t)]))
      const customFiles = {
        skel: skelUrl,
        json: jsonUrl,
        atlas: atlasUrl,
        images,
      }
      const char = {
        id: `custom-${Date.now()}`,
        charName: folderName,
        costumeName: 'Custom',
        spine: '',
        cutscene: '',
        dating: '',
        datingHasNoBg: false,
        customFiles,
      }
      store.characters.unshift(char)
      store.selectedCharacterId = char.id
      success.value = true
      message.value = 'Upload successful.'
      loading.value = false
      emit('close')
    } catch (err) {
      message.value = `Unexpected error: ${(err as Error).message}`
      loading.value = false
    }
  }
  reader.onerror = () => {
    message.value = 'Failed to read atlas.'
    loading.value = false
  }
  reader.readAsText(atlas)
}
</script>
