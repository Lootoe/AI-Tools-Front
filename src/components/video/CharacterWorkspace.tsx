import React, { useState, useEffect, useRef } from 'react';
import { User, Plus, Trash2, Save, X, Sparkles, Loader2, Link2, CheckCircle2, UserPlus, Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { InlineLoading } from '@/components/ui/Loading';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ReferenceImageUploader } from '@/components/ui/ReferenceImageUploader';
import { CyberVideoPlayer } from './CyberVideoPlayer';
import { useCharacterStore } from '@/stores/characterStore';
import { useAssetStore } from '@/stores/assetStore';
import { useAuthStore } from '@/stores/authStore';
import { generateCharacterVideo, registerSoraCharacter } from '@/services/characterApi';
import { Character } from '@/types/video';

interface CharacterWorkspaceProps {
    scriptId: string;
}

// 角色 ID 卡片组件（用于角色池展示）
const CharacterIDCard: React.FC<{
    character: Character;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onRegister?: () => void;
}> = ({ character, isSelected, onSelect, onDelete, onRegister }) => {
    const isGenerating = character.status === 'generating' || character.status === 'queued';
    const isVerified = !!character.soraCharacterId;
    const canRegister = character.videoUrl && character.taskId && !isGenerating;
    const [copied, setCopied] = useState(false);

    const handleCopyUsername = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isVerified && character.soraUsername) {
            navigator.clipboard.writeText(character.soraUsername);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
    };

    return (
        <div
            onClick={onSelect}
            className="group relative rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02]"
            style={{
                background: isVerified
                    ? 'linear-gradient(135deg, rgba(0,245,255,0.08), rgba(0,180,200,0.05))'
                    : 'rgba(18,18,26,0.8)',
                border: '1px solid',
                borderColor: isSelected
                    ? 'rgba(0,245,255,0.6)'
                    : isVerified
                        ? 'rgba(0,245,255,0.3)'
                        : 'rgba(75,85,99,0.3)',
                boxShadow: isSelected ? '0 0 12px rgba(0,245,255,0.25)' : '0 2px 8px rgba(0,0,0,0.3)',
            }}
        >
            {/* 删除按钮 */}
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="absolute top-1 right-1 p-0.5 rounded opacity-0 group-hover:opacity-100 z-10 transition-opacity"
                style={{ backgroundColor: 'rgba(239,68,68,0.9)' }}
            >
                <Trash2 size={12} className="text-white" />
            </button>

            <div className="p-2.5 flex gap-3 items-center">
                {/* 头像区域 */}
                <div className="relative flex-shrink-0">
                    <div
                        className="w-14 h-14 rounded-lg overflow-hidden flex items-center justify-center"
                        style={{
                            backgroundColor: isVerified ? 'transparent' : 'rgba(75,85,99,0.3)',
                            border: `1.5px solid ${isVerified ? 'rgba(0,245,255,0.4)' : 'rgba(75,85,99,0.4)'}`,
                        }}
                    >
                        {isGenerating ? (
                            <InlineLoading size={18} color="#bf00ff" />
                        ) : isVerified && character.soraProfilePictureUrl ? (
                            <img src={character.soraProfilePictureUrl} alt={character.name} className="w-full h-full object-cover" />
                        ) : character.thumbnailUrl || character.referenceImageUrl ? (
                            <img
                                src={character.thumbnailUrl || character.referenceImageUrl}
                                alt={character.name}
                                className={`w-full h-full object-cover ${!isVerified ? 'opacity-60' : ''}`}
                            />
                        ) : (
                            <span className="text-xl font-bold" style={{ color: 'rgba(156,163,175,0.5)' }}>
                                {character.name?.charAt(0) || '?'}
                            </span>
                        )}
                    </div>
                    {/* 认证标记 */}
                    {isVerified && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#10b981' }}>
                            <CheckCircle2 size={10} className="text-white" />
                        </div>
                    )}
                </div>

                {/* 信息区域 */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                    <div className="text-xs font-medium text-white truncate">{character.name || '未命名'}</div>
                    <div
                        className="flex items-center gap-1 group/copy cursor-pointer"
                        onClick={handleCopyUsername}
                        title={isVerified ? '点击复制' : ''}
                    >
                        <span className="text-xs" style={{ color: isVerified ? '#00f5ff' : '#6b7280' }}>
                            {isVerified ? character.soraUsername : '—'}
                        </span>
                        {isVerified && (
                            copied ? (
                                <CheckCircle2 size={10} style={{ color: '#10b981' }} />
                            ) : (
                                <Copy size={10} className="opacity-0 group-hover/copy:opacity-100 transition-opacity" style={{ color: '#00f5ff' }} />
                            )
                        )}
                    </div>
                    <div className="text-[10px] font-mono" style={{ color: '#9ca3af' }}>
                        {character.taskId || '—'}
                    </div>
                </div>
            </div>

            {/* 底部状态栏 */}
            <div
                className="px-2.5 py-1.5 flex flex-col gap-1"
                style={{
                    backgroundColor: isVerified ? 'rgba(16,185,129,0.1)' : 'rgba(75,85,99,0.1)',
                    borderTop: `1px solid ${isVerified ? 'rgba(16,185,129,0.2)' : 'rgba(75,85,99,0.2)'}`,
                }}
            >
                <div className="flex items-center justify-between">
                    {isVerified ? (
                        <div className="flex items-center gap-1">
                            <CheckCircle2 size={11} style={{ color: '#10b981' }} />
                            <span className="text-[10px] font-medium" style={{ color: '#10b981' }}>Verified</span>
                        </div>
                    ) : (
                        <span className="text-[11px]" style={{ color: character.status === 'failed' ? '#ef4444' : '#9ca3af' }}>
                            {isGenerating ? '生成中...' : character.status === 'failed' ? '生成失败' : 'Unregistered'}
                        </span>
                    )}
                    {/* 注册按钮 */}
                    {canRegister && onRegister ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); onRegister(); }}
                            className="px-2 py-1 rounded flex items-center gap-1 text-[10px] font-medium transition-all hover:brightness-110"
                            style={{
                                background: isVerified
                                    ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(0,180,200,0.15))'
                                    : 'linear-gradient(135deg, rgba(0,245,255,0.15), rgba(0,180,200,0.15))',
                                border: `1px solid ${isVerified ? 'rgba(16,185,129,0.4)' : 'rgba(0,245,255,0.4)'}`,
                                color: isVerified ? '#10b981' : '#00f5ff',
                            }}
                        >
                            <UserPlus size={10} />
                            {isVerified ? '重新固定' : '固定角色'}
                        </button>
                    ) : (
                        isSelected && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#00f5ff' }} />
                    )}
                </div>
                {/* 失败原因 */}
                {character.status === 'failed' && character.failReason && (
                    <div className="text-[9px] truncate" style={{ color: '#ef4444' }} title={character.failReason}>
                        原因: {character.failReason}
                    </div>
                )}
            </div>
        </div>
    );
};


