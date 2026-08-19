/**
 * Client-Side Image Compression Utility
 * Resizes and compresses photo/receipt files to lightweight JPEG Base64.
 * Reduces 4-8 MB smartphone photos to ~60-120 KB while preserving crisp receipt text.
 */
export async function compressImage(
  file: File,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
      return
    }

    const reader = new FileReader()
    reader.onload = (readerEvent) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(readerEvent.target?.result as string)
          return
        }

        // Use high-quality smoothing for sharp text
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        const compressed = canvas.toDataURL('image/jpeg', quality)
        resolve(compressed)
      }
      img.onerror = () => resolve(readerEvent.target?.result as string)
      img.src = readerEvent.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
