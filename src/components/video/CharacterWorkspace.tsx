import React, { useState, useEffect, useRef } from 'react';
import { User, Plus, Trash2, Save, ChevronDown, X, Sparkles, Play, Loader2, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { InlineLoading } from '@/components/ui/Loading';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useCharacterStore } from '@/stores/characterStore';
import { useAssetStore } from '@/stores/assetStore';
import { useAuthStore } from '@/stores/authStore';
import { generateCharacterVideo } from '@/services/characterApi';
import { uploadImage, getPromptTemplates, PromptTemplateConfig } from '@/services/api';
import { Character } from '@/types/video';
import CoinIcon from '@/img/coin.webp';

interface CharacterWorkspaceProps { scriptId: string; }

const ASPECT_RATIOS = [
    { value: '9:16', label: '竖屏 9:16' },
    { value: '16:9', label: '横屏 16:9' },
] as const;

const DURATIONS = [
    { value: '10', label: '10秒' },
    { value: '15', label: '15秒' },
] as const;

// 角色卡片组件
const CharacterCard: React.FC<{ character: Character; isSelected: boolean; onSelect: () => void; onDelete: () => void }> = ({ character, isSelected, onSelect, onDelete }) => {
    const isGenerating = character.status === 'generating' || character.status === 'queued';
    return (
        <div onClick={onSelect} className="group relative rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02]"
            style={{ backgroundColor: 'rgba(18,18,26,0.9)', border: '1px solid', borderColor: isSelected ? 'rgba(0,245,255,0.6)' : 'rgba(30,30,46,0.8)', boxShadow: isSelected ? '0 0 12px rgba(0,245,255,0.25)' : '0 2px 8px rgba(0,0,0,0.3)' }}>
            <div className="aspect-square relative overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                {character.thumbnailUrl || character.referenceImageUrl ? (
                    <img src={character.thumbnailUrl || character.referenceImageUrl} alt={character.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        {isGenerating ? <InlineLoading size={20} color="#bf00ff" /> : <User size={24} style={{ color: 'rgba(107,114,128,0.4)' }} />}
                    </div>
                )}
                {isGenerating && (character.thumbnailUrl || character.referenceImageUrl) && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><InlineLoading size={20} color="#bf00ff" /></div>
                )}
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="absolute top-1.5 right-1.5 p-1 rounded-md opacity-0 group-hover:opacity-100" style={{ backgroundColor: 'rgba(239,68,68,0.9)' }}>
                    <Trash2 size={10} className="text-white" />
                </button>
                {isSelected && <div className="absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: '#00f5ff' }} />}
            </div>
            <div className="px-1.5 py-1.5 text-center h-7 flex items-center justify-center">
                <span className="text-[10px] font-medium truncate" style={{ color: isSelected ? '#00f5ff' : '#d1d5db' }}>{character.name || '未命名'}</span>
            </div>
        </div>
    );
};

// 新建角色卡片
const NewCharacterCard: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <div onClick={onClick} className="rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02] group" style={{ backgroundColor: 'rgba(18,18,26,0.5)', border: '1px dashed rgba(0,245,255,0.2)' }}>
        <div className="aspect-square flex items-center justify-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(191,0,255,0.1))', border: '1px solid rgba(0,245,255,0.2)' }}>
                <Plus size={16} style={{ color: '#00f5ff' }} />
            </div>
        </div>
        <div className="px-1.5 py-1.5 text-center h-7 flex items-center justify-center"><span className="text-[10px]" style={{ color: '#6b7280' }}>新建</span></div>
    </div>
);

