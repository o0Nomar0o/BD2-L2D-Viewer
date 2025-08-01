<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div>
    <nav class="flex items-center justify-between bg-black text-white p-4">
      <div class="text-xl md:text-3xl font-bold">Brown Dust 2 L2D Viewer</div>
      <div class="flex items-center gap-4">
        <button class="cursor-pointer" @click="showUploadModal = true">
          <PlusIcon class="w-5 h-5 md:w-7 md:h-7" />
        </button>
        <button class="cursor-pointer" @click="showChangelog = true">
          <ChangelogIcon class="w-5 h-5 md:w-7 md:h-7" />
        </button>
        <a href="https://github.com/Jelosus2/BD2-L2D-Viewer" target="_blank">
          <GithubIcon class="w-5 h-5 md:w-7 md:h-7" />
        </a>
      </div>
    </nav>
    <UploadSpineModal v-if="showUploadModal" @close="showUploadModal = false" />
    <ChangelogModal v-if="showChangelog" @close="showChangelog = false" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ChangelogModal from '@/components/ChangelogModal.vue';
import UploadSpineModal from '@/components/UploadSpineModal.vue';

import GithubIcon from '@/components/icons/GithubIcon.vue';
import ChangelogIcon from '@/components/icons/ChangelogIcon.vue';
import PlusIcon from '@/components/icons/PlusIcon.vue';

const showChangelog = ref(false);
const showUploadModal = ref(false);
</script>
