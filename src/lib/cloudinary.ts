export async function uploadFile(file: File, setProgress?: (progress: number) => void) {
  return new Promise((resolve, reject) => {
    try {
      const preset = process.env.NEXT_PUBLIC_UNSIGNED_PRESET_NAME;
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!preset || !cloudName) {
        reject(
          new Error(
            'Cloudinary config missing: Check NEXT_PUBLIC_UNSIGNED_PRESET_NAME and NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME env variables.',
          ),
        );
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', preset);
      const xhr = new XMLHttpRequest();
      const cloudinaryURL = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

      xhr.open('POST', cloudinaryURL, true);

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && setProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setProgress(progress);
        }
      });

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url as string);
        } else {
          let errorMsg = `Upload failed: ${xhr.statusText} (status ${xhr.status})`;
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            if (errorResponse && errorResponse.error && errorResponse.error.message) {
              errorMsg += ` - ${errorResponse.error.message}`;
            }
          } catch {}
          reject(new Error(errorMsg));
        }
      };

      xhr.onerror = () => {
        reject(new Error('An error occurred during the upload.'));
      };

      xhr.send(formData);
    } catch (error) {
      reject(error);
    }
  });
}
