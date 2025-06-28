export async function premultiplyImage(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to load image: ${url}`)
  }
  const blob = await res.blob()
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3] / 255
    data[i] = Math.round(data[i] * a)
    data[i + 1] = Math.round(data[i + 1] * a)
    data[i + 2] = Math.round(data[i + 2] * a)
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}
