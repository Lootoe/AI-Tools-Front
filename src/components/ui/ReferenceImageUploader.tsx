import React, { useState, useRef } from 'react';
import { Plus, Loader2, Upload } from 'lucide-react';
import { uploadImage } from '@/services/api';
import { ReferenceImageGrid } from './ReferenceImageGrid';

interface ReferenceImageUploaderProps {
    images: string[];
    onChange: (urls: string[]) => void;
    maxCount?: number;
    maxSizeMB?: number;
    multiple?: boolean;
    disabled?: boolean;
    emptyText?: string;
    uploadText?: string;
    hint?: string;
    imageSize?: 'sm' | 'md' | 'lg';
    gridClassName?: string;
    onError?: (message: string) => void;
}

export const ReferenceImageUploader: React.FC<ReferenceImageUploaderProps> = ({
    images,
    onChange,
    maxCount = 5,
    maxSizeMB = 2,
    multiple = true,
    disabled = false,
    emptyText,
    uploadText = '点击添加参考图',
    hint = '支持 JPG、PNG 格式',
    imageSize = 'sm',
    gridClassName = 'flex flex-wrap gap-1.5',
    onError,
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const canUpload = images.length < maxCount && !disabled && !isUploading;
    const remainingCount = maxCount - images.length;

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || isUploading) return;

        // 检查数量限制
        const allowedCount = Math.min(files.length, remainingCount);
        if (allowedCount <= 0) {
            onError?.(`最多只能上传 ${maxCount} 张图片`);
            return;
        }

        const filesToUpload: File[] = [];
        for (let i = 0; i < allowedCount; i++) {
            const file = files[i];
            // 检查文件大小
            if (file.size > maxSizeMB * 1024 * 1024) {
                onError?.(`图片 ${file.name} 超过 ${maxSizeMB}MB 限制`);
                continue;
            }
            filesToUpload.push(file);
        }

        if (filesToUpload.length === 0) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsUploading(true);
        try {
            const uploadPromises = filesToUpload.map(file => uploadImage(file));
            const responses = await Promise.all(uploadPromises);
            const newUrls = responses.filter(r => r.success && r.url).map(r => r.url as string);
            if (newUrls.length > 0) {
                onChange([...images, ...newUrls]);
            }
        } catch (error) {
            console.error('参考图上传失败:', error);
            onError?.('上传失败，请重试');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = (index: number) => {
        onChange(images.filter((_, i) => i !== index));
    };

    return (
        <div className="flex flex-col gap-3">
            {images.length > 0 && (
                <ReferenceImageGrid
                    images={images}
                    onDelete={handleDelete}
                    imageSize={imageSize}
                    className={gridClassName}
                    emptyText={emptyText}
                />
            )}

            {canUpload && (
                <label
                    className={`flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all ${isUploading ? 'pointer-events-none' : 'hover:border-opacity-60'}`}
                    style={{ backgroundColor: '#0a0a0f', border: '2px dashed rgba(0,245,255,0.3)', minHeight: '80px' }}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple={multiple && remainingCount > 1}
                        onChange={handleUpload}
                        className="hidden"
                        disabled={!canUpload}
                    />
                    {isUploading ? (
                        <>
                            <Loader2 size={20} className="animate-spin mb-1" style={{ color: '#00f5ff' }} />
                            <span className="text-[10px]" style={{ color: '#6b7280' }}>上传中...</span>
                        </>
                    ) : (
                        <>
                            <Plus size={20} className="mb-1" style={{ color: 'rgba(0,245,255,0.5)' }} />
                            <span className="text-[10px]" style={{ color: '#6b7280' }}>{uploadText}</span>
                            <span className="text-[10px] mt-0.5" style={{ color: '#4b5563' }}>
                                {hint}（{remainingCount}/{maxCount}）
                            </span>
                        </>
                    )}
                </label>
            )}

            {images.length >= maxCount && (
                <p className="text-[10px] text-center" style={{ color: '#6b7280' }}>
                    已达到最大数量 {maxCount} 张
                </p>
            )}
        </div>
    );
};
