export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function dataURLByteLength(dataURL) {
  try {
    const comma = dataURL.indexOf(',')
    const b64 = comma >= 0 ? dataURL.slice(comma + 1) : ''
    // base64 -> bytes count
    const padding = (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0)
    return Math.floor(b64.length * 3 / 4) - padding
  } catch {
    return 0
  }
}

export async function resizeImageFile(file, maxW = 900, maxH = 900, quality = 0.85) {
  const original = await readFileAsDataURL(file)
  // Try to decode; if the browser can't decode (e.g., HEIC), fall back to original data URL
  const img = document.createElement('img')
  img.src = original
  const loaded = await new Promise((res) => {
    img.onload = () => res(true)
    img.onerror = () => res(false)
  })
  if (!loaded) {
    return original
  }

  let { width, height } = img
  const ratio = Math.min(1, maxW / width, maxH / height)
  const targetW = Math.max(1, Math.round(width * ratio))
  const targetH = Math.max(1, Math.round(height * ratio))
  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')
  // fill white background to avoid black for transparent sources when exporting JPEG
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, targetW, targetH)
  ctx.drawImage(img, 0, 0, targetW, targetH)

  // Always output JPEG to ensure broad compatibility and smaller size
  let q = quality
  let out = canvas.toDataURL('image/jpeg', q)
  // Ensure <= 10MB by reducing quality if needed
  const MAX = 10 * 1024 * 1024
  let tries = 0
  while (dataURLByteLength(out) > MAX && q > 0.5 && tries < 5) {
    q -= 0.1
    out = canvas.toDataURL('image/jpeg', q)
    tries += 1
  }
  return out
}
