export const uploadImage = async (file) => {
  if (!file) return null;

  const isVideo = file.type.startsWith('video/');

  // Validate file type
  const validTypes = [
    'image/jpeg','image/jpg','image/png','image/webp',
    'video/mp4', 'video/quicktime', 'video/webm'
  ];
  if (!validTypes.includes(file.type)) {
    throw new Error('Only JPG, PNG, WEBP images and MP4, WEBM, MOV videos are allowed.');
  }

  // Validate file size (max 5MB for images, 25MB for videos)
  const maxSize = isVideo ? 25 * 1024 * 1024 : 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error(isVideo ? 'Video must be under 25MB.' : 'Image must be under 5MB.');
  }

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dryam9zw8";
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "CIVIC PULSE";

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'civicpulse/issues');

  const resourceType = isVideo ? 'video' : 'image';
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Upload failed.');
  }

  const data = await response.json();
  
  if (isVideo) {
    return data.secure_url;
  }

  // Return optimized URL with auto quality + format for images
  const optimizedUrl = data.secure_url.replace(
    '/upload/',
    '/upload/q_auto,f_auto,w_1200/'
  );
  
  return optimizedUrl;
};
