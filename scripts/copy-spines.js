import { cp, mkdir } from 'node:fs/promises'

const src = 'src/assets/spines'
const dest = 'dist/assets/spines'

await mkdir('dist/assets', { recursive: true })
await cp(src, dest, { recursive: true })
