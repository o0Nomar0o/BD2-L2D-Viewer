<template>
  <div class="relative w-full h-full">
    <div ref="container" class="w-full h-full"></div>
    <button
      v-show="store.characters.find(c => c.id === store.selectedCharacterId)?.datingHasNoBg && store.animationCategory === 'dating'"
      @click="store.showDatingBg = !store.showDatingBg"
      class="absolute z-10 left-2 top-2 hidden lg:block cursor-pointer"
    >
      <BgToggleIcon :active="store.showDatingBg" />
    </button>
    <input
      type="range"
      min="0"
      max="1"
      step="0.001"
      v-model.number="progress"
      @input="seek"
      class="seek-range absolute bottom-0 left-0 w-full"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { SpinePlayer, Vector2, CameraController, OrthoCamera, GLTexture } from '@esotericsoftware/spine-player'

import type { Animation } from '@esotericsoftware/spine-player'
import type { SpinePlayerInternal } from '@/types/spine-player-internal'

import BgToggleIcon from '@/components/icons/BgToggleIcon.vue'

const container = ref<HTMLDivElement | null>(null)
const progress = ref(0)
const store = useCharacterStore()

const emit = defineEmits(['animations', 'skins'])

let player: SpinePlayer | null = null
let recorder: MediaRecorder | null = null
let cancelExport = false
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let cameraCtrl: CameraController | null = null
let manualCamera: OrthoCamera | null = null
let defaultCameraPos = new Vector2()
let defaultZoom = 0

let offset = new Vector2()
let size = new Vector2()

async function load() {
  if (!container.value) return

  const char = store.characters.find(c => c.id === store.selectedCharacterId)
  if (!char) return

  const ANIMATION_TYPE_BASE_PATH = {
    character: char.spine,
    ultimate: `cutscene/${char.cutscene}`,
    dating: !store.showDatingBg && char.datingHasNoBg ? `dating_nobg/${char.dating}` : `dating/${char.dating}`
  }

  const assetRoot = import.meta.env.DEV ? 'src/assets/spines' : 'assets/spines'
  const path = `${assetRoot}/${char.id}/${ANIMATION_TYPE_BASE_PATH[store.animationCategory]}`

  const binaryUrl = char.customFiles?.skel || `${path}.skel`
  const jsonUrl = char.customFiles?.json
  const atlasUrl = char.customFiles?.atlas || `${path}.atlas`
  const rawDataURIs = char.customFiles?.images

  offset = new Vector2()
  size = new Vector2()

  if (player) {
    player.dispose()
    container.value.innerHTML = ''
    cameraCtrl = null
    manualCamera = null
  }

  const originalUpdate = GLTexture.prototype.update;
  GLTexture.prototype.update = function (useMipMaps: boolean) {
    const gl = this.context.gl;
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
    originalUpdate.call(this, useMipMaps)
  }

  player = new SpinePlayer(container.value, {
    showControls: false,
    ...((binaryUrl && !jsonUrl) && { binaryUrl }),
    ...(jsonUrl && { jsonUrl }),
    atlasUrl,
    rawDataURIs,
    backgroundColor: store.backgroundColor,
    preserveDrawingBuffer: true,
    premultipliedAlpha: true,
    alpha: true,
    viewport: {
      x: offset.x,
      y: offset.y,
      width: size.x,
      height: size.y,
      padLeft: 0,
      padRight: 0,
      padTop: 50,
      padBottom: 50,
      transitionTime: 0,
    },
    update: () => {
      if (manualCamera && player) {
        const cam = player.sceneRenderer!.camera
        cam.position.x = manualCamera.position.x
        cam.position.y = manualCamera.position.y
        cam.zoom = manualCamera.zoom
        cam.update()
      }
      if (player && store.playing) {
        const entry = player.animationState?.getCurrent(0)
        if (entry && entry.animation) {
          const d = entry.animation.duration
          if (d > 0) {
            progress.value = (entry.trackTime % d) / d
          }
        }
      }
    },
    success: (p: SpinePlayer) => {
      offset = new Vector2()
      size = new Vector2()
      p.skeleton?.setToSetupPose()
      p.skeleton?.updateWorldTransform()
      p.skeleton?.getBounds(offset, size)
      const centerX = offset.x + size.x / 2
      const centerY = offset.y + size.y / 2;

      (p as unknown as SpinePlayerInternal).config.viewport = {
        x: offset.x,
        y: offset.y,
        width: size.x,
        height: size.y,
        padLeft: 0,
        padRight: 0,
        padTop: 50,
        padBottom: 50,
        transitionTime: 0,
        animations: {},
      }

      manualCamera = new OrthoCamera(
        p.sceneRenderer!.camera.viewportWidth,
        p.sceneRenderer!.camera.viewportHeight
      )
      manualCamera.position.x = centerX
      manualCamera.position.y = centerY
      const paddedWidth = size.x
      const paddedHeight = size.y + 100
      const canvas = p.canvas!
      const canvasAspect = canvas.height / canvas.width
      const viewportAspect = paddedHeight / paddedWidth
      manualCamera.zoom =
        canvasAspect > viewportAspect
          ? paddedWidth / canvas.width
          : paddedHeight / canvas.height
      manualCamera.update()
      defaultCameraPos = new Vector2(manualCamera.position.x, manualCamera.position.y)
      defaultZoom = manualCamera.zoom
      cameraCtrl = new CameraController(p.canvas!, manualCamera)

      const names = p.animationState?.data.skeletonData.animations.map((a: Animation) => a.name) || []
      emit('animations', names)
      const skinNames = p.skeleton?.data.skins.map(s => s.name) || []
      emit('skins', skinNames)

      if (!store.selectedAnimation || !names.includes(store.selectedAnimation)) {
        store.selectedAnimation = names[0]
      }
      if (!store.selectedSkin || !skinNames.includes(store.selectedSkin)) {
        store.selectedSkin = skinNames[0]
      }
      if (store.selectedAnimation) {
        p.setAnimation(store.selectedAnimation, true)
        if (store.playing) {
          p.play()
        } else {
          p.pause()
        }
      }
      if (store.selectedSkin) {
        p.skeleton?.setSkinByName(store.selectedSkin)
        p.skeleton?.setSlotsToSetupPose()
        p.skeleton!.updateWorldTransform()
      }
      p.speed = store.animationSpeed
    },
  });
  player.speed = store.animationSpeed
}

