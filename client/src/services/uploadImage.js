export const uploadImage = async (file) => {
  if (!file) return null;

  // Validate file type
  const validTypes = ['image/jpeg','image/jpg',
                      'image/png','image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Only JPG, PNG, WEBP allowed.');
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be under 5MB.');
  }

  const cloudName = import.meta.env
                    .VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env
                       .VITE_CLOUDINARY_UPLOAD_PRESET;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'civicpulse/issues');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 
                    'Upload failed.');
  }

  const data = await response.json();
  
  // Return optimized URL with auto quality + format
  const optimizedUrl = data.secure_url.replace(
    '/upload/',
    '/upload/q_auto,f_auto,w_1200/'
  );
  
  return optimizedUrl;
};
