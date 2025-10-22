'use client';

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { documentAPI } from "@/lib/document-api";

interface FileUploadProps {
  contextId: string;
  onUploadComplete: (contextId: string, documentIds: string[]) => void;
  onError: (error: string) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
}

enum UploadStatus {
  Pending,
  Uploading,
  Success,
  Error,
}

interface UploadableFile {
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
  id?: string;
}

export function FileUpload({
  contextId,
  onUploadComplete,
  onError,
  maxFiles = 15,
  maxFileSize = 10 * 1024 * 1024, // 10MB
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadableFile[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      const newFiles: UploadableFile[] = acceptedFiles.map((file) => ({
        file,
        status: UploadStatus.Pending,
        progress: 0,
      }));

      // Handle rejections
      fileRejections.forEach(({ file, errors }) => {
        const message = errors.map((e: any) => e.message).join(", ");
        onError(`Failed to add ${file.name}: ${message}`);
      });

      setFiles((prevFiles) => [...prevFiles, ...newFiles].slice(0, maxFiles));
    },
    [maxFiles, onError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: maxFileSize,
    maxFiles,
  });

  const removeFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const retryUpload = (index: number) => {
    setFiles((prevFiles) =>
      prevFiles.map((f, i) =>
        i === index ? { ...f, status: UploadStatus.Pending, progress: 0, error: undefined } : f
      )
    );
  };

  const handleUpload = async () => {
    if (!contextId) {
      onError("A context ID is required to upload files.");
      return;
    }

    const pendingFiles = files.filter((f) => f.status === UploadStatus.Pending);
    if (pendingFiles.length === 0) return;

    setFiles((prevFiles) =>
      prevFiles.map((f) =>
        f.status === UploadStatus.Pending ? { ...f, status: UploadStatus.Uploading } : f
      )
    );

    const uploadPromises = pendingFiles.map(async (uploadableFile) => {
      try {
        const response = await documentAPI.uploadDocument(
          contextId,
          uploadableFile.file,
          (progress) => {
            setFiles((prevFiles) =>
              prevFiles.map((f) =>
                f.file === uploadableFile.file ? { ...f, progress } : f
              )
            );
          }
        );
        return { ...uploadableFile, status: UploadStatus.Success, id: response.document_id };
      } catch (error: any) {
        const errorMessage = error.response?.data?.detail || "Upload failed";
        onError(errorMessage);
        return { ...uploadableFile, status: UploadStatus.Error, error: errorMessage };
      }
    });

    const settledUploads = await Promise.all(uploadPromises);

    setFiles((prevFiles) =>
      prevFiles.map((f) => {
        const settled = settledUploads.find((s) => s.file === f.file);
        return settled || f;
      })
    );

    const successfulUploads = settledUploads.filter(f => f.status === UploadStatus.Success && f.id);
    if (successfulUploads.length > 0) {
        onUploadComplete(contextId, successfulUploads.map(f => f.id!));
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">
          {isDragActive
            ? "Drop your PDFs here!"
            : "Drag & drop PDF files here, or click to select"}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Max {maxFiles} files, up to {maxFileSize / 1024 / 1024}MB each.
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((uploadableFile, index) => (
            <FilePreview
              key={index}
              file={uploadableFile}
              onRemove={() => removeFile(index)}
              onRetry={() => retryUpload(index)}
            />
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || files.every(f => f.status !== UploadStatus.Pending)}
        >
          Upload Files
        </Button>
      </div>
    </div>
  );
}

interface FilePreviewProps {
  file: UploadableFile;
  onRemove: () => void;
  onRetry: () => void;
}

function FilePreview({ file, onRemove, onRetry }: FilePreviewProps) {
  const { file: f, status, progress, error } = file;

  return (
    <div className="border rounded-lg p-3 flex items-center justify-between space-x-3">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <FileText className="h-8 w-8 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{f.name}</p>
          <p className="text-xs text-muted-foreground">
            {(f.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 w-48">
        {status === UploadStatus.Pending && (
          <p className="text-sm text-muted-foreground">Pending</p>
        )}
        {status === UploadStatus.Uploading && (
          <Progress value={progress} className="w-full" />
        )}
        {status === UploadStatus.Success && (
          <CheckCircle className="h-6 w-6 text-green-500" />
        )}
        {status === UploadStatus.Error && (
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <p className="text-sm text-red-500 truncate" title={error}>{error}</p>
          </div>
        )}
      </div>

      <div className="flex items-center">
        {status === UploadStatus.Error && (
          <Button variant="outline" size="sm" onClick={onRetry} className="mr-2">
            Retry
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={status === UploadStatus.Uploading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
