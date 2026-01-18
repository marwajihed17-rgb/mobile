import { getSupabaseClient } from './supabase/client';

export interface UploadedFile {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  url: string;
}

// Upload a file to Supabase Storage
export async function uploadFile(
  file: File,
  bucket: 'uploads' | 'avatars',
  userId: string,
  folder?: string
): Promise<UploadedFile> {
  const supabase = getSupabaseClient();

  // Create unique file name
  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop();
  const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  // Build path: userId/folder/filename or userId/filename
  const filePath = folder
    ? `${userId}/${folder}/${fileName}`
    : `${userId}/${fileName}`;

  // Upload file
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    id: data.id || fileName,
    name: file.name,
    path: data.path,
    size: file.size,
    type: file.type,
    url: urlData.publicUrl,
  };
}

// Delete a file from Supabase Storage
export async function deleteFile(
  bucket: 'uploads' | 'avatars',
  path: string
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

// Get signed URL for private files
export async function getSignedUrl(
  bucket: 'uploads' | 'avatars',
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Failed to get signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

// List files in a directory
export async function listFiles(
  bucket: 'uploads' | 'avatars',
  path: string
): Promise<{ name: string; id: string; metadata: Record<string, unknown> }[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .list(path, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    throw new Error(`Failed to list files: ${error.message}`);
  }

  return data || [];
}

// Upload avatar specifically
export async function uploadAvatar(
  file: File,
  userId: string
): Promise<string> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Avatar must be an image file');
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Avatar must be less than 2MB');
  }

  const uploaded = await uploadFile(file, 'avatars', userId);
  return uploaded.url;
}
