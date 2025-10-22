declare module '@motionone/vue' {
  import type { DefineComponent } from 'vue'
  export const Motion: DefineComponent<Record<string, any>, {}, any>
  const _default: {
    Motion: typeof Motion
  }
  export default _default
}
