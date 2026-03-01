"use client";

import { useState } from "react";

export interface UploadedFile {
  /** Unique identifier (Cloudinary publicId) */
  key: string;
  /** Public URL of the uploaded file */
  url: string;
  /** Original filename */
  name: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  type: string;
}

export interface UseUploadFileProps {
  onUploadComplete?: (file: UploadedFile) => void;
  onUploadError?: (error: unknown) => void;
  onUploadBegin?: (fileName: string) => void;
  onUploadProgress?: (progress: { progress: number }) => void;
}

/**
 * Upload hook compatible with Plate's PlaceholderElement interface.
 * Uses the app's existing /api/upload endpoint (Cloudinary).
 */
export function useUploadFile({
  onUploadComplete,
  onUploadError,
  onUploadBegin,
  onUploadProgress,
}: UseUploadFileProps = {}) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile>();
  const [uploadingFile, setUploadingFile] = useState<File>();
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  async function uploadFile(file: File): Promise<UploadedFile> {
    setIsUploading(true);
    setUploadingFile(file);
    setProgress(0);

    onUploadBegin?.(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "autograder/media");

      // Simulate progress start
      setProgress(10);
      onUploadProgress?.({ progress: 10 });

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      setProgress(90);
      onUploadProgress?.({ progress: 90 });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errorData.error ?? "Upload failed");
      }

      const data = (await res.json()) as {
        url: string;
        publicId: string;
      };

      const result: UploadedFile = {
        key: data.publicId,
        url: data.url,
        name: file.name,
        size: file.size,
        type: file.type,
      };

      setProgress(100);
      onUploadProgress?.({ progress: 100 });
      setUploadedFile(result);
      onUploadComplete?.(result);

      return result;
    } catch (error) {
      onUploadError?.(error);
      throw error;
    } finally {
      setProgress(0);
      setIsUploading(false);
      setUploadingFile(undefined);
    }
  }

  return {
    isUploading,
    progress,
    uploadFile,
    uploadedFile,
    uploadingFile,
  };
}
