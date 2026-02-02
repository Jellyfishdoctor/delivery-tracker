"use client";

import { useCallback, useState } from "react";
import { Upload, File, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CSVUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export function CSVUploader({ onFileSelect, isLoading }: CSVUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.name.endsWith(".csv")) {
          setSelectedFile(file);
          onFileSelect(file);
        }
      }
    },
    [onFileSelect]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const clearFile = () => {
    setSelectedFile(null);
  };

  if (selectedFile) {
    return (
      <div className="border border-slate-700 rounded-lg p-6 bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-slate-800">
              <File className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-slate-200">{selectedFile.name}</p>
              <p className="text-sm text-slate-500">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearFile}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
        "bg-slate-900/50 border-slate-700",
        dragActive && "border-primary bg-slate-800/50"
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="p-3 rounded-full bg-slate-800">
          <Upload className="h-8 w-8 text-slate-400" />
        </div>
        <div>
          <p className="text-lg font-medium text-slate-200">
            Drop your CSV file here
          </p>
          <p className="text-sm text-slate-500 mt-1">or click to browse</p>
        </div>
        <input
          type="file"
          accept=".csv"
          onChange={handleChange}
          className="hidden"
          id="csv-upload"
          disabled={isLoading}
        />
        <label htmlFor="csv-upload">
          <Button variant="outline" asChild disabled={isLoading}>
            <span>Select File</span>
          </Button>
        </label>
      </div>
    </div>
  );
}
