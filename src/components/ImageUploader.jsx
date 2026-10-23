import { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Loader2, UploadCloud, X } from 'lucide-react';
import { Reorder } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import propertyService from '../services/propertyService';
import uploadService from '../services/uploadService';

const extractPublicIdFromUrl = (value) => {
  const url = typeof value === 'string' ? value : value?.url || value?.secure_url || value?.path || '';
  if (!url) return null;

  if (url.includes('cloudinary.com')) {
    try {
      const parsed = new URL(url);
      const uploadIndex = parsed.pathname.indexOf('/upload/');
      if (uploadIndex !== -1) {
        return parsed.pathname
          .slice(uploadIndex + '/upload/'.length)
          .replace(/^v\d+\//, '')
          .replace(/\.[^.]+$/, '');
      }
    } catch {
      // Fallback
    }
  }

  const localMarker = '/uploads/';
  const localIndex = url.indexOf(localMarker);
  if (localIndex === -1) return null;
  return url.slice(localIndex + localMarker.length).split('?')[0];
};

const ImageUploader = ({ onImagesChange, initialImages = [] }) => {
  const { t } = useTranslation();
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const lastSyncedUrlsRef = useRef('');

  // Sync initialImages dynamically
  useEffect(() => {
    if (Array.isArray(initialImages) && initialImages.length > 0) {
      const serializedIncoming = JSON.stringify(initialImages);
      if (serializedIncoming !== lastSyncedUrlsRef.current) {
        const uploadedImages = initialImages.map((url, idx) => ({
          id: `${url}-${idx}-${Date.now()}`,
          url,
          public_id: extractPublicIdFromUrl(url),
          previewUrl: url,
        }));

        setImages(uploadedImages);
        lastSyncedUrlsRef.current = serializedIncoming;
      }
    }
  }, [initialImages]);

  // Notify parent component on change
  useEffect(() => {
    const nextUrls = images.map((img) => img.url);
    const serialized = JSON.stringify(nextUrls);
    if (serialized === lastSyncedUrlsRef.current) return;
    lastSyncedUrlsRef.current = serialized;
    if (typeof onImagesChange === 'function') {
      onImagesChange(nextUrls);
    }
  }, [images, onImagesChange]);

  const handleFileSelect = async (selectedFiles) => {
    setError('');
    if (!selectedFiles || selectedFiles.length === 0) return;

    const filesToUpload = Array.from(selectedFiles);
    const newFiles = [];

    for (const file of filesToUpload) {
      if (!file.type.startsWith('image/')) {
        setError(t('uploader.imagesOnly') || 'يجب اختيار صور فقط.');
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError(t('uploader.imageTooLarge') || 'حجم الصورة يجب أن يكون أقل من 5 ميغابايت.');
        continue;
      }

      newFiles.push(file);
    }

    if (newFiles.length === 0) return;

    setUploading(true);
    try {
      const uploaded = await propertyService.uploadPropertyImages(newFiles);
      
      const newUploadedItems = uploaded.map((item, idx) => ({
        id: `${item.url}-${idx}-${Date.now()}`,
        url: item.url,
        public_id: item.public_id || extractPublicIdFromUrl(item.url),
        previewUrl: item.url,
      }));

      setImages((prev) => [...prev, ...newUploadedItems]);
    } catch (err) {
      setError(err.response?.data?.message || t('uploader.uploadFailed') || 'فشل رفع الصور.');
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeImage = async (indexToRemove) => {
    const confirmMessage = t('uploader.confirmDelete') || 'هل أنت تأكد من إزالة هذه الصورة؟';
    if (!window.confirm(confirmMessage)) return;

    const imageToRemove = images[indexToRemove];

    if (imageToRemove?.public_id) {
      try {
        await uploadService.deleteImage(imageToRemove.public_id);
      } catch (err) {
        console.error(t('uploader.deleteFailed') || 'فشل حذف الصورة', err);
        setError(t('uploader.deleteFailed') || 'فشل حذف الصورة');
        return;
      }
    }

    setImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleReorder = (newOrder) => {
    if (!Array.isArray(newOrder)) return;
    setImages((prev) => {
      const map = new Map(prev.map((img) => [img.id, img]));
      return newOrder.map((id) => map.get(id)).filter(Boolean);
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      <Reorder.Group
        axis="x"
        values={images.map((img) => img.id)}
        onReorder={handleReorder}
        className="flex flex-wrap gap-3"
      >
        {images.map((image, index) => (
          <Reorder.Item
            key={image.id}
            value={image.id}
            className="group relative h-28 w-28 sm:h-32 sm:w-32 cursor-grab overflow-hidden rounded-xl border border-gray-200 active:cursor-grabbing"
          >
            <img
              loading="lazy"
              decoding="async"
              src={image.previewUrl || image.url}
              alt={`${t('uploader.preview') || 'معاينة'} ${index + 1}`}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white transition hover:bg-black"
            >
              <X size={16} />
            </button>
            {index === 0 && (
              <div className="absolute bottom-1 left-1 rounded-md bg-[#2DB4A0] px-2 py-0.5 text-[10px] font-bold text-white shadow">
                {t('uploader.mainImage') || 'الصورة الرئيسية'}
              </div>
            )}
          </Reorder.Item>
        ))}

        <button
          type="button"
          aria-label={t('uploader.addPhoto') || 'إضافة صورة'}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          disabled={uploading}
          className={`flex h-28 w-28 sm:h-32 sm:w-32 flex-col items-center justify-center rounded-xl border-2 border-dashed text-gray-400 transition-all ${
            isDragging
              ? 'border-[#2DB4A0] bg-[#2DB4A0]/10'
              : 'border-gray-300 hover:border-[#2DB4A0]'
          }`}
        >
          {uploading ? (
            <Loader2 className="animate-spin text-[#2DB4A0]" size={24} />
          ) : (
            <>
              <UploadCloud size={24} />
              <span className="mt-1 text-xs text-center px-1">
                {t('uploader.dragDrop') || 'اسحب الصور هنا'}
              </span>
            </>
          )}
        </button>
      </Reorder.Group>

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileSelect(e.target.files)}
        multiple
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
      />

      {images.length === 0 && !uploading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <ImageIcon size={16} />
          {t('uploader.addPhoto') || 'قم بإضافة صور للعقار'}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;