watch(() => store.selectedCharacterId, () => {
  if (recorder && recorder.state === 'recording') {
    cancelExport = true
    recorder.stop()
  }
  store.animationCategory = 'character';
  void load()
})
watch(() => store.animationCategory, () => {
  if (recorder && recorder.state === 'recording') {
    cancelExport = true
    recorder.stop()
  }
  void load()
})
watch(() => store.selectedAnimation, anim => {
  if (recorder && recorder.state === 'recording') {
    cancelExport = true
    recorder.stop()
  }
  progress.value = 0
  if (player && anim) {
    player.setAnimation(anim, true)
    store.playing = true;
    player.play();
  }
})
watch(() => store.selectedSkin, skin => {
  if (player && skin) {
    player.skeleton?.setSkinByName(skin)
    player.skeleton?.setSlotsToSetupPose()
    player.animationState?.apply(player.skeleton!)
    player.skeleton!.updateWorldTransform()
  }
})
watch(() => store.playing, playing => {
  if (!player) return;
  if (playing) {
    player.play()
  } else {
    player.pause()
  }
})
watch(() => store.animationSpeed, speed => {
  if (player) player.speed = speed
})
watch(() => store.backgroundColor, color => {
  if (player) {
    (player as unknown as SpinePlayerInternal).config.backgroundColor = color;
    (player as unknown as SpinePlayerInternal).bg.setFromString(color);
    if (!(player as unknown as SpinePlayerInternal).config.alpha) {
      player.dom.style.backgroundColor = color.startsWith('#')
        ? color
        : `#${color}`
    }
  }
})
watch(() => store.showDatingBg, () => {
  if (recorder && recorder.state === 'recording') {
    cancelExport = true
    recorder.stop()
  }
  void load()
})

onMounted(() => {
  void load()
})

function seek() {
  if (!player) return
  const entry = player.animationState?.getCurrent(0)
  if (entry && entry.animation && player.skeleton) {
    const newTime = entry.animationEnd * progress.value
    entry.trackTime = newTime
    entry.nextTrackLast = newTime
    player.animationState!.apply(player.skeleton)
    player.skeleton.updateWorldTransform()
    ;(player as unknown as SpinePlayerInternal).drawFrame(false)
  }
}

function resetCamera() {
  if (!manualCamera) return
  manualCamera.position.x = defaultCameraPos.x
  manualCamera.position.y = defaultCameraPos.y
  manualCamera.zoom = defaultZoom
  manualCamera.update()
}

