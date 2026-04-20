import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, Camera } from 'lucide-react';

interface Props {
  onImagesChange: (files: File[]) => void;
}

export default function ImageUploadZone({ onImagesChange }: Props) {
  const [files, setFiles] = useState<(File & { preview: string })[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const mappedFiles = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }));
    
    // Enforce max 5 images
    const nextFiles = [...files, ...mappedFiles].slice(0, 5);
    setFiles(nextFiles);
    onImagesChange(nextFiles);
  }, [files, onImagesChange]);

  const removeFile = (name: string) => {
    const nextFiles = files.filter(file => file.name !== name);
    setFiles(nextFiles);
    onImagesChange(nextFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 5,
  });

  return (
    <div className="w-full">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 ease-in-out
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-muted/50 hover:bg-surface'}`}
      >
        <input {...getInputProps()} capture="environment" />
        <div className="p-4 bg-background rounded-full mb-4 shadow-aesthetic text-primary">
          {isDragActive ? <UploadCloud size={32} /> : <Camera size={32} />}
        </div>
        <p className="text-lg font-medium text-primary mb-1">
          {isDragActive ? "Drop it here!" : "Drag & drop store images"}
        </p>
        <p className="text-sm text-muted text-center max-w-xs">
          Upload 3 to 5 images (Interior, Counter, Exterior). Max 5MB per file.
        </p>
      </div>

      {/* Image Previews Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mt-6">
          {files.map((file) => (
            <div key={file.name} className="relative group aspect-square rounded-xl overflow-hidden border border-border shadow-sm">
              <img 
                src={file.preview} 
                alt="preview" 
                className="w-full h-full object-cover"
                onLoad={() => URL.revokeObjectURL(file.preview)} 
              />
              <button 
                onClick={(e) => { e.stopPropagation(); removeFile(file.name); }}
                className="absolute top-2 right-2 p-1 bg-surface/80 backdrop-blur-sm rounded-full text-danger opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}