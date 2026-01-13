import React, { useState, useEffect, useRef } from 'react';
import { User, Plus, Trash2, Save, ChevronDown, X, Sparkles, Play, Loader2, Link2, CheckCircle2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { InlineLoading } from '@/components/ui/Loading';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ReferenceImageUploader } from '@/components/ui/ReferenceImageUploader';
import { useCharacterStore } from '@/stores/characterStore';
import { useAssetStore } from '@/stores/assetStore';
import { useAuthStore } from '@/stores/authStore';
import { generateCharacterVideo, registerSoraCharacter } from '@/services/characterApi';
import { getPromptTemplates, PromptTemplateConfig } from '@/services/api';
import { Character } from '@/types/video';
import CoinIcon from '@/img/coin.webp';

interface CharacterWorkspaceProps {
    scriptId: string;
}

const ASPECT_RATIOS = [
    { value: '9:16', label: '9:16' },
    { value: '16:9', label: '16:9' },
] as const;

const DURATIONS = [
    { value: '10', label: '10秒' },
    { value: '15', label: '15秒' },
] as const;

// 角色 ID 卡片组件（用于角色池展示）
const CharacterIDCard: React.FC<{
    character: Character;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
}> = ({ character, isSelected, onSelect, onDelete }) => {
    const isGenerating = character.status === 'generating' || character.status === 'queued';
    const isVerified = !!character.soraCharacterId;

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
                <Trash2 size={10} className="text-white" />
            </button>

            <div className="p-2 flex gap-2 items-center">
                {/* 头像区域 */}
                <div className="relative flex-shrink-0">
                    <div
                        className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center"
                        style={{
                            backgroundColor: isVerified ? 'transparent' : 'rgba(75,85,99,0.3)',
                            border: `1.5px solid ${isVerified ? 'rgba(0,245,255,0.4)' : 'rgba(75,85,99,0.4)'}`,
                        }}
                    >
                        {isGenerating ? (
                            <InlineLoading size={16} color="#bf00ff" />
                        ) : isVerified && character.soraProfilePicUrl ? (
                            <img src={character.soraProfilePicUrl} alt={character.name} className="w-full h-full object-cover" />
                        ) : character.thumbnailUrl || character.referenceImageUrl ? (
                            <img
                                src={character.thumbnailUrl || character.referenceImageUrl}
                                alt={character.name}
                                className={`w-full h-full object-cover ${!isVerified ? 'opacity-60' : ''}`}
                            />
                        ) : (
                            <span className="text-lg font-bold" style={{ color: 'rgba(156,163,175,0.5)' }}>
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
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="text-[11px] font-medium text-white truncate">{character.name || '未命名'}</div>
                    <div className="text-[9px] truncate" style={{ color: isVerified ? '#00f5ff' : '#6b7280' }}>
                        {isVerified ? character.soraUsername : '—'}
                    </div>
                    <div className="text-[8px] font-mono truncate" style={{ color: '#9ca3af' }}>
                        {isVerified ? character.soraCharacterId : character.taskId || '—'}
                    </div>
                </div>
            </div>

            {/* 底部状态栏 */}
            <div
                className="px-2 py-1 flex items-center justify-between"
                style={{
                    backgroundColor: isVerified ? 'rgba(16,185,129,0.1)' : 'rgba(75,85,99,0.1)',
                    borderTop: `1px solid ${isVerified ? 'rgba(16,185,129,0.2)' : 'rgba(75,85,99,0.2)'}`,
                }}
            >
                {isVerified ? (
                    <div className="flex items-center gap-1">
                        <CheckCircle2 size={10} style={{ color: '#10b981' }} />
                        <span className="text-[9px] font-medium" style={{ color: '#10b981' }}>Verified</span>
                    </div>
                ) : (
                    <span className="text-[9px]" style={{ color: '#6b7280' }}>
                        {isGenerating ? '生成中...' : 'Unregistered'}
                    </span>
                )}
                {isSelected && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#00f5ff' }} />}
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
    const [startTime, setStartTime] = useState(1);
    const [endTime, setEndTime] = useState(2);
    const [videoDuration, setVideoDuration] = useState(10);

    useEffect(() => {
        if (isOpen && videoRef.current) {
            videoRef.current.currentTime = startTime;
        }
    }, [isOpen, startTime]);

    const handleVideoLoaded = () => {
        if (videoRef.current) {
            setVideoDuration(Math.floor(videoRef.current.duration));
        }
    };

    const handleStartChange = (value: number) => {
        setStartTime(value);
        if (endTime <= value) {
            setEndTime(Math.min(value + 1, videoDuration));
        } else if (endTime - value > 3) {
            setEndTime(value + 3);
        }
        if (videoRef.current) {
            videoRef.current.currentTime = value;
        }
    };

    const handleEndChange = (value: number) => {
        setEndTime(value);
        if (startTime >= value) {
            setStartTime(Math.max(value - 1, 0));
        } else if (value - startTime > 3) {
            setStartTime(value - 3);
        }
    };

    if (!isOpen) return null;

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
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs" style={{ color: '#9ca3af' }}>选择角色出现的时间范围（1-3秒）</span>
                            <span className="text-xs font-mono" style={{ color: '#00f5ff' }}>{startTime}s - {endTime}s</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="text-[10px] mb-1 block" style={{ color: '#6b7280' }}>开始时间</label>
                                <input type="range" min={0} max={Math.max(0, videoDuration - 1)} value={startTime} onChange={(e) => handleStartChange(Number(e.target.value))}
                                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                    style={{ background: `linear-gradient(to right, #00f5ff ${(startTime / videoDuration) * 100}%, rgba(75,85,99,0.4) ${(startTime / videoDuration) * 100}%)` }} />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] mb-1 block" style={{ color: '#6b7280' }}>结束时间</label>
                                <input type="range" min={1} max={videoDuration} value={endTime} onChange={(e) => handleEndChange(Number(e.target.value))}
                                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                    style={{ background: `linear-gradient(to right, #bf00ff ${(endTime / videoDuration) * 100}%, rgba(75,85,99,0.4) ${(endTime / videoDuration) * 100}%)` }} />
                            </div>
                        </div>
                        <p className="text-[10px] mt-2" style={{ color: '#6b7280' }}>提示：选择视频中角色清晰出现的片段，范围差值需在1-3秒之间</p>
                    </div>
                    <button onClick={() => onConfirm(`${startTime},${endTime}`)} disabled={isRegistering || endTime - startTime < 1 || endTime - startTime > 3}
                        className="w-full py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all"
                        style={{ background: isRegistering ? 'rgba(0,245,255,0.1)' : 'linear-gradient(135deg, rgba(0,245,255,0.2), rgba(0,180,200,0.2))', border: '1px solid rgba(0,245,255,0.4)', color: '#00f5ff', opacity: isRegistering || endTime - startTime < 1 || endTime - startTime > 3 ? 0.6 : 1 }}>
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
    const [promptTemplates, setPromptTemplates] = useState<PromptTemplateConfig[]>([]);
    const [isRatioDropdownOpen, setIsRatioDropdownOpen] = useState(false);
    const [isDurationDropdownOpen, setIsDurationDropdownOpen] = useState(false);
    const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);

    const [isAssetDialogOpen, setIsAssetDialogOpen] = useState(false);
    const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [registeringCharacterId, setRegisteringCharacterId] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; characterId: string | null; characterName: string }>({ isOpen: false, characterId: null, characterName: '' });
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => { if (scriptId) { loadCharacters(scriptId); loadAssets(scriptId); } }, [scriptId, loadCharacters, loadAssets]);
    useEffect(() => { getPromptTemplates('character').then((res) => { if (res.success) setPromptTemplates(res.data); }).catch(() => { }); }, []);

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

            {isTemplateDropdownOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setIsTemplateDropdownOpen(false)}>
                    <div className="w-[500px] rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(18,18,26,0.98)', border: '1px solid rgba(191,0,255,0.3)' }} onClick={(e) => e.stopPropagation()}>
                        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #1e1e2e' }}>
                            <span className="text-sm font-medium text-white">选择提示词模板</span>
                            <button onClick={() => setIsTemplateDropdownOpen(false)} className="p-1 rounded-lg hover:bg-white/5"><X size={16} style={{ color: '#6b7280' }} /></button>
                        </div>
                        <div className="p-3 max-h-[400px] overflow-y-auto">
                            <div className="grid gap-2">
                                {promptTemplates.map((t) => (
                                    <button key={t.id} onClick={() => { setPromptTemplateId(t.id); setIsTemplateDropdownOpen(false); }}
                                        className="w-full px-3 py-2.5 rounded-lg text-left transition-all hover:brightness-110"
                                        style={{ backgroundColor: promptTemplateId === t.id ? 'rgba(191,0,255,0.1)' : 'rgba(0,0,0,0.2)', border: promptTemplateId === t.id ? '1px solid rgba(191,0,255,0.4)' : '1px solid rgba(30,30,46,0.6)' }}>
                                        <div className="text-xs font-medium" style={{ color: promptTemplateId === t.id ? '#bf00ff' : '#e5e7eb' }}>{t.label}</div>
                                        {t.description && <div className="text-[10px] mt-0.5" style={{ color: '#6b7280' }}>{t.description}</div>}
                                    </button>
                                ))}
                            </div>
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
                            <div className="grid grid-cols-2 gap-2">
                                {characters.map((c) => (
                                    <CharacterIDCard
                                        key={c.id}
                                        character={c}
                                        isSelected={selectedCharacterId === c.id}
                                        onSelect={() => setSelectedCharacterId(c.id)}
                                        onDelete={() => handleDeleteClick(c)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>


                {/* 右侧：视频预览区 */}
                <div className="flex-1 flex flex-col rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(10,10,15,0.6)', border: '1px solid #1e1e2e' }}>
                    <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid #1e1e2e' }}>
                        <div className="flex items-center gap-2">
                            <Play size={14} style={{ color: '#00f5ff' }} />
                            <span className="text-sm font-medium text-white">角色视频</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => !isProcessing && setIsTemplateDropdownOpen(true)} disabled={isProcessing} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: 'rgba(191,0,255,0.1)', border: '1px solid rgba(191,0,255,0.2)', color: '#bf00ff', opacity: isProcessing ? 0.5 : 1 }}>
                                <span className="max-w-[80px] truncate">{promptTemplates.find(t => t.id === promptTemplateId)?.label || '角色视频模板'}</span><ChevronDown size={12} />
                            </button>
                            <div className="relative">
                                <button onClick={() => !isProcessing && setIsRatioDropdownOpen(!isRatioDropdownOpen)} disabled={isProcessing} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: 'rgba(77,124,255,0.1)', border: '1px solid rgba(77,124,255,0.2)', color: '#4d7cff', opacity: isProcessing ? 0.5 : 1 }}>
                                    <span>{aspectRatio}</span><ChevronDown size={12} />
                                </button>
                                {isRatioDropdownOpen && (
                                    <><div className="fixed inset-0 z-10" onClick={() => setIsRatioDropdownOpen(false)} />
                                        <div className="absolute right-0 top-full mt-1 z-20 rounded-lg overflow-hidden" style={{ backgroundColor: 'rgba(18,18,26,0.98)', border: '1px solid rgba(77,124,255,0.2)' }}>
                                            {ASPECT_RATIOS.map((r) => <button key={r.value} onClick={() => { setAspectRatio(r.value); setIsRatioDropdownOpen(false); }} className="w-full px-3 py-1.5 text-xs text-left whitespace-nowrap" style={{ color: aspectRatio === r.value ? '#4d7cff' : '#d1d5db', backgroundColor: aspectRatio === r.value ? 'rgba(77,124,255,0.1)' : 'transparent' }}>{r.label}</button>)}
                                        </div></>
                                )}
                            </div>
                            <div className="relative">
                                <button onClick={() => !isProcessing && setIsDurationDropdownOpen(!isDurationDropdownOpen)} disabled={isProcessing} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: 'rgba(255,0,255,0.1)', border: '1px solid rgba(255,0,255,0.2)', color: '#ff00ff', opacity: isProcessing ? 0.5 : 1 }}>
                                    <span>{duration}秒</span><ChevronDown size={12} />
                                </button>
                                {isDurationDropdownOpen && (
                                    <><div className="fixed inset-0 z-10" onClick={() => setIsDurationDropdownOpen(false)} />
                                        <div className="absolute right-0 top-full mt-1 z-20 rounded-lg overflow-hidden" style={{ backgroundColor: 'rgba(18,18,26,0.98)', border: '1px solid rgba(255,0,255,0.2)' }}>
                                            {DURATIONS.map((d) => <button key={d.value} onClick={() => { setDuration(d.value); setIsDurationDropdownOpen(false); }} className="w-full px-3 py-1.5 text-xs text-left whitespace-nowrap" style={{ color: duration === d.value ? '#ff00ff' : '#d1d5db', backgroundColor: duration === d.value ? 'rgba(255,0,255,0.1)' : 'transparent' }}>{d.label}</button>)}
                                        </div></>
                                )}
                            </div>
                            <button onClick={handleGenerateVideo} disabled={isProcessing || !selectedCharacter || !editDescription.trim()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                                style={{ background: isProcessing || !selectedCharacter || !editDescription.trim() ? 'rgba(191,0,255,0.1)' : 'linear-gradient(135deg, rgba(191,0,255,0.2), rgba(255,0,255,0.2))', border: '1px solid rgba(191,0,255,0.3)', color: '#bf00ff', opacity: isProcessing || !selectedCharacter || !editDescription.trim() ? 0.5 : 1 }}>
                                {isProcessing ? <><Loader2 size={12} className="animate-spin" />生成中...</> : <><Sparkles size={12} />生成（<img src={CoinIcon} alt="" className="w-3 h-3 inline" />3）</>}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {selectedCharacter ? (
                            <>
                                <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-auto relative">
                                    {isProcessing ? (
                                        <div className="text-center">
                                            <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, rgba(191,0,255,0.1), rgba(255,0,255,0.1))', border: '1px solid rgba(191,0,255,0.3)', boxShadow: '0 0 30px rgba(191,0,255,0.2)' }}>
                                                <Loader2 size={40} className="animate-spin" style={{ color: '#bf00ff' }} />
                                            </div>
                                            <p className="text-sm font-medium" style={{ color: '#bf00ff' }}>视频生成中...</p>
                                            <p className="text-xs mt-1" style={{ color: '#6b7280' }}>进度: {selectedCharacter.progress || '0'}%</p>
                                        </div>
                                    ) : selectedCharacter.videoUrl ? (
                                        <div className="flex flex-col items-center w-full">
                                            <video src={selectedCharacter.videoUrl} controls className="max-w-full max-h-[400px] object-contain rounded-lg" poster={selectedCharacter.thumbnailUrl} style={{ boxShadow: '0 0 30px rgba(0,245,255,0.15)' }} />
                                            {!selectedCharacter.soraCharacterId && selectedCharacter.taskId && (
                                                <button onClick={() => handleOpenRegisterDialog(selectedCharacter.id)} className="mt-4 px-6 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all hover:brightness-110"
                                                    style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(0,180,200,0.1))', border: '1px solid rgba(0,245,255,0.4)', color: '#00f5ff' }}>
                                                    <UserPlus size={16} />注册角色（保持一致性）
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 text-center">
                                            <div className="w-24 h-24 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.05), rgba(191,0,255,0.05))', border: '1px solid rgba(0,245,255,0.1)' }}>
                                                <Play size={40} style={{ color: 'rgba(0,245,255,0.3)' }} />
                                            </div>
                                            <div>
                                                <p className="text-sm" style={{ color: '#6b7280' }}>填写角色设定后点击"生成"</p>
                                                <p className="text-xs mt-1" style={{ color: '#4b5563' }}>建议上传参考图以获得更好效果</p>
                                            </div>
                                        </div>
                                    )}
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
