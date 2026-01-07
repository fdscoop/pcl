'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from './button'
import { createClient } from '@/lib/supabase/client'

interface FileUploadProps {
  accept?: string
  maxSize?: number // in MB
  maxFiles?: number
  bucket: string
  path?: string
  onUpload?: (urls: string[]) => void
  existingFiles?: string[]
  multiple?: boolean
  className?: string
  label?: string
  description?: string
}

interface UploadedFile {
  file: File
  preview?: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  url?: string
  error?: string
  progress?: number
}

export function FileUpload({
  accept = 'image/*',
  maxSize = 5,
  maxFiles = 10,
  bucket,
  path = '',
  onUpload,
  existingFiles = [],
  multiple = true,
  className = '',
  label = 'Upload Files',
  description = 'PNG, JPG or PDF (max. 5MB)'
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const selectedFiles = Array.from(e.target.files)
    const totalFiles = files.length + selectedFiles.length + existingFiles.length

    if (totalFiles > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`)
      return
    }

    const newFiles: UploadedFile[] = selectedFiles.map(file => {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        return {
          file,
          status: 'error' as const,
          error: `File size exceeds ${maxSize}MB`
        }
      }

      // Create preview for images
      let preview: string | undefined
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file)
      }

      return {
        file,
        preview,
        status: 'pending' as const
      }
    })

    setFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev]
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!)
      }
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setUploading(true)
    const uploadedUrls: string[] = []

    for (let i = 0; i < files.length; i++) {
      const fileData = files[i]
      if (fileData.status === 'success' || fileData.status === 'error') continue

      // Update status to uploading
      setFiles(prev => {
        const newFiles = [...prev]
        newFiles[i] = { ...newFiles[i], status: 'uploading', progress: 0 }
        return newFiles
      })

      try {
        const file = fileData.file
        const fileExt = file.name.split('.').pop()
        const fileName = `${path}${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName)

        uploadedUrls.push(publicUrl)

        // Update status to success
        setFiles(prev => {
          const newFiles = [...prev]
          newFiles[i] = {
            ...newFiles[i],
            status: 'success',
            url: publicUrl,
            progress: 100
          }
          return newFiles
        })
      } catch (error) {
        console.error('Upload error:', error)
        setFiles(prev => {
          const newFiles = [...prev]
          newFiles[i] = {
            ...newFiles[i],
            status: 'error',
            error: 'Upload failed'
          }
          return newFiles
        })
      }
    }

    setUploading(false)

    if (onUpload && uploadedUrls.length > 0) {
      onUpload([...existingFiles, ...uploadedUrls])
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8" />
    }
    return <FileText className="h-8 w-8" />
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Existing Files Display */}
      {existingFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {existingFiles.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Existing ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <span className="text-white text-xs">Existing</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Files Preview */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {files.map((fileData, index) => (
            <div key={index} className="relative group">
              <div className="w-full h-24 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                {fileData.preview ? (
                  <img
                    src={fileData.preview}
                    alt={fileData.file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800">
                    {getFileIcon(fileData.file)}
                  </div>
                )}

                {/* Status Overlay */}
                {fileData.status === 'uploading' && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}

                {fileData.status === 'success' && (
                  <div className="absolute top-1 right-1 p-1 bg-green-600 rounded-full">
                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                {fileData.status === 'error' && (
                  <div className="absolute inset-0 bg-red-500/90 flex items-center justify-center">
                    <span className="text-white text-xs px-2 text-center">
                      {fileData.error}
                    </span>
                  </div>
                )}
              </div>

              {/* Remove Button */}
              {(fileData.status === 'pending' || fileData.status === 'error') && (
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              )}

              {/* File Name */}
              <p className="text-xs text-gray-500 mt-1 truncate">
                {fileData.file.name}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full"
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {label}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {description}
          </p>
        </button>
      </div>

      {/* Upload Button */}
      {files.some(f => f.status === 'pending') && (
        <Button
          type="button"
          onClick={uploadFiles}
          disabled={uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            `Upload ${files.filter(f => f.status === 'pending').length} file(s)`
          )}
        </Button>
      )}
    </div>
  )
}
