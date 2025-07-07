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
}

const characterArray: Character[] = Object.entries(character_list).map(([id, char]) => ({
  id,
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
    useCurrentCamera: false
  }),
})
