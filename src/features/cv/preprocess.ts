export interface PreprocessOptions {
  maxWidth?: number
}

export const preprocessImage = async (
  imageBitmap: ImageBitmap,
  options: PreprocessOptions = {},
): Promise<HTMLCanvasElement> => {
  console.log('preprocessImage', imageBitmap.width, imageBitmap.height)
  const maxWidth = options.maxWidth ?? 1000
  const scale = Math.min(1, maxWidth / imageBitmap.width)
  const width = Math.round(imageBitmap.width * scale)
  const height = Math.round(imageBitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Cannot get canvas context')

  ctx.filter = 'contrast(110%) brightness(105%)'
  ctx.drawImage(imageBitmap, 0, 0, width, height)
  return canvas
}