// 注册角色弹窗组件
const RegisterCharacterDialog: React.FC<{
    isOpen: boolean;
    character: Character;
    onClose: () => void;
    onConfirm: (timestamps: string) => void;
    isRegistering: boolean;
}> = ({ isOpen, character, onClose, onConfirm, isRegistering }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const [startTime, setStartTime] = useState(0);
    const [videoDuration, setVideoDuration] = useState(10);
    const [isDragging, setIsDragging] = useState(false);
    const dragOffsetRef = useRef(0);
    const FIXED_DURATION = 3;

    const endTime = Math.min(startTime + FIXED_DURATION, videoDuration);

    useEffect(() => {
        if (isOpen && videoRef.current) {
            videoRef.current.currentTime = startTime;
        }
    }, [isOpen, startTime]);

    const handleVideoLoaded = () => {
        if (videoRef.current) {
            setVideoDuration(videoRef.current.duration);
            setStartTime(0);
        }
    };

    const calculateStartTime = (clientX: number, offset = 0) => {
        if (!trackRef.current) return startTime;
        const rect = trackRef.current.getBoundingClientRect();
        const clickX = clientX - rect.left - offset;
        const percentage = clickX / rect.width;
        const maxStart = Math.max(0, videoDuration - FIXED_DURATION);
        return Math.min(Math.max(0, percentage * videoDuration), maxStart);
    };

    const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging) return;
        const sliderWidthPx = (FIXED_DURATION / videoDuration) * trackRef.current!.getBoundingClientRect().width;
        const newStart = calculateStartTime(e.clientX, sliderWidthPx / 2);
        setStartTime(newStart);
        if (videoRef.current) {
            videoRef.current.currentTime = newStart;
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const sliderRect = e.currentTarget.getBoundingClientRect();
        dragOffsetRef.current = e.clientX - sliderRect.left;
        setIsDragging(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !trackRef.current) return;
            const newStart = calculateStartTime(e.clientX, dragOffsetRef.current);
            setStartTime(newStart);
            if (videoRef.current) {
                videoRef.current.currentTime = newStart;
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, videoDuration]);

    if (!isOpen) return null;

    const sliderWidthPercent = (FIXED_DURATION / videoDuration) * 100;
    const sliderLeftPercent = (startTime / videoDuration) * 100;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }} onClick={onClose}>
            <div className="w-[600px] rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(18,18,26,0.98)', border: '1px solid rgba(0,245,255,0.3)' }} onClick={(e) => e.stopPropagation()}>
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #1e1e2e' }}>
                    <div className="flex items-center gap-2">
                        <UserPlus size={16} style={{ color: '#00f5ff' }} />
                        <span className="text-sm font-medium text-white">注册角色（保持一致性）</span>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5"><X size={16} style={{ color: '#6b7280' }} /></button>
                </div>
                <div className="p-4">
                    <div className="rounded-lg overflow-hidden mb-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                        <video ref={videoRef} src={character.videoUrl} className="w-full max-h-[300px] object-contain" controls onLoadedMetadata={handleVideoLoaded} />
                    </div>
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs" style={{ color: '#9ca3af' }}>选择角色出现的时间段（固定3秒）</span>
                            <span className="text-xs font-mono px-2 py-1 rounded" style={{ color: '#00f5ff', backgroundColor: 'rgba(0,245,255,0.1)' }}>
                                {startTime.toFixed(1)}s - {endTime.toFixed(1)}s
                            </span>
                        </div>
                        <div
                            ref={trackRef}
                            className="relative h-8 rounded-full cursor-pointer select-none"
                            style={{
                                backgroundColor: 'rgba(30,30,46,0.8)',
                                border: '1px solid rgba(75,85,99,0.3)',
                            }}
                            onClick={handleTrackClick}
                        >
                            <div
                                className="absolute top-1 bottom-1 rounded-full cursor-grab active:cursor-grabbing select-none"
                                style={{
                                    left: `${sliderLeftPercent}%`,
                                    width: `${sliderWidthPercent}%`,
                                    background: 'linear-gradient(90deg, #00f5ff, #00d4aa)',
                                    boxShadow: isDragging
                                        ? '0 0 16px rgba(0,245,255,0.6), inset 0 1px 0 rgba(255,255,255,0.2)'
                                        : '0 2px 8px rgba(0,245,255,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                                }}
                                onMouseDown={handleMouseDown}
                            >
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="flex gap-0.5">
                                        <div className="w-0.5 h-3 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} />
                                        <div className="w-0.5 h-3 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} />
                                        <div className="w-0.5 h-3 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between mt-1.5">
                            <span className="text-[10px]" style={{ color: '#4b5563' }}>0s</span>
                            <span className="text-[10px]" style={{ color: '#4b5563' }}>{videoDuration.toFixed(1)}s</span>
                        </div>
                        <p className="text-[10px] mt-2 text-center" style={{ color: '#6b7280' }}>拖动滑块选择角色清晰出现的片段</p>
                    </div>
                    <button onClick={() => onConfirm(`${Math.round(startTime)},${Math.round(endTime)}`)} disabled={isRegistering}
                        className="w-full py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all hover:brightness-110"
                        style={{ background: isRegistering ? 'rgba(0,245,255,0.1)' : 'linear-gradient(135deg, rgba(0,245,255,0.2), rgba(0,180,200,0.2))', border: '1px solid rgba(0,245,255,0.4)', color: '#00f5ff', opacity: isRegistering ? 0.6 : 1 }}>
                        {isRegistering ? <><Loader2 size={16} className="animate-spin" />注册中...</> : <><UserPlus size={16} />确认注册</>}
                    </button>
                </div>
            </div>
        </div>
    );
};


