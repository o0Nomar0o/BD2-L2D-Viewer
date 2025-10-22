import { defineStore } from 'pinia'
import character_list from '@/utils/character_list'

type AnimationCategory = 'character' | 'ultimate' | 'dating'
export interface Character {
  id: string
  charName: string
  costumeName: string
  spine: string
  cutscene: string
  dating: string
  datingHasNoBg?: boolean,
  customFiles?: {
    skel?: string,
    json?: string,
    atlas: string,
    images: Record<string, string>
  }
}

const characterArray: Character[] = Object.entries(character_list).map(([id, char]) => ({
  id,
  datingHasNoBg: true,
  ...char,
}))

export const useCharacterStore = defineStore('characterStore', {
  state: () => ({
    characters: characterArray as Character[],
    selectedCharacterId: characterArray.length ? characterArray[0].id : '',
    selectedAnimation: '',
    selectedSkin: '',
    animationCategory: 'character' as AnimationCategory,
    playing: true,
    animationSpeed: 1,
    backgroundColor: '#1f2937',
    useCurrentCamera: false,
    showDatingBg: true,
    dragSpeedMultiplier: 1.5,
    // Per-character camera state (preserved while the app is running)
    cameraByCharacter: {} as Record<string, { x: number; y: number; zoom: number }>,
    // Token used to force asset reload (cache-busting)
    assetReloadToken: 0,
    // Keep a very small MRU of custom characters we keep in-memory
    mruCustomIds: [] as string[],
  }),
  actions: {
    addToMru(id: string) {
      const idx = this.mruCustomIds.indexOf(id)
      if (idx >= 0) this.mruCustomIds.splice(idx, 1)
      this.mruCustomIds.unshift(id)
    },
    revokeCustomFiles(charId: string) {
      const c = this.characters.find(c => c.id === charId)
      if (!c || !c.customFiles) return
      try {
        if (c.customFiles.skel) URL.revokeObjectURL(c.customFiles.skel)
        if (c.customFiles.json) URL.revokeObjectURL(c.customFiles.json)
        if (c.customFiles.atlas) URL.revokeObjectURL(c.customFiles.atlas)
        for (const url of Object.values(c.customFiles.images)) URL.revokeObjectURL(url)
      } catch (_) {}
      c.customFiles = undefined
    },
    trimMemory(maxKeep: number) {
      // Ensure MRU has at most maxKeep items
      if (this.mruCustomIds.length > maxKeep) this.mruCustomIds.length = maxKeep
      const keep = new Set(this.mruCustomIds)
      // Revoke custom assets for all characters not in keep set
      for (const c of this.characters) {
        if (c.customFiles && !keep.has(c.id)) {
          this.revokeCustomFiles(c.id)
        }
      }
    },
  },
})
