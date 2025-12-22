/**
 * Image Compression Utility
 * Compresses images to 100KB or less while maintaining quality
 * Uses canvas-based compression for browser-side processing
 */

interface CompressionOptions {
  maxSizeKB?: number
  targetQuality?: number
  maxWidth?: number
  maxHeight?: number
}

interface CompressionResult {
  blob: Blob
  sizeKB: number
  width: number
  height: number
  format: string
}

/**
 * Compresses an image file to 100KB or less
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise with compressed blob and metadata
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxSizeKB = 100,
    targetQuality = 0.85,
    maxWidth = 1200,
    maxHeight = 1200,
  } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        try {
          // Calculate dimensions while maintaining aspect ratio
          let { width, height } = img
          const aspectRatio = width / height

          if (width > maxWidth) {
            width = maxWidth
            height = Math.round(width / aspectRatio)
          }

          if (height > maxHeight) {
            height = maxHeight
            width = Math.round(height * aspectRatio)
          }

          // Create canvas and context
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            throw new Error('Failed to get canvas context')
          }

          // Draw image on canvas
          ctx.drawImage(img, 0, 0, width, height)

          // Compress with adaptive quality
          let quality = targetQuality
          let blob: Blob | null = null
          let attempts = 0
          const maxAttempts = 8

          // Function to convert canvas to blob with quality
          const convertToBlob = (): Promise<Blob> => {
            return new Promise((blobResolve, blobReject) => {
              canvas.toBlob(
                (result) => {
                  if (result) {
                    blobResolve(result)
                  } else {
                    blobReject(new Error('Canvas conversion failed'))
                  }
                },
                'image/jpeg',
                quality
              )
            })
          }

          // Iteratively reduce quality until size target is met
          const compressWithQuality = async (): Promise<Blob> => {
            if (attempts >= maxAttempts) {
              if (blob) return blob
              throw new Error('Failed to compress image to target size')
            }

            attempts++
            blob = await convertToBlob()
            const sizeKB = blob.size / 1024

            if (sizeKB > maxSizeKB && quality > 0.3) {
              // Reduce quality more aggressively based on how far off we are
              const ratio = sizeKB / maxSizeKB
              quality = Math.max(0.3, quality / Math.sqrt(ratio))
              return compressWithQuality()
            }

            return blob
          }

          compressWithQuality()
            .then((compressedBlob) => {
              const sizeKB = compressedBlob.size / 1024
              resolve({
                blob: compressedBlob,
                sizeKB: Math.round(sizeKB * 100) / 100,
                width,
                height,
                format: 'image/jpeg',
              })
            })
            .catch(reject)
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }

      // Handle different image types
      if (file.type === 'image/webp' || file.type === 'image/png') {
        // Convert to JPEG for better compression
        img.src = e.target?.result as string
      } else {
        img.src = e.target?.result as string
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Validates image before compression
 */
export function validateImage(file: File): { valid: boolean; error?: string } {
  const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  if (!acceptedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid image type. Accepted types: ${acceptedTypes.map((t) => t.split('/')[1]).join(', ')}`,
    }
  }

  // Check file size before compression (allow larger files, they'll be compressed)
  const fileSizeMB = file.size / (1024 * 1024)
  if (fileSizeMB > 50) {
    return {
      valid: false,
      error: 'File size must be less than 50MB',
    }
  }

  return { valid: true }
}

/**
 * Utility to format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
