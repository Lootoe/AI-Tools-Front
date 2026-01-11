import React, { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';

interface ReferenceImageGridProps {
    images: string[];
    onDelete?: (index: number) => void;
    emptyText?: string;
    className?: string;
    imageSize?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-full h-32',
};

export const ReferenceImageGrid: React.FC<ReferenceImageGridProps> = ({
    images,
    onDelete,
    emptyText = '暂无参考图',
    className = '',
    imageSize = 'sm',
}) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    if (images.length === 0) {
        return (
            <div className={`w-full flex items-center justify-center text-xs ${className}`} style={{ color: '#4b5563' }}>
                {emptyText}
            </div>
        );
    }

    return (
        <>
            <div className={`flex flex-wrap gap-1.5 ${className}`}>
                {images.map((url, index) => (
                    <div
                        key={index}
                        className={`relative group ${sizeMap[imageSize]} rounded overflow-hidden cursor-pointer`}
                        style={{ border: '1px solid rgba(30,30,46,0.8)' }}
                        onClick={() => setPreviewUrl(url)}
                    >
                        <img src={url} alt={`参考图 ${index + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn size={14} style={{ color: '#fff' }} />
                        </div>
                        {onDelete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(index); }}
                                className="absolute top-0.5 right-0.5 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ backgroundColor: 'rgba(239,68,68,0.9)' }}
                            >
                                <X size={8} className="text-white" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {previewUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setPreviewUrl(null)}>
                    <div className="relative max-w-[90vw] max-h-[90vh]">
                        <img src={previewUrl} alt="预览" className="max-w-full max-h-[90vh] object-contain rounded-lg" style={{ boxShadow: '0 0 40px rgba(0,245,255,0.2)' }} />
                        <button onClick={() => setPreviewUrl(null)} className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(30,30,46,0.95)', border: '1px solid rgba(0,245,255,0.3)' }}>
                            <X size={16} style={{ color: '#00f5ff' }} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};
