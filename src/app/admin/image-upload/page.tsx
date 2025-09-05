import { ImageUrlGenerator } from '@/components/ui/image-url-generator';

export default function ImageUploadPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Image Upload Tool</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Upload images and get Cloudinary URLs for use in blog posts and content
        </p>
      </div>

      <ImageUrlGenerator />
    </div>
  );
}