export const CharacterWorkspace: React.FC<CharacterWorkspaceProps> = ({ scriptId }) => {
    const { characters, isLoading, loadCharacters, addCharacter, updateCharacter, deleteCharacter, refreshCharacter } = useCharacterStore();
    const { assets, loadAssets } = useAssetStore();
    const { updateBalance } = useAuthStore();
    const { showToast, ToastContainer } = useToast();

    const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
    const [duration, setDuration] = useState<'10' | '15'>('15');
    const [promptTemplateId, setPromptTemplateId] = useState('character-default');

    const [isAssetDialogOpen, setIsAssetDialogOpen] = useState(false);
    const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [registeringCharacterId, setRegisteringCharacterId] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; characterId: string | null; characterName: string }>({ isOpen: false, characterId: null, characterName: '' });
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => { if (scriptId) { loadCharacters(scriptId); loadAssets(scriptId); } }, [scriptId, loadCharacters, loadAssets]);

    useEffect(() => {
        const c = characters.find((c) => c.id === selectedCharacterId);
        if (c) { setEditName(c.name || ''); setEditDescription(c.description || ''); }
        else { setEditName(''); setEditDescription(''); }
    }, [selectedCharacterId, characters]);

    const selectedCharacter = characters.find((c) => c.id === selectedCharacterId);
    const isProcessing = selectedCharacter?.status === 'generating' || selectedCharacter?.status === 'queued';

    useEffect(() => {
        if (selectedCharacter && (selectedCharacter.status === 'generating' || selectedCharacter.status === 'queued')) {
            pollingRef.current = setInterval(() => { refreshCharacter(scriptId, selectedCharacter.id); }, 5000);
        }
        return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }, [selectedCharacter?.id, selectedCharacter?.status, scriptId, refreshCharacter]);

    const handleCreateCharacter = async () => {
        try { const id = await addCharacter(scriptId, '新角色', ''); setSelectedCharacterId(id); } catch { }
    };

    const handleSave = async () => {
        if (!selectedCharacter || isSaving) return;
        setIsSaving(true);
        try {
            await updateCharacter(scriptId, selectedCharacter.id, { name: editName.trim() || '未命名角色', description: editDescription.trim() });
            showToast('保存成功', 'success');
        } catch { } finally { setIsSaving(false); }
    };

    const handleReferenceImageChange = async (urls: string[]) => {
        if (!selectedCharacter) return;
        await updateCharacter(scriptId, selectedCharacter.id, { referenceImageUrl: urls[0] || undefined });
    };

    const handleSelectAsset = async (assetImageUrl: string) => {
        if (!selectedCharacter) return;
        await updateCharacter(scriptId, selectedCharacter.id, { referenceImageUrl: assetImageUrl });
        setIsAssetDialogOpen(false);
        showToast('已关联资产图片', 'success');
    };

    const handleGenerateVideo = async () => {
        if (!selectedCharacter || !editDescription.trim() || isProcessing) return;
        const tokenCost = 3;
        updateBalance((prev) => prev - tokenCost);
        await updateCharacter(scriptId, selectedCharacter.id, { status: 'generating', progress: '0' });
        try {
            const response = await generateCharacterVideo({
                prompt: editDescription.trim(), promptTemplateId, aspect_ratio: aspectRatio, duration,
                referenceImageUrl: selectedCharacter.referenceImageUrl, characterId: selectedCharacter.id,
            });
            if (response.balance !== undefined) updateBalance(response.balance);
            showToast('视频生成已开始', 'success');
        } catch (err) {
            await loadCharacters(scriptId);
            showToast(err instanceof Error ? err.message : '生成失败，请重试', 'error');
        }
    };

    const handleOpenRegisterDialog = (characterId: string) => {
        setRegisteringCharacterId(characterId);
        setIsRegisterDialogOpen(true);
    };

    const handleRegisterCharacter = async (timestamps: string) => {
        const targetId = registeringCharacterId || selectedCharacterId;
        if (!targetId) return;
        setIsRegistering(true);
        try {
            const response = await registerSoraCharacter(targetId, timestamps);
            if (response.success) {
                await loadCharacters(scriptId);
                showToast('角色注册成功', 'success');
                setIsRegisterDialogOpen(false);
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : '注册失败，请重试', 'error');
        } finally {
            setIsRegistering(false);
            setRegisteringCharacterId(null);
        }
    };

    const handleDeleteClick = (c: Character) => setDeleteConfirm({ isOpen: true, characterId: c.id, characterName: c.name || '未命名角色' });
    const handleConfirmDelete = async () => {
        if (deleteConfirm.characterId) {
            try { await deleteCharacter(scriptId, deleteConfirm.characterId); if (selectedCharacterId === deleteConfirm.characterId) setSelectedCharacterId(null); } catch { }
        }
        setDeleteConfirm({ isOpen: false, characterId: null, characterName: '' });
    };

    const registerDialogCharacter = registeringCharacterId ? characters.find(c => c.id === registeringCharacterId) : selectedCharacter;


    return (
        <>
            <ToastContainer />
            <ConfirmDialog isOpen={deleteConfirm.isOpen} title="删除角色" message={`确定要删除角色「${deleteConfirm.characterName}」吗？`} type="danger" confirmText="删除" cancelText="取消" onConfirm={handleConfirmDelete} onCancel={() => setDeleteConfirm({ isOpen: false, characterId: null, characterName: '' })} />

            {registerDialogCharacter && (
                <RegisterCharacterDialog isOpen={isRegisterDialogOpen} character={registerDialogCharacter} onClose={() => { setIsRegisterDialogOpen(false); setRegisteringCharacterId(null); }} onConfirm={handleRegisterCharacter} isRegistering={isRegistering} />
            )}

            {isAssetDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setIsAssetDialogOpen(false)}>
                    <div className="w-[500px] max-h-[70vh] rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(18,18,26,0.98)', border: '1px solid rgba(0,245,255,0.3)' }} onClick={(e) => e.stopPropagation()}>
                        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #1e1e2e' }}>
                            <span className="text-sm font-medium text-white">选择资产图片</span>
                            <button onClick={() => setIsAssetDialogOpen(false)} className="p-1 rounded-lg hover:bg-white/5"><X size={16} style={{ color: '#6b7280' }} /></button>
                        </div>
                        <div className="p-3 overflow-y-auto max-h-[50vh]">
                            {assets.filter(a => a.designImageUrl).length === 0 ? (
                                <div className="text-center py-8 text-sm" style={{ color: '#6b7280' }}>暂无可用资产图片</div>
                            ) : (
                                <div className="grid grid-cols-4 gap-2">
                                    {assets.filter(a => a.designImageUrl).map((asset) => (
                                        <div key={asset.id} onClick={() => handleSelectAsset(asset.designImageUrl!)} className="cursor-pointer rounded-lg overflow-hidden hover:ring-2 hover:ring-cyan-400 transition-all">
                                            <img src={asset.designImageUrl} alt={asset.name} className="w-full aspect-square object-cover" />
                                            <div className="px-1 py-1 text-center"><span className="text-[10px] truncate" style={{ color: '#d1d5db' }}>{asset.name}</span></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 flex gap-3 overflow-hidden">
                {/* 左侧：角色池（ID卡形式） */}
                <div className="w-[320px] flex-shrink-0 flex flex-col rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(10,10,15,0.6)', border: '1px solid #1e1e2e' }}>
                    <div className="px-3 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid #1e1e2e' }}>
                        <div className="flex items-center gap-2">
                            <User size={14} style={{ color: '#00f5ff' }} />
                            <span className="text-xs font-medium text-white">角色身份</span>
                            <span className="text-[10px]" style={{ color: '#6b7280' }}>{characters.length}</span>
                        </div>
                        <button
                            onClick={handleCreateCharacter}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-all hover:brightness-110"
                            style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(191,0,255,0.1))', border: '1px solid rgba(0,245,255,0.3)', color: '#00f5ff' }}
                        >
                            <Plus size={12} />新建角色
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8"><InlineLoading size={18} color="#00f5ff" /></div>
                        ) : (
                            <div className="grid grid-cols-1 gap-2">
                                {characters.map((c) => (
                                    <CharacterIDCard
                                        key={c.id}
                                        character={c}
                                        isSelected={selectedCharacterId === c.id}
                                        onSelect={() => setSelectedCharacterId(c.id)}
                                        onDelete={() => handleDeleteClick(c)}
                                        onRegister={() => handleOpenRegisterDialog(c.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>


                {/* 右侧：视频预览区 */}
                <div className="flex-1 flex flex-col rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(10,10,15,0.6)', border: '1px solid #1e1e2e' }}>
                    <div className="flex-1 flex overflow-hidden">
                        {selectedCharacter ? (
                            <>
                                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                                    <CyberVideoPlayer
                                        title="角色视频"
                                        videoUrl={isProcessing ? undefined : selectedCharacter.videoUrl}
                                        thumbnailUrl={selectedCharacter.thumbnailUrl}
                                        aspectRatio={aspectRatio}
                                        onAspectRatioChange={setAspectRatio}
                                        duration={duration}
                                        onDurationChange={setDuration}
                                        promptTemplateId={promptTemplateId}
                                        onPromptTemplateChange={setPromptTemplateId}
                                        promptTemplateCategory="character"
                                        isProcessing={isProcessing}
                                        processingProgress={selectedCharacter.progress}
                                        onGenerate={handleGenerateVideo}
                                        generateDisabled={!selectedCharacter || !editDescription.trim()}
                                        generateCost={3}
                                    />
                                </div>

                                <div className="w-[280px] flex-shrink-0 flex flex-col gap-3 p-3 overflow-y-auto" style={{ borderLeft: '1px solid #1e1e2e' }}>
                                    <div><label className="block text-xs font-medium mb-1.5" style={{ color: '#9ca3af' }}>角色姓名</label><Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="输入角色姓名..." className="h-9 text-sm" /></div>
                                    <div className="flex-1 flex flex-col min-h-[120px]"><label className="block text-xs font-medium mb-1.5" style={{ color: '#9ca3af' }}>角色设定</label><Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="描述角色的外观、性格、动作等信息..." className="flex-1 min-h-0 resize-none text-sm" /></div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1.5" style={{ color: '#9ca3af' }}>参考图（1张）</label>
                                        <ReferenceImageUploader
                                            images={selectedCharacter.referenceImageUrl ? [selectedCharacter.referenceImageUrl] : []}
                                            onChange={handleReferenceImageChange}
                                            maxCount={1}
                                            disabled={isProcessing}
                                            uploadText="上传参考图"
                                            hint="支持 JPG、PNG"
                                            imageSize="md"
                                            onError={(msg) => showToast(msg, 'error')}
                                        />
                                        <button
                                            onClick={() => setIsAssetDialogOpen(true)}
                                            className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all hover:brightness-110"
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(191,0,255,0.15), rgba(0,245,255,0.15))',
                                                color: '#bf00ff',
                                                border: '1px solid rgba(191,0,255,0.3)',
                                            }}
                                        >
                                            <Link2 size={14} />
                                            关联资产
                                        </button>
                                    </div>
                                    <button onClick={handleSave} disabled={isSaving} className="w-full h-9 rounded-lg flex items-center justify-center text-xs font-medium" style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(0,212,170,0.1))', border: '1px solid rgba(0,245,255,0.3)', color: '#00f5ff', opacity: isSaving ? 0.7 : 1 }}>
                                        {isSaving ? <><InlineLoading size={14} color="#00f5ff" /><span className="ml-2">保存中...</span></> : <><Save size={14} className="mr-2" />保存</>}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <div className="relative mb-6">
                                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(191,0,255,0.1))', border: '1px solid rgba(0,245,255,0.2)' }}>
                                        <User size={36} style={{ color: 'rgba(0,245,255,0.5)' }} />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ff00ff, #bf00ff)' }}>
                                        <Sparkles size={12} className="text-white" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">选择或创建角色</h3>
                                <p className="text-sm max-w-md mb-4" style={{ color: '#6b7280' }}>从左侧角色池选择一个角色进行编辑，或点击"新建"创建新角色</p>
                                <Button onClick={handleCreateCharacter} className="h-10 px-6" style={{ background: 'linear-gradient(135deg, #00f5ff, #00d4aa)' }}>
                                    <Plus size={16} className="mr-2" />新建角色
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
