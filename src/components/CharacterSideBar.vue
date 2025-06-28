<template>
  <div class="w-full md:w-80 h-full bg-gray-800 text-white flex flex-col min-h-0">
    <input
      v-model="filter"
      type="text"
      placeholder="Search..."
      class="bg-gray-700 text-white p-2 mb-2 outline-none w-full"
    />
    <div class="overflow-y-auto flex-1 px-2 sidebar-scroll">
      <div
        v-for="char in filteredCharacters"
        :key="char.id"
        class="flex items-center py-2 cursor-pointer"
        :class="{ 'bg-gray-700': char.id === store.selectedCharacterId }"
        @click="select(char.id)"
      >
        <img
          :src="icons[char.id]"
          :alt="char.costumeName"
          class="w-16 h-16 object-cover rounded-[50%]"
        />
        <span class="text-lg pl-2">{{ char.charName + ': ' + char.costumeName }}</span>
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

onMounted(() => {
  emit('select', store.selectedCharacterId)
})
</script>
