<template>
  <div class="w-full lg:w-80 h-full bg-slate-900 text-white flex flex-col min-h-0">
    <input
      v-model="filter"
      type="text"
      placeholder="Search..."
      class="bg-slate-800 text-white p-2 mb-2 outline-none w-full"
    />
    <div class="overflow-y-auto flex-1 px-2 sidebar-scroll">
      <div
        v-for="char in filteredCharacters"
        :key="char.id"
        class="flex items-center py-2 cursor-pointer"
        :class="{ 'bg-slate-800': char.id === store.selectedCharacterId }"
        @click="select(char.id)"
      >
        <img
          :src="icons[char.id] || icons['unknown']"
          :alt="char.costumeName"
          class="w-16 h-16 object-cover rounded-[50%]"
        />
        <span class="text-lg pl-2 flex-1">{{ char.charName + ': ' + char.costumeName }}</span>
        <button
          v-if="char.customFiles"
          class="px-2 py-1 mr-2 rounded bg-slate-700 hover:bg-slate-600 character-controls"
          title="Remove imported character"
          @click.stop="removeCharacter(char.id)"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import icons from '@/utils/charIcons';
import { ref, computed, onMounted } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'

const emit = defineEmits(['select'])
const store = useCharacterStore()

const filter = ref('')

const filteredCharacters = computed(() =>
  store.characters.filter((c) =>
    (c.charName + ' ' + c.costumeName)
      .toLowerCase()
      .includes(filter.value.toLowerCase())
  )
)

function select(id: string) {
  if (id === store.selectedCharacterId) return
  emit('select', id)
  store.selectedCharacterId = id
}

function revokeCustomFiles(charId: string) {
  const c = store.characters.find(c => c.id === charId)
  if (!c || !c.customFiles) return
  // Revoke all Blob URLs to free memory
  try {
    if (c.customFiles.skel) URL.revokeObjectURL(c.customFiles.skel)
    if (c.customFiles.json) URL.revokeObjectURL(c.customFiles.json)
    if (c.customFiles.atlas) URL.revokeObjectURL(c.customFiles.atlas)
    for (const url of Object.values(c.customFiles.images)) URL.revokeObjectURL(url)
  } catch (_) {}
}

function removeCharacter(id: string) {
  const idx = store.characters.findIndex(c => c.id === id)
  if (idx < 0) return
  revokeCustomFiles(id)
  // If removing currently selected, move selection safely
  const removingSelected = store.selectedCharacterId === id
  store.characters.splice(idx, 1)
  if (removingSelected) {
    store.selectedCharacterId = store.characters.length ? store.characters[0].id : ''
  }
}

onMounted(() => {
  emit('select', store.selectedCharacterId)
})
</script>

<style scoped>
.character-controls {
  overflow: scroll;
}
</style>