function saveScreenshot(transparent: boolean) {
  if (!player || !manualCamera) return

  const canvas = player.canvas!
  const animationName = store.selectedAnimation
  const cam = manualCamera
  const prevPos = new Vector2(cam.position.x, cam.position.y)
  const prevZoom = cam.zoom
  const prevWidth = canvas.width
  const prevHeight = canvas.height
  const prevStyleWidth = canvas.style.width
  const prevStyleHeight = canvas.style.height

  const prevViewportWidth = player.sceneRenderer!.camera.viewportWidth
  const gl = (player as unknown as SpinePlayerInternal).context.gl
  const maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
  const captureSize = Math.min(3000, maxTexSize)
  if (!store.useCurrentCamera) {
    cam.position.x = defaultCameraPos.x
    cam.position.y = defaultCameraPos.y
    const paddedWidth = size.x
    const paddedHeight = size.y + 100
    cam.zoom = Math.max(paddedWidth / captureSize, paddedHeight / captureSize)
    cam.update()
  } else {
    cam.zoom = (prevViewportWidth * prevZoom) / captureSize
    cam.update()
  }

  const dpr = window.devicePixelRatio || 1
  canvas.width = captureSize
  canvas.height = captureSize
  canvas.style.width = `${captureSize / dpr}px`
  canvas.style.height = `${captureSize / dpr}px`

  const bgColor = (player as unknown as SpinePlayerInternal).config.backgroundColor as string
  if (transparent) {
    (player as unknown as SpinePlayerInternal).bg.setFromString('00000000')
  }
  (player as unknown as SpinePlayerInternal).drawFrame(false)
  requestAnimationFrame(() => {
    const url = canvas.toDataURL('image/png')
    if (transparent) {
      (player as unknown as SpinePlayerInternal).bg.setFromString(bgColor)
    }

    canvas.width = prevWidth
    canvas.height = prevHeight
    canvas.style.width = prevStyleWidth
    canvas.style.height = prevStyleHeight

    if (!store.useCurrentCamera) {
      cam.position.x = prevPos.x
      cam.position.y = prevPos.y
      cam.zoom = prevZoom
      cam.update()
    } else {
      cam.zoom = prevZoom
      cam.update()
    }
    (player as unknown as SpinePlayerInternal).drawFrame(false)

    const a = document.createElement('a')
    a.href = url
    a.download = `screenshot_${store.selectedCharacterId}_${animationName}.png`
    a.click()
  })
}

function exportAnimation(transparent: boolean): Promise<void> {
  const p = player
  const cam = manualCamera
  if (!p || !cam) return Promise.resolve()

  cancelExport = false

  const canvas = p.canvas!
  const animationName = store.selectedAnimation
  const fps = 60
  const bgColor = (p as unknown as SpinePlayerInternal).config.backgroundColor as string

  return new Promise(resolve => {
    if (transparent) {
      (p as unknown as SpinePlayerInternal).bg.setFromString('00000000')
    }

    const prevPos = new Vector2(cam.position.x, cam.position.y)
    const prevZoom = cam.zoom

    if (!store.useCurrentCamera) {
      cam.position.x = defaultCameraPos.x
      cam.position.y = defaultCameraPos.y
      const paddedWidth = size.x
      const paddedHeight = size.y + 100
      cam.zoom = Math.max(
        paddedWidth / canvas.width,
        paddedHeight / canvas.height,
      )
      cam.update()
    }
    const mimeType = 'video/webm'
    const stream = canvas.captureStream(fps)
    recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 10_000_000,
    })

    const chunks: BlobPart[] = []
    recorder.ondataavailable = e => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    const wasPlaying = store.playing

    recorder.onstop = () => {
      if (!cancelExport) {
        const blob = new Blob(chunks, { type: mimeType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `animation_${store.selectedCharacterId}_${animationName}.webm`
        a.click()
        URL.revokeObjectURL(url)
      }
      if (transparent) {
        ;(p as unknown as SpinePlayerInternal).bg.setFromString(bgColor)
      }
      if (!wasPlaying) p.pause()
      if (!store.useCurrentCamera) {
        cam.position.x = prevPos.x
        cam.position.y = prevPos.y
        cam.zoom = prevZoom
        cam.update()
      }
      recorder = null
      cancelExport = false
      resolve()
    }

    const animName = store.selectedAnimation
    let duration = 3
    if (animName && p.animationState) {
      const anim = p.animationState.data.skeletonData.animations.find(
        (a: Animation) => a.name === animName,
      )
      if (anim) duration = anim.duration
      p.setAnimation(animName, true)
    }

    const recordDuration = duration / (p.speed || store.animationSpeed || 1)

    p.play()
    recorder.start()

    setTimeout(() => {
      if (recorder && recorder.state === 'recording') {
        recorder.stop()
      }
    }, recordDuration * 1000)
  })
}

defineExpose({ resetCamera, saveScreenshot, exportAnimation })
</script>

<style scoped>
.seek-range {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background-color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
}
.seek-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  border: 1px solid #6b7280;
}
.seek-range::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  border: 1px solid #6b7280;
}
</style>
