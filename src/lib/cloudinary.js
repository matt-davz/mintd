const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

/**
 * Build a Cloudinary URL with optional transformations.
 * @param {string} publicId
 * @param {string} [transforms] - e.g. 'w_800,f_auto,q_auto'
 */
export function cloudinaryUrl(publicId, transforms = 'f_auto,q_auto') {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms}/${publicId}`
}

export function withAutoOrient(url) {
  if (!url || url.includes('a_exif')) return url
  return url.replace('/image/upload/', '/image/upload/a_exif/')
}

export const uploadConfig = {
  cloudName: CLOUD_NAME,
  uploadPreset: UPLOAD_PRESET,
  folder: 'mintd',
}

/**
 * Upload a File to Cloudinary with an explicit public_id.
 * Uses unsigned upload via the Upload API.
 * @param {File} file
 * @param {string} publicId - e.g. "import/ab12cd34/image_0"
 * @returns {Promise<{ public_id: string, secure_url: string }>}
 */
export async function uploadToCloudinary(file, publicId, resourceType = 'image') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('public_id', publicId)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    { method: 'POST', body: formData }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message ?? `Cloudinary upload failed (HTTP ${res.status})`)
  }

  return res.json()
}

// Insert a Cloudinary delivery flag into any URL (image or raw).
// e.g. withCloudinaryFlag(url, 'fl_inline') for inline PDF display,
//      withCloudinaryFlag(url, 'fl_attachment') for forced download.
export function withCloudinaryFlag(url, flag) {
  if (!url || url.includes(flag)) return url
  return url.replace('/upload/', `/upload/${flag}/`)
}
