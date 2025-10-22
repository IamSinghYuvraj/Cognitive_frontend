'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, Loader as Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { contextAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface CreateContextModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateContextModal({ open, onOpenChange, onSuccess }: CreateContextModalProps) {
  const [name, setName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>('');
  const { toast } = useToast();
  const router = useRouter();

  const onDrop = (acceptedFiles: File[]) => {
    // Validate total count (max 15 files)
    const totalFiles = files.length + acceptedFiles.length;
    if (totalFiles > 15) {
      setError(`Maximum 15 files allowed. You're trying to add ${totalFiles} files.`);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    for (const file of acceptedFiles) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        setError(`${file.name} is not a PDF file`);
        return;
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} exceeds 10MB limit`);
        return;
      }
      
      validFiles.push(file);
    }
    
    setFiles([...files, ...validFiles]);
    setError('');
    
    // Auto-generate name from first filename if not set
    if (!name && validFiles.length > 0) {
      const fileName = validFiles[0].name.replace('.pdf', '');
      setName(fileName);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 15,
    multiple: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter a context name');
      return;
    }
    
    if (files.length === 0) {
      setError('Please select at least one PDF file');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await contextAPI.createContext({ name: name.trim(), files });
      const { context_id, processed_files, document_ids } = response.data;
      
      toast({
        title: 'Success',
        description: `Context created! ${processed_files} file(s) uploaded successfully.`,
      });
      
      // Reset form
      setName('');
      setFiles([]);
      setError('');
      
      onSuccess();
      onOpenChange(false);
      
      // Navigate to chat with new context
      console.log('Context ID:', context_id);
      console.log('Document IDs:', document_ids);
      router.push(`/chat/${context_id}`);
      
    } catch (error: any) {
      // Handle backend error response
      const errorData = error.response?.data;
      let errorMessage = 'Failed to create context';
      
      if (errorData) {
        // Backend returns {success: false, error: string, error_code: string}
        errorMessage = errorData.error || errorData.detail || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Context</DialogTitle>
          <DialogDescription>
            Upload a PDF document to create a new chat context
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Context Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter context name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>PDF Documents ({files.length}/15)</Label>
            
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                {isDragActive
                  ? 'Drop your PDFs here!'
                  : 'Drag & drop PDF files here, or click to select'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Maximum 15 files, 10MB each
              </p>
            </div>
            
            {files.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {files.map((file, index) => (
                  <div key={index} className="border rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-6 w-6 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {typeof error === 'string' ? error : (error?.response?.data?.detail ?? error?.message ?? JSON.stringify(error))}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || files.length === 0 || !name.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Context'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}