import { GalleryManager } from '@/features/admin/components/GalleryManager';
import { listMedia } from '@/server/services/media';
import { isCloudinaryConfigured } from '@/server/services/cloudinary';

export const metadata = { title: 'Galeria' };

export default async function AdminGalleryPage() {
  const items = await listMedia();
  return (
    <GalleryManager items={items} cloudinaryReady={isCloudinaryConfigured()} />
  );
}
