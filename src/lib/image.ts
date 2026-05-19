export async function optimizeSquareImage(file: File, size = 768) {
  const source = await readFileAsDataUrl(file)
  const image = await loadImage(source)
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas is unavailable")

  context.fillStyle = "#0f1722"
  context.fillRect(0, 0, size, size)

  const ratio = Math.max(size / image.width, size / image.height)
  const drawWidth = image.width * ratio
  const drawHeight = image.height * ratio
  const x = (size - drawWidth) / 2
  const y = (size - drawHeight) / 2

  context.drawImage(image, x, y, drawWidth, drawHeight)

  return canvas.toDataURL("image/webp", 0.88)
}

export async function optimizeMessageImage(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
) {
  const source = await readFileAsDataUrl(file)
  const image = await loadImage(source)
  const canvas = document.createElement("canvas")
  const ratio = Math.min(
    1,
    maxWidth / image.width,
    maxHeight / image.height,
  )

  canvas.width = Math.max(1, Math.round(image.width * ratio))
  canvas.height = Math.max(1, Math.round(image.height * ratio))

  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas is unavailable")

  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  return canvas.toDataURL("image/webp", 0.9)
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(reader.error || new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Failed to load image"))
    image.src = src
  })
}