export const CharacterWorkspace: React.FC<CharacterWorkspaceProps> = ({ scriptId }) => {
    const { characters, isLoading, loadCharacters, addCharacter, updateCharacter, deleteCharacter, refreshCharacter } = useCharacterStore();
    const { assets, loadAssets } = useAssetStore();
    const { updateBalance } = useAuthStore();
    const { showToast, ToastContainer } = useToast();

    const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // 视频生成设置
    const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
    const [duration, setDuration] = useState<'10' | '15'>('15');
    const [promptTemplateId, setPromptTemplateId] = useState('character-default');
    const [promptTemplates, setPromptTemplates] = useState<PromptTemplateConfig[]>([]);
    const [isRatioDropdownOpen, setIsRatioDropdownOpen] = useState(false);
    const [isDurationDropdownOpen, setIsDurationDropdownOpen] = useState(false);
    const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);

    // 参考图
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    // 关联资产弹窗
    const [isAssetDialogOpen, setIsAssetDialogOpen] = useState(false);

    // 删除确认
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; characterId: string | null; characterName: string }>({ isOpen: false, characterId: null, characterName: '' });

    // 轮询
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => { if (scriptId) { loadCharacters(scriptId); loadAssets(scriptId); } }, [scriptId, loadCharacters, loadAssets]);
    useEffect(() => { getPromptTemplates('character').then((res) => { if (res.success) setPromptTemplates(res.data); }).catch(() => { }); }, []);

    useEffect(() => {
        const c = characters.find((c) => c.id === selectedCharacterId);
        if (c) { setEditName(c.name || ''); setEditDescription(c.description || ''); }
        else { setEditName(''); setEditDescription(''); }
    }, [selectedCharacterId, characters]);

    const selectedCharacter = characters.find((c) => c.id === selectedCharacterId);
    const isProcessing = selectedCharacter?.status === 'generating' || selectedCharacter?.status === 'queued' || isUploading;

    // 轮询角色状态
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

    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedCharacter || isProcessing) return;
        setIsUploading(true);
        try {
            const r = await uploadImage(file);
            if (r.success && r.url) {
                await updateCharacter(scriptId, selectedCharacter.id, { referenceImageUrl: r.url });
                showToast('参考图上传成功', 'success');
            }
        } catch { } finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
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
                prompt: editDescription.trim(),
                promptTemplateId,
                aspect_ratio: aspectRatio,
                duration,
                referenceImageUrl: selectedCharacter.referenceImageUrl,
                characterId: selectedCharacter.id,
            });
            if (response.balance !== undefined) updateBalance(response.balance);
            showToast('视频生成已开始', 'success');
        } catch (err) {
            await loadCharacters(scriptId);
            showToast(err instanceof Error ? err.message : '生成失败，请重试', 'error');
        }
    };

    const handleDeleteClick = (c: Character) => setDeleteConfirm({ isOpen: true, characterId: c.id, characterName: c.name || '未命名角色' });
    const handleConfirmDelete = async () => {
        if (deleteConfirm.characterId) {
            try { await deleteCharacter(scriptId, deleteConfirm.characterId); if (selectedCharacterId === deleteConfirm.characterId) setSelectedCharacterId(null); } catch { }
        }
        setDeleteConfirm({ isOpen: false, characterId: null, characterName: '' });
    };

    return (
        <>
            <ToastContainer />
            <ConfirmDialog isOpen={deleteConfirm.isOpen} title="删除角色" message={`确定要删除角色「${deleteConfirm.characterName}」吗？`} type="danger" confirmText="删除" cancelText="取消" onConfirm={handleConfirmDelete} onCancel={() => setDeleteConfirm({ isOpen: false, characterId: null, characterName: '' })} />

            {/* 关联资产弹窗 */}
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

            {/* 提示词模板选择弹框 */}
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
                {/* 角色池 */}
                <div className="w-[280px] flex-shrink-0 flex flex-col rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(10,10,15,0.6)', border: '1px solid #1e1e2e' }}>
                    <div className="px-3 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid #1e1e2e' }}>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.15), rgba(191,0,255,0.15))', border: '1px solid rgba(0,245,255,0.3)' }}>
                                <User size={12} style={{ color: '#00f5ff' }} />
                            </div>
                            <span className="text-xs font-medium text-white">角色池</span>
                        </div>
                        <span className="text-[10px]" style={{ color: '#6b7280' }}>{characters.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8"><InlineLoading size={18} color="#00f5ff" /></div>
                        ) : (
                            <div className="grid grid-cols-3 gap-2">
                                <NewCharacterCard onClick={handleCreateCharacter} />
                                {characters.map((c) => <CharacterCard key={c.id} character={c} isSelected={selectedCharacterId === c.id} onSelect={() => setSelectedCharacterId(c.id)} onDelete={() => handleDeleteClick(c)} />)}
                            </div>
                        )}
                    </div>
                </div>

                {/* 编辑区 + 视频预览区 */}
                {selectedCharacter ? (
                    <div className="flex-1 flex gap-4 overflow-hidden">
                        {/* 编辑区 */}
                        <div className="w-[340px] flex-shrink-0 flex flex-col gap-3 rounded-xl p-4" style={{ backgroundColor: 'rgba(10,10,15,0.6)', border: '1px solid #1e1e2e' }}>
                            <div><label className="block text-xs font-medium mb-1.5" style={{ color: '#9ca3af' }}>角色姓名</label><Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="输入角色姓名..." className="h-9 text-sm" /></div>
                            <div className="flex-1 flex flex-col min-h-0"><label className="block text-xs font-medium mb-1.5" style={{ color: '#9ca3af' }}>角色设定</label><Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="描述角色的外观、性格、动作等信息..." className="flex-1 min-h-0 resize-none text-sm" /></div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: '#9ca3af' }}>参考图（1张）</label>
                                <div className="flex gap-2">
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUploadImage} className="hidden" />
                                    {selectedCharacter.referenceImageUrl ? (
                                        <div className="relative w-20 h-20 rounded-lg overflow-hidden group">
                                            <img src={selectedCharacter.referenceImageUrl} alt="参考图" className="w-full h-full object-cover" />
                                            <button onClick={() => updateCharacter(scriptId, selectedCharacter.id, { referenceImageUrl: undefined })} className="absolute top-1 right-1 p-0.5 rounded bg-red-500/80 opacity-0 group-hover:opacity-100"><X size={10} className="text-white" /></button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-20 h-20 rounded-lg flex flex-col items-center justify-center gap-1" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px dashed rgba(0,245,255,0.3)' }}>
                                                {isUploading ? <InlineLoading size={16} color="#00f5ff" /> : <><Plus size={16} style={{ color: '#00f5ff' }} /><span className="text-[10px]" style={{ color: '#6b7280' }}>上传</span></>}
                                            </button>
                                            <button onClick={() => setIsAssetDialogOpen(true)} className="w-20 h-20 rounded-lg flex flex-col items-center justify-center gap-1" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px dashed rgba(191,0,255,0.3)' }}>
                                                <Link2 size={16} style={{ color: '#bf00ff' }} /><span className="text-[10px]" style={{ color: '#6b7280' }}>关联资产</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button onClick={handleSave} disabled={isSaving} className="w-full h-10 rounded-lg flex items-center justify-center text-sm font-medium" style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(0,212,170,0.1))', border: '1px solid rgba(0,245,255,0.3)', color: '#00f5ff', opacity: isSaving ? 0.7 : 1 }}>
                                {isSaving ? <><InlineLoading size={16} color="#00f5ff" /><span className="ml-2">保存中...</span></> : <><Save size={16} className="mr-2" />保存角色信息</>}
                            </button>
                        </div>

                        {/* 视频预览区 */}
                        <div className="flex-1 flex flex-col rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(10,10,15,0.6)', border: '1px solid #1e1e2e' }}>
                            {/* 顶部工具栏 */}
                            <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid #1e1e2e' }}>
                                <div className="flex items-center gap-2">
                                    <Play size={14} style={{ color: '#00f5ff' }} />
                                    <span className="text-sm font-medium text-white">角色视频</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* 提示词模板 */}
                                    <button onClick={() => !isProcessing && setIsTemplateDropdownOpen(true)} disabled={isProcessing} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: 'rgba(191,0,255,0.1)', border: '1px solid rgba(191,0,255,0.2)', color: '#bf00ff', opacity: isProcessing ? 0.5 : 1 }}>
                                        <span className="max-w-[80px] truncate">{promptTemplates.find(t => t.id === promptTemplateId)?.label || '选择模板'}</span><ChevronDown size={12} />
                                    </button>
                                    {/* 比例 */}
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
                                    {/* 时长 */}
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
                                    {/* 生成按钮 */}
                                    <button onClick={handleGenerateVideo} disabled={isProcessing || !editDescription.trim()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                                        style={{ background: isProcessing || !editDescription.trim() ? 'rgba(191,0,255,0.1)' : 'linear-gradient(135deg, rgba(191,0,255,0.2), rgba(255,0,255,0.2))', border: '1px solid rgba(191,0,255,0.3)', color: '#bf00ff', opacity: isProcessing || !editDescription.trim() ? 0.5 : 1 }}>
                                        {isProcessing ? <><Loader2 size={12} className="animate-spin" />生成中...</> : <><Sparkles size={12} />生成视频（<img src={CoinIcon} alt="" className="w-4 h-4 inline" />3）</>}
                                    </button>
                                </div>
                            </div>

                            {/* 视频播放区 */}
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 flex items-center justify-center p-4 overflow-auto relative">
                                    {isProcessing ? (
                                        <div className="text-center">
                                            <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, rgba(191,0,255,0.1), rgba(255,0,255,0.1))', border: '1px solid rgba(191,0,255,0.3)', boxShadow: '0 0 30px rgba(191,0,255,0.2)' }}>
                                                <Loader2 size={40} className="animate-spin" style={{ color: '#bf00ff' }} />
                                            </div>
                                            <p className="text-sm font-medium" style={{ color: '#bf00ff' }}>视频生成中...</p>
                                            <p className="text-xs mt-1" style={{ color: '#6b7280' }}>进度: {selectedCharacter.progress || '0'}%</p>
                                        </div>
                                    ) : selectedCharacter.videoUrl ? (
                                        <video
                                            src={selectedCharacter.videoUrl}
                                            controls
                                            className="max-w-full max-h-full object-contain rounded-lg"
                                            poster={selectedCharacter.thumbnailUrl}
                                            style={{ boxShadow: '0 0 30px rgba(0,245,255,0.15)' }}
                                        />
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
                            </div>
                        </div>
                    </div>
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
        </>
    );
};
