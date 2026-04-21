import { useState, useCallback } from 'react';

interface UploadedFile extends File {
  preview: string;
}

interface UseImageUploadOptions {
  maxFiles?: number;
  minFiles?: number;
}

/**
 * Manages multi-image upload state with preview URLs.
 * Handles object URL lifecycle (create on add, revoke on remove).
 */
export function useImageUpload({ maxFiles = 5, minFiles = 3 }: UseImageUploadOptions = {}) {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const addFiles = useCallback((incoming: File[]) => {
    setFiles(prev => {
      const available = maxFiles - prev.length;
      if (available <= 0) return prev;

      const toAdd = incoming.slice(0, available).map(f =>
        Object.assign(f, { preview: URL.createObjectURL(f) })
      );
      return [...prev, ...toAdd];
    });
  }, [maxFiles]);

  const removeFile = useCallback((name: string) => {
    setFiles(prev => {
      const removed = prev.find(f => f.name === name);
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter(f => f.name !== name);
    });
  }, []);

  const clearAll = useCallback(() => {
    setFiles(prev => {
      prev.forEach(f => URL.revokeObjectURL(f.preview));
      return [];
    });
  }, []);

  return {
    files,
    addFiles,
    removeFile,
    clearAll,
    count: files.length,
    isValid: files.length >= minFiles,
    isFull: files.length >= maxFiles,
  };
}