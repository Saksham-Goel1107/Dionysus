export async function uploadFile(
  file: File,
  setProgress?: (progress: number) => void,
) {
  return new Promise((resolve, reject) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        `${process.env.NEXT_PUBLIC_UNSIGNED_PRESET_NAME}`,
      );
      const xhr = new XMLHttpRequest();
      const cloudinaryURL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!}/auto/upload`;

      xhr.open("POST", cloudinaryURL, true);

      xhr.upload.addEventListener("progress", (event) => {
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
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error("An error occurred during the upload."));
      };

      xhr.send(formData);
    } catch (error) {
      reject(error);
    }
  });
}
