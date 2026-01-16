/**
 * CanvasTabs - 画布标签栏组件
 * 
 * 功能：
 * - 显示所有画布标签
 * - 点击切换画布
 * - 双击重命名画布
 * - 关闭按钮删除画布
 * - "+"按钮创建新画布
 */
import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Edit2 } from 'lucide-react';
import { Canvas } from '@/types/canvas';

interface CanvasTabsProps {
    canvases: Canvas[];
    currentCanvasId: string | null;
    onSwitch: (canvasId: string) => void;
    onCreate: () => void;
    onDelete: (canvasId: string) => void;
    onRename: (canvasId: string, name: string) => void;
}

export const CanvasTabs: React.FC<CanvasTabsProps> = ({
    canvases,
    currentCanvasId,
    onSwitch,
    onCreate,
    onDelete,
    onRename,
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // 自动聚焦输入框
    useEffect(() => {
        if (editingId && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingId]);

    // 开始编辑
    const handleStartEdit = (canvas: Canvas, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(canvas.id);
        setEditingName(canvas.name);
    };

    // 完成编辑
    const handleFinishEdit = () => {
        if (editingId && editingName.trim()) {
            onRename(editingId, editingName.trim());
        }
        setEditingId(null);
        setEditingName('');
    };

    // 取消编辑
    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingName('');
    };

    // 处理删除
    const handleDelete = (canvasId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (canvases.length <= 1) {
            return; // 至少保留一个画布
        }
        onDelete(canvasId);
    };

    return (
        <div
            className="flex items-center gap-1 px-2 py-1 overflow-x-auto"
            style={{
                backgroundColor: 'rgba(18, 18, 26, 0.8)',
                borderBottom: '1px solid rgba(0, 245, 255, 0.1)',
            }}
        >
            {/* 画布标签 */}
            {canvases.map((canvas) => {
                const isActive = canvas.id === currentCanvasId;
                const isEditing = editingId === canvas.id;

                return (
                    <div
                        key={canvas.id}
                        onClick={() => !isEditing && onSwitch(canvas.id)}
                        onDoubleClick={(e) => handleStartEdit(canvas, e)}
                        className="group relative flex items-center gap-1.5 px-2 py-1 cursor-pointer transition-all select-none"
                        style={{
                            backgroundColor: isActive
                                ? 'rgba(0, 245, 255, 0.15)'
                                : 'rgba(255, 255, 255, 0.05)',
                            border: isActive
                                ? '1px solid rgba(0, 245, 255, 0.3)'
                                : '1px solid transparent',
                            color: isActive ? '#00f5ff' : '#9ca3af',
                            minWidth: '120px',
                            maxWidth: '200px',
                        }}
                    >
                        {/* 编辑模式 */}
                        {isEditing ? (
                            <input
                                ref={inputRef}
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onBlur={handleFinishEdit}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleFinishEdit();
                                    } else if (e.key === 'Escape') {
                                        handleCancelEdit();
                                    }
                                }}
                                className="flex-1 bg-transparent outline-none text-xs"
                                style={{ color: '#00f5ff' }}
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <>
                                {/* 标签名称 */}
                                <span className="flex-1 text-xs font-medium truncate">
                                    {canvas.name}
                                </span>

                                {/* 编辑按钮（悬停显示） */}
                                <button
                                    onClick={(e) => handleStartEdit(canvas, e)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-white/10 rounded"
                                    title="重命名"
                                >
                                    <Edit2 size={10} />
                                </button>

                                {/* 关闭按钮 */}
                                {canvases.length > 1 && (
                                    <button
                                        onClick={(e) => handleDelete(canvas.id, e)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-500/20 rounded"
                                        title="删除画布"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                );
            })}

            {/* 新建按钮 */}
            <button
                onClick={onCreate}
                className="flex items-center justify-center p-1 transition-all hover:bg-white/10"
                style={{ color: '#00f5ff' }}
                title="新建画布"
            >
                <Plus size={14} />
            </button>
        </div>
    );
};

export default CanvasTabs;
