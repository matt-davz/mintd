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

export const uploadConfig = {
  cloudName: CLOUD_NAME,
  uploadPreset: UPLOAD_PRESET,
  folder: 'mintd',
}
