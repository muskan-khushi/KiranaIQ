import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Camera, UploadCloud, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  onImagesChange: (files: File[]) => void;
}

const REQUIRED_TYPES = ['Interior', 'Counter', 'Exterior'];

export default function ImageUploadZone({ onImagesChange }: Props) {
  const [files, setFiles] = useState<(File & { preview: string })[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const mapped = acceptedFiles.map(f =>
      Object.assign(f, { preview: URL.createObjectURL(f) })
    );
    const next = [...files, ...mapped].slice(0, 5);
    setFiles(next);
    onImagesChange(next);
  }, [files, onImagesChange]);

  const remove = (name: string) => {
    const next = files.filter(f => f.name !== name);
    setFiles(next);
    onImagesChange(next);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 5,
  });

  const count = files.length;
  const isValid = count >= 3;
  const isMax = count >= 5;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 cursor-pointer
          flex flex-col items-center justify-center gap-3 text-center
          transition-all duration-200
          ${isMax ? 'opacity-50 cursor-not-allowed' : ''}
          ${isDragActive
            ? 'border-accent bg-accent/5 scale-[1.01]'
            : isValid
              ? 'border-success/50 bg-success-light/30 hover:border-success hover:bg-success-light/50'
              : 'border-border bg-surface-2/50 hover:border-accent/50 hover:bg-accent/5'
          }
        `}
      >
        <input {...getInputProps()} capture="environment" disabled={isMax} />

        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-card transition-colors ${isDragActive ? 'bg-accent text-white' : 'bg-surface text-accent'}`}>
          {isDragActive ? <UploadCloud size={28} /> : <Camera size={28} />}
        </div>

        <div>
          <p className="font-semibold text-primary mb-1">
            {isMax ? 'Maximum images reached' : isDragActive ? 'Release to upload' : 'Tap to capture store images'}
          </p>
          <p className="text-sm text-muted">
            Upload 3–5 photos: Interior shelves, Counter, Store exterior
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mt-1">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i <= count
                  ? i <= 2 ? 'w-8 bg-warning' : 'w-8 bg-success'
                  : 'w-8 bg-border'
              }`}
            />
          ))}
          <span className={`text-xs font-medium ml-1 ${isValid ? 'text-success' : 'text-warning'}`}>
            {count}/5
          </span>
        </div>

        {/* Required types hint */}
        <div className="flex flex-wrap gap-2 mt-1">
          {REQUIRED_TYPES.map((type, i) => (
            <span
              key={type}
              className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-all ${
                count > i
                  ? 'bg-success-light text-success border-success/20'
                  : 'bg-surface text-muted border-border'
              }`}
            >
              {count > i ? '✓' : `${i + 1}.`} {type}
            </span>
          ))}
        </div>
      </div>

      {/* Validation message */}
      {count > 0 && count < 3 && (
        <div className="flex items-center gap-2 text-sm text-warning bg-warning-light border border-warning/20 rounded-xl px-4 py-2.5">
          <AlertCircle size={16} />
          <span>Upload at least {3 - count} more image{3 - count > 1 ? 's' : ''} to proceed</span>
        </div>
      )}
      {isValid && (
        <div className="flex items-center gap-2 text-sm text-success bg-success-light border border-success/20 rounded-xl px-4 py-2.5">
          <CheckCircle2 size={16} />
          <span>Ready — {count} image{count > 1 ? 's' : ''} selected</span>
        </div>
      )}

      {/* Image grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {files.map((file, i) => (
            <div key={file.name} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-border shadow-card">
              <img
                src={file.preview}
                alt={`Store image ${i + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Label */}
              {i < 3 && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1">
                  <span className="text-white text-[10px] font-medium">{REQUIRED_TYPES[i]}</span>
                </div>
              )}
              {/* Remove */}
              <button
                onClick={(e) => { e.stopPropagation(); remove(file.name); }}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-danger text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 3 - files.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square rounded-xl border-2 border-dashed border-border bg-surface-2 flex items-center justify-center">
              <span className="text-xs text-muted">{REQUIRED_TYPES[files.length + i]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}