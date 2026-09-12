import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadApi } from '@services/api';

export interface UploadedImage {
  uri:      string;  // local URI shown in UI
  url?:     string;  // remote Cloudinary URL (set after upload)
  uploaded: boolean;
}

interface UseImageUploadOptions {
  /** 'single' picks one image; 'multiple' picks up to maxCount. Default: 'single' */
  mode?:     'single' | 'multiple';
  maxCount?: number;
  /** Cloudinary folder suffix. Default: 'products' */
  folder?:   'profile' | 'products';
}

interface UseImageUploadReturn {
  images:       UploadedImage[];
  uploading:    boolean;
  pickImages:   () => Promise<void>;
  removeImage:  (index: number) => void;
  uploadAll:    () => Promise<string[]>;  // returns uploaded URLs
  reset:        () => void;
}

export function useImageUpload({
  mode     = 'single',
  maxCount = 5,
  folder   = 'products',
}: UseImageUploadOptions = {}): UseImageUploadReturn {
  const [images,    setImages]    = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);

  /* ── Pick from library or camera ── */
  const pickImages = async () => {
    /* Request permission */
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library in Settings to upload images.',
        );
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:        ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: mode === 'multiple',
      quality:           0.8,
      allowsEditing:     mode === 'single',
      aspect:            mode === 'single' ? [1, 1] : undefined,
    });

    if (result.canceled) return;

    const picked: UploadedImage[] = result.assets
      .slice(0, maxCount - images.length)
      .map(a => ({ uri: a.uri, uploaded: false }));

    setImages(prev =>
      mode === 'single' ? picked : [...prev, ...picked].slice(0, maxCount),
    );
  };

  /* ── Remove an image by index ── */
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  /* ── Upload all pending images to backend → Cloudinary ── */
  const uploadAll = async (): Promise<string[]> => {
    const pending = images.filter(img => !img.uploaded);
    if (pending.length === 0) {
      /* Return already-uploaded URLs */
      return images.map(img => img.url ?? img.uri);
    }

    setUploading(true);
    try {
      if (mode === 'single' && pending.length === 1) {
        /* Single upload */
        const form = new FormData();
        const img  = pending[0];
        const ext  = img.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
        const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

        form.append('file', {
          uri:  img.uri,
          name: `upload.${ext}`,
          type: mime,
        } as any);

        const { data } = await uploadApi.image(form);
        const url = data.url as string;

        setImages(prev =>
          prev.map(i => i.uri === img.uri ? { ...i, url, uploaded: true } : i),
        );
        return images.map(i => (i.uri === img.uri ? url : i.url ?? i.uri));
      } else {
        /* Multi upload */
        const form = new FormData();
        for (const img of pending) {
          const ext  = img.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
          const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
          form.append('files', {
            uri:  img.uri,
            name: `upload.${ext}`,
            type: mime,
          } as any);
        }

        const { data } = await uploadApi.images(form);
        const urls: string[] = data.urls;

        /* Map returned URLs back to the pending images in order */
        let urlIdx = 0;
        const updatedMap: Record<string, string> = {};
        for (const img of pending) {
          updatedMap[img.uri] = urls[urlIdx++] ?? img.uri;
        }

        setImages(prev =>
          prev.map(i =>
            updatedMap[i.uri]
              ? { ...i, url: updatedMap[i.uri], uploaded: true }
              : i,
          ),
        );

        return images.map(i => updatedMap[i.uri] ?? i.url ?? i.uri);
      }
    } catch (err: any) {
      Alert.alert(
        'Upload Failed',
        err?.response?.data?.message ?? 'Could not upload image. Check your connection.',
      );
      return images.map(i => i.url ?? i.uri);
    } finally {
      setUploading(false);
    }
  };

  const reset = () => setImages([]);

  return { images, uploading, pickImages, removeImage, uploadAll, reset };
}
