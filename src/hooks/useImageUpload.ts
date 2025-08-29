import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAuditLog } from './useAuditLog';

export interface UploadedImage {
  id: string;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string | null;
  news_id: string | null;
  alt_text: string | null;
  caption: string | null;
  is_featured: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ImageUploadOptions {
  newsId?: string;
  altText?: string;
  caption?: string;
  isFeatured?: boolean;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
}

export interface ImageUploadResult {
  success: boolean;
  image?: UploadedImage;
  url?: string;
  error?: string;
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

export const useImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { logAction } = useAuditLog();

  const validateFile = useCallback((file: File, options: ImageUploadOptions = {}): string | null => {
    const maxSize = options.maxSize || DEFAULT_MAX_SIZE;
    const allowedTypes = options.allowedTypes || DEFAULT_ALLOWED_TYPES;

    if (!allowedTypes.includes(file.type)) {
      return `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`;
    }

    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`;
    }

    return null;
  }, []);

  const generateFileName = useCallback((originalName: string): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    return `${timestamp}-${random}.${extension}`;
  }, []);

  const getImageDimensions = useCallback((file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Não foi possível carregar a imagem'));
      };
      
      img.src = url;
    });
  }, []);

  const uploadToStorage = useCallback(async (file: File, fileName: string): Promise<string> => {
    const filePath = `news-images/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Erro no upload: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return publicUrl;
  }, []);

  const saveImageRecord = useCallback(async (
    file: File,
    fileName: string,
    filePath: string,
    publicUrl: string,
    options: ImageUploadOptions = {}
  ): Promise<UploadedImage> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    let dimensions = { width: 0, height: 0 };
    try {
      dimensions = await getImageDimensions(file);
    } catch (error) {
      console.warn('Não foi possível obter dimensões da imagem:', error);
    }

    const imageData = {
      filename: fileName,
      original_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: user?.id || null,
      news_id: options.newsId || null,
      alt_text: options.altText || null,
      caption: options.caption || null,
      is_featured: options.isFeatured || false,
      metadata: {
        dimensions,
        originalUrl: publicUrl,
        uploadedAt: new Date().toISOString(),
      },
    };

    const { data, error } = await supabase
      .from('uploaded_images')
      .insert(imageData)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao salvar registro da imagem: ${error.message}`);
    }

    return data;
  }, [getImageDimensions]);

  const uploadImage = useCallback(async (
    file: File,
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Validate file
      const validationError = validateFile(file, options);
      if (validationError) {
        throw new Error(validationError);
      }

      setUploadProgress(20);

      // Generate unique filename
      const fileName = generateFileName(file.name);
      const filePath = `news-images/${fileName}`;

      setUploadProgress(40);

      // Upload to storage
      const publicUrl = await uploadToStorage(file, fileName);

      setUploadProgress(70);

      // Save image record
      const imageRecord = await saveImageRecord(file, fileName, filePath, publicUrl, options);

      setUploadProgress(90);

      // Log the upload
      await logAction({
        action: 'image.upload',
        resource_type: 'image',
        resource_id: imageRecord.id,
        metadata: {
          filename: file.name,
          size: file.size,
          newsId: options.newsId,
          url: publicUrl,
        },
      });

      setUploadProgress(100);
      toast.success('Imagem enviada com sucesso!');

      return {
        success: true,
        image: imageRecord,
        url: publicUrl,
      };
    } catch (error) {
      console.error('Erro no upload da imagem:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast.error(`Erro ao enviar imagem: ${errorMessage}`);
      
      // Log the error
      await logAction({
        action: 'image.upload_failed',
        resource_type: 'image',
        metadata: {
          filename: file.name,
          error: errorMessage,
          newsId: options.newsId,
        },
        status: 'error',
        error_message: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [validateFile, generateFileName, uploadToStorage, saveImageRecord, logAction]);

  const deleteImage = useCallback(async (imageId: string): Promise<boolean> => {
    try {
      // Get image record
      const { data: image, error: fetchError } = await supabase
        .from('uploaded_images')
        .select('*')
        .eq('id', imageId)
        .single();

      if (fetchError || !image) {
        throw new Error('Imagem não encontrada');
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('images')
        .remove([image.file_path]);

      if (storageError) {
        console.warn('Erro ao deletar do storage:', storageError);
      }

      // Delete record
      const { error: deleteError } = await supabase
        .from('uploaded_images')
        .delete()
        .eq('id', imageId);

      if (deleteError) {
        throw new Error(`Erro ao deletar registro: ${deleteError.message}`);
      }

      // Log the deletion
      await logAction({
        action: 'image.delete',
        resource_type: 'image',
        resource_id: imageId,
        metadata: {
          filename: image.original_name,
          filePath: image.file_path,
        },
      });

      toast.success('Imagem deletada com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao deletar imagem: ${errorMessage}`);
      return false;
    }
  }, [logAction]);

  const getImages = useCallback(async (newsId?: string): Promise<UploadedImage[]> => {
    try {
      let query = supabase
        .from('uploaded_images')
        .select('*')
        .order('created_at', { ascending: false });

      if (newsId) {
        query = query.eq('news_id', newsId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Erro ao buscar imagens: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar imagens:', error);
      return [];
    }
  }, []);

  const updateImageMetadata = useCallback(async (
    imageId: string,
    updates: Partial<Pick<UploadedImage, 'alt_text' | 'caption' | 'is_featured' | 'news_id'>>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('uploaded_images')
        .update(updates)
        .eq('id', imageId);

      if (error) {
        throw new Error(`Erro ao atualizar imagem: ${error.message}`);
      }

      // Log the update
      await logAction({
        action: 'image.update',
        resource_type: 'image',
        resource_id: imageId,
        metadata: {
          updates,
        },
      });

      toast.success('Imagem atualizada com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar imagem:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao atualizar imagem: ${errorMessage}`);
      return false;
    }
  }, [logAction]);

  return {
    uploadImage,
    deleteImage,
    getImages,
    updateImageMetadata,
    isUploading,
    uploadProgress,
    validateFile,
  };
};