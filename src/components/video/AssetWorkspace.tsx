import React, { useState, useEffect, useRef } from 'react';
import { Package, Sparkles, Plus, Trash2, Image as ImageIcon, Download, Upload, Save, ChevronDown, Edit3, X } from 'lucide-react';
import { ReferenceImageUploader } from '@/components/ui/ReferenceImageUploader';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Loading, InlineLoading } from '@/components/ui/Loading';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAssetStore } from '@/stores/assetStore';
import { useAuthStore } from '@/stores/authStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { generateAssetDesign, editImage } from '@/services/assetApi';
import { uploadImage } from '@/services/api';
import { Asset } from '@/types/asset';
import CoinIcon from '@/img/coin.webp';

interface AssetWorkspaceProps { scriptId: string; }

const IMAGE_MODELS = [
    { value: 'nano-banana-2', label: 'Nano Banana 2' },
    { value: 'doubao-seedream-3-0-t2i-250415', label: '豆包' },
] as const;
type ImageModel = typeof IMAGE_MODELS[number]['value'];

const ASPECT_RATIOS = [
    { value: '1:1', label: '1:1 方形' },
    { value: '4:3', label: '4:3 标准' },
    { value: '16:9', label: '16:9 横版' },
] as const;
type AspectRatio = typeof ASPECT_RATIOS[number]['value'];

const AssetCard: React.FC<{ asset: Asset; isSelected: boolean; onSelect: () => void; onDelete: () => void }> = ({ asset, isSelected, onSelect, onDelete }) => {
    const isGenerating = asset.status === 'generating';
    return (
        <div onClick={onSelect} className="group relative rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02]"
            style={{ backgroundColor: 'rgba(18,18,26,0.9)', border: '1px solid', borderColor: isSelected ? 'rgba(0,245,255,0.6)' : 'rgba(30,30,46,0.8)', boxShadow: isSelected ? '0 0 12px rgba(0,245,255,0.25)' : '0 2px 8px rgba(0,0,0,0.3)' }}>
            <div className="aspect-square relative overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                {asset.thumbnailUrl ? <img src={asset.thumbnailUrl} alt={asset.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">{isGenerating ? <InlineLoading size={20} color="#bf00ff" /> : <Package size={24} style={{ color: 'rgba(107,114,128,0.4)' }} />}</div>}
                {isGenerating && asset.thumbnailUrl && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><InlineLoading size={20} color="#bf00ff" /></div>}
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="absolute top-1.5 right-1.5 p-1 rounded-md opacity-0 group-hover:opacity-100" style={{ backgroundColor: 'rgba(239,68,68,0.9)' }}><Trash2 size={10} className="text-white" /></button>
                {isSelected && <div className="absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: '#00f5ff' }} />}
            </div>
            <div className="px-1.5 py-1.5 text-center h-7 flex items-center justify-center"><span className="text-[10px] font-medium truncate" style={{ color: isSelected ? '#00f5ff' : '#d1d5db' }}>{asset.name || '未命名'}</span></div>
        </div>
    );
};

const NewAssetCard: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <div onClick={onClick} className="rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02] group" style={{ backgroundColor: 'rgba(18,18,26,0.5)', border: '1px dashed rgba(0,245,255,0.2)' }}>
        <div className="aspect-square flex items-center justify-center"><div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(191,0,255,0.1))', border: '1px solid rgba(0,245,255,0.2)' }}><Plus size={16} style={{ color: '#00f5ff' }} /></div></div>
        <div className="px-1.5 py-1.5 text-center h-7 flex items-center justify-center"><span className="text-[10px]" style={{ color: '#6b7280' }}>新建</span></div>
    </div>
);

export const AssetWorkspace: React.FC<AssetWorkspaceProps> = ({ scriptId }) => {
    const { assets, isLoading, loadAssets, addAsset, updateAsset, deleteAsset } = useAssetStore();
    const { updateBalance } = useAuthStore();
    const { showToast, ToastContainer } = useToast();
    const assetPrefs = usePreferencesStore((s) => s.asset);
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
    const [editDescription, setEditDescription] = useState('');
    const [editName, setEditName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedModel, setSelectedModel] = useState<ImageModel>(assetPrefs.model as ImageModel);
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
    const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>(assetPrefs.aspectRatio as AspectRatio);
    const [isRatioDropdownOpen, setIsRatioDropdownOpen] = useState(false);
    const [selectedImageSize, setSelectedImageSize] = useState<'1K' | '2K'>(assetPrefs.imageSize);
    const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; assetId: string | null; assetName: string }>({ isOpen: false, assetId: null, assetName: '' });
    // 编辑弹框状态
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editPrompt, setEditPrompt] = useState('');
    const [editModel, setEditModel] = useState<ImageModel>(assetPrefs.model as ImageModel);
    const [isEditModelDropdownOpen, setIsEditModelDropdownOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => { if (scriptId) loadAssets(scriptId); }, [scriptId, loadAssets]);
    useEffect(() => { const s = assets.find((a) => a.id === selectedAssetId); if (s) { setEditDescription(s.description || ''); setEditName(s.name || ''); } else { setEditDescription(''); setEditName(''); } }, [selectedAssetId, assets]);

    const selectedAsset = assets.find((a) => a.id === selectedAssetId);
    const isProcessing = selectedAsset?.status === 'generating' || isUploading;
    const hasDesignImage = !!selectedAsset?.designImageUrl;

    const handleCreateAsset = async () => { try { const id = await addAsset(scriptId, '新资产', ''); setSelectedAssetId(id); } catch { } };

    const handleGenerateDesign = async () => {
        if (!selectedAsset || !editDescription.trim() || isProcessing) return;
        const tokenCost = selectedModel === 'nano-banana-2' ? 4 : 2;
        updateBalance((prev) => prev - tokenCost);
        await updateAsset(scriptId, selectedAsset.id, { status: 'generating' });
        try {
            const response = await generateAssetDesign(selectedAsset.id, scriptId, editDescription.trim(), selectedModel, selectedAsset.referenceImageUrls || [], selectedAspectRatio, selectedImageSize);
            await loadAssets(scriptId);
            if (response.balance !== undefined) updateBalance(response.balance);
            showToast(response.success ? '设计稿生成成功' : '生成失败，代币已返还', response.success ? 'success' : 'error');
        } catch { await loadAssets(scriptId); showToast('生成失败，请重试', 'error'); }
    };

    const handleSave = async () => { if (!selectedAsset || isSaving) return; setIsSaving(true); try { await updateAsset(scriptId, selectedAsset.id, { name: editName.trim() || '未命名资产', description: editDescription.trim() }); showToast('保存成功', 'success'); } catch { } finally { setIsSaving(false); } };

    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file || !selectedAsset || isProcessing) return;
        setIsUploading(true);
        try { const r = await uploadImage(file); if (r.success && r.url) { await updateAsset(scriptId, selectedAsset.id, { designImageUrl: r.url, thumbnailUrl: r.url, status: 'completed' }); showToast('图片上传成功', 'success'); } } catch { }
        finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };

    const handleRefImagesChange = async (urls: string[]) => {
        if (!selectedAsset) return;
        await updateAsset(scriptId, selectedAsset.id, { referenceImageUrls: urls });
    };

    const handleDeleteClick = (a: Asset) => setDeleteConfirm({ isOpen: true, assetId: a.id, assetName: a.name || '未命名资产' });
    const handleConfirmDelete = async () => { if (deleteConfirm.assetId) { try { await deleteAsset(scriptId, deleteConfirm.assetId); if (selectedAssetId === deleteConfirm.assetId) setSelectedAssetId(null); } catch { } } setDeleteConfirm({ isOpen: false, assetId: null, assetName: '' }); };

    // 打开编辑弹框
    const handleOpenEditModal = () => {
        if (!selectedAsset?.designImageUrl) return;
        setEditPrompt('');
        setEditModel('nano-banana-2');
        setIsEditModalOpen(true);
    };

    // 提交编辑
    const handleSubmitEdit = async () => {
        if (!selectedAsset?.designImageUrl || !editPrompt.trim() || isEditing) return;

        setIsEditing(true);
        const tokenCost = editModel === 'nano-banana-2' ? 4 : 2;
        updateBalance((prev) => prev - tokenCost);

        try {
            // 先获取图片文件
            const response = await fetch(selectedAsset.designImageUrl);
            const blob = await response.blob();
            const file = new File([blob], 'image.png', { type: blob.type });

            // 调用编辑接口
            const result = await editImage(file, editPrompt.trim(), editModel);

            if (result.success && result.images?.[0]?.url) {
                // 更新资产的设计稿
                await updateAsset(scriptId, selectedAsset.id, {
                    designImageUrl: result.images[0].url,
                    thumbnailUrl: result.images[0].url,
                });
                showToast('编辑成功', 'success');
                setIsEditModalOpen(false);
            } else {
                showToast('编辑失败，代币已返还', 'error');
            }

            if (result.balance !== undefined) {
                updateBalance(result.balance);
            }
        } catch (error) {
            showToast('编辑失败，请重试', 'error');
        } finally {
            setIsEditing(false);
        }
    };

    return (
        <>
            <ToastContainer />
            <ConfirmDialog isOpen={deleteConfirm.isOpen} title="删除资产" message={`确定要删除资产「${deleteConfirm.assetName}」吗？`} type="danger" confirmText="删除" cancelText="取消" onConfirm={handleConfirmDelete} onCancel={() => setDeleteConfirm({ isOpen: false, assetId: null, assetName: '' })} />

            {/* 编辑设计稿弹框 */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                    <div className="w-[480px] rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(18,18,26,0.98)', border: '1px solid rgba(191,0,255,0.3)', boxShadow: '0 0 40px rgba(191,0,255,0.2)' }}>
                        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1e1e2e' }}>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(191,0,255,0.15), rgba(255,0,255,0.15))', border: '1px solid rgba(191,0,255,0.3)' }}>
                                    <Edit3 size={16} style={{ color: '#bf00ff' }} />
                                </div>
                                <span className="text-sm font-medium text-white">编辑设计稿</span>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                                <X size={18} style={{ color: '#6b7280' }} />
                            </button>
                        </div>
                        <div className="p-5 flex flex-col gap-4">
                            {/* 当前图片预览 */}
                            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(30,30,46,0.8)' }}>
                                <img src={selectedAsset?.designImageUrl} alt="当前设计稿" className="w-16 h-16 object-cover rounded-lg" />
                                <div className="flex-1">
                                    <p className="text-xs text-white mb-1">当前设计稿</p>
                                    <p className="text-[10px]" style={{ color: '#6b7280' }}>编辑后将生成新图覆盖当前图片</p>
                                </div>
                            </div>

                            {/* 编辑提示词 */}
                            <div>
                                <label className="block text-xs font-medium mb-2" style={{ color: '#9ca3af' }}>编辑脚本</label>
                                <Textarea
                                    value={editPrompt}
                                    onChange={(e) => setEditPrompt(e.target.value)}
                                    placeholder="描述你想要对图片进行的修改，例如：将背景改为夜晚、添加一个帽子、改变服装颜色..."
                                    className="h-28 resize-none text-sm"
                                />
                            </div>

                            {/* 模型选择 */}
                            <div>
                                <label className="block text-xs font-medium mb-2" style={{ color: '#9ca3af' }}>选择模型</label>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsEditModelDropdownOpen(!isEditModelDropdownOpen)}
                                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm"
                                        style={{ backgroundColor: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.2)', color: '#00f5ff' }}
                                    >
                                        <span>{IMAGE_MODELS.find(m => m.value === editModel)?.label}</span>
                                        <ChevronDown size={14} />
                                    </button>
                                    {isEditModelDropdownOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setIsEditModelDropdownOpen(false)} />
                                            <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-lg overflow-hidden" style={{ backgroundColor: 'rgba(18,18,26,0.98)', border: '1px solid rgba(0,245,255,0.2)' }}>
                                                {IMAGE_MODELS.map((m) => (
                                                    <button
                                                        key={m.value}
                                                        onClick={() => { setEditModel(m.value); setIsEditModelDropdownOpen(false); }}
                                                        className="w-full px-3 py-2 text-sm text-left"
                                                        style={{ color: editModel === m.value ? '#00f5ff' : '#d1d5db', backgroundColor: editModel === m.value ? 'rgba(0,245,255,0.1)' : 'transparent' }}
                                                    >
                                                        {m.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="px-5 py-4 flex items-center justify-end gap-3" style={{ borderTop: '1px solid #1e1e2e' }}>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                disabled={isEditing}
                                className="px-4 py-2 rounded-lg text-sm"
                                style={{ backgroundColor: 'rgba(107,114,128,0.15)', border: '1px solid rgba(107,114,128,0.3)', color: '#9ca3af' }}
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSubmitEdit}
                                disabled={isEditing || !editPrompt.trim()}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                                style={{
                                    background: isEditing || !editPrompt.trim() ? 'rgba(191,0,255,0.1)' : 'linear-gradient(135deg, rgba(191,0,255,0.3), rgba(255,0,255,0.3))',
                                    border: '1px solid rgba(191,0,255,0.4)',
                                    color: '#bf00ff',
                                    opacity: isEditing || !editPrompt.trim() ? 0.5 : 1
                                }}
                            >
                                {isEditing ? (
                                    <>
                                        <InlineLoading size={14} color="#bf00ff" />
                                        <span>编辑中...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={14} />
                                        <span>提交编辑</span>
                                        <span className="flex items-center">（<img src={CoinIcon} alt="" className="w-4 h-4" />{editModel === 'nano-banana-2' ? 4 : 2}）</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 flex gap-3 overflow-hidden">
                {/* 左侧：资产池 */}
                <div className="w-[280px] flex-shrink-0 flex flex-col rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(10,10,15,0.6)', border: '1px solid #1e1e2e' }}>
                    <div className="px-3 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid #1e1e2e' }}>
                        <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.15), rgba(191,0,255,0.15))', border: '1px solid rgba(0,245,255,0.3)' }}><Package size={12} style={{ color: '#00f5ff' }} /></div><span className="text-xs font-medium text-white">资产池</span></div>
                        <span className="text-[10px]" style={{ color: '#6b7280' }}>{assets.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                        {isLoading ? <div className="flex items-center justify-center py-8"><InlineLoading size={18} color="#00f5ff" /></div> : (
                            <div className="grid grid-cols-3 gap-2">
                                <NewAssetCard onClick={handleCreateAsset} />
                                {assets.map((a) => <AssetCard key={a.id} asset={a} isSelected={selectedAssetId === a.id} onSelect={() => setSelectedAssetId(a.id)} onDelete={() => handleDeleteClick(a)} />)}
                            </div>
                        )}
                    </div>
                </div>

                {/* 右侧：设计稿预览区 */}
                <div className="flex-1 flex flex-col rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(10,10,15,0.6)', border: '1px solid #1e1e2e' }}>
                    <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid #1e1e2e' }}>
                        <div className="flex items-center gap-2"><ImageIcon size={14} style={{ color: '#00f5ff' }} /><span className="text-sm font-medium text-white">资产设计稿</span></div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <button onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)} disabled={isProcessing} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.2)', color: '#00f5ff', opacity: isProcessing ? 0.5 : 1 }}><span>{IMAGE_MODELS.find(m => m.value === selectedModel)?.label}</span><ChevronDown size={12} /></button>
                                {isModelDropdownOpen && <><div className="fixed inset-0 z-10" onClick={() => setIsModelDropdownOpen(false)} /><div className="absolute right-0 top-full mt-1 z-20 rounded-lg overflow-hidden" style={{ backgroundColor: 'rgba(18,18,26,0.98)', border: '1px solid rgba(0,245,255,0.2)' }}>{IMAGE_MODELS.map((m) => <button key={m.value} onClick={() => { setSelectedModel(m.value); setIsModelDropdownOpen(false); }} className="w-full px-3 py-1.5 text-xs text-left whitespace-nowrap" style={{ color: selectedModel === m.value ? '#00f5ff' : '#d1d5db', backgroundColor: selectedModel === m.value ? 'rgba(0,245,255,0.1)' : 'transparent' }}>{m.label}</button>)}</div></>}
                            </div>
                            <div className="relative">
                                <button onClick={() => setIsRatioDropdownOpen(!isRatioDropdownOpen)} disabled={isProcessing} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: 'rgba(77,124,255,0.1)', border: '1px solid rgba(77,124,255,0.2)', color: '#4d7cff', opacity: isProcessing ? 0.5 : 1 }}><span>{selectedAspectRatio}</span><ChevronDown size={12} /></button>
                                {isRatioDropdownOpen && <><div className="fixed inset-0 z-10" onClick={() => setIsRatioDropdownOpen(false)} /><div className="absolute right-0 top-full mt-1 z-20 rounded-lg overflow-hidden min-w-[100px]" style={{ backgroundColor: 'rgba(18,18,26,0.98)', border: '1px solid rgba(77,124,255,0.2)' }}>{ASPECT_RATIOS.map((r) => <button key={r.value} onClick={() => { setSelectedAspectRatio(r.value); setIsRatioDropdownOpen(false); }} className="w-full px-3 py-1.5 text-xs text-left whitespace-nowrap" style={{ color: selectedAspectRatio === r.value ? '#4d7cff' : '#d1d5db', backgroundColor: selectedAspectRatio === r.value ? 'rgba(77,124,255,0.1)' : 'transparent' }}>{r.label}</button>)}</div></>}
                            </div>
                            <div className="relative">
                                <button onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)} disabled={isProcessing} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e', opacity: isProcessing ? 0.5 : 1 }}><span>{selectedImageSize}</span><ChevronDown size={12} /></button>
                                {isSizeDropdownOpen && <><div className="fixed inset-0 z-10" onClick={() => setIsSizeDropdownOpen(false)} /><div className="absolute right-0 top-full mt-1 z-20 rounded-lg overflow-hidden min-w-[100px]" style={{ backgroundColor: 'rgba(18,18,26,0.98)', border: '1px solid rgba(34,197,94,0.2)' }}>{[{ value: '1K', label: '1K 标清' }, { value: '2K', label: '2K 高清' }].map((s) => <button key={s.value} onClick={() => { setSelectedImageSize(s.value as '1K' | '2K'); setIsSizeDropdownOpen(false); }} className="w-full px-3 py-1.5 text-xs text-left whitespace-nowrap" style={{ color: selectedImageSize === s.value ? '#22c55e' : '#d1d5db', backgroundColor: selectedImageSize === s.value ? 'rgba(34,197,94,0.1)' : 'transparent' }}>{s.label}</button>)}</div></>}
                            </div>
                            <button onClick={handleGenerateDesign} disabled={isProcessing || !selectedAsset || !editDescription.trim()} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs" style={{ background: isProcessing || !selectedAsset || !editDescription.trim() ? 'rgba(191,0,255,0.1)' : 'linear-gradient(135deg, rgba(191,0,255,0.2), rgba(255,0,255,0.2))', border: '1px solid rgba(191,0,255,0.3)', color: '#bf00ff', opacity: isProcessing || !selectedAsset || !editDescription.trim() ? 0.5 : 1 }}><Sparkles size={12} />生成（<img src={CoinIcon} alt="" className="w-4 h-4 inline" />{selectedModel === 'nano-banana-2' ? 4 : 2}）</button>
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {selectedAsset ? (
                            <>
                                {/* 左边：设计稿预览 */}
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    <div className="flex-1 flex items-center justify-center p-4 overflow-auto relative">
                                        {isProcessing && <Loading overlay size={28} color="#bf00ff" text={isUploading ? '正在上传...' : '正在生成设计稿...'} />}
                                        {selectedAsset.designImageUrl ? <img src={selectedAsset.designImageUrl} alt="设计稿" className="max-w-full max-h-full object-contain rounded-lg" style={{ boxShadow: '0 0 30px rgba(0,245,255,0.1)' }} /> : <div className="flex flex-col items-center gap-3 text-center"><div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.05), rgba(191,0,255,0.05))', border: '1px solid rgba(0,245,255,0.1)' }}><ImageIcon size={32} style={{ color: 'rgba(0,245,255,0.3)' }} /></div><p className="text-sm" style={{ color: '#6b7280' }}>填写资产描述后点击"生成"</p><p className="text-xs" style={{ color: '#4b5563' }}>或上传已有设计稿</p></div>}
                                    </div>
                                    {/* 底部工具栏 */}
                                    <div className="px-4 py-3 flex items-center justify-center gap-3">
                                        <button onClick={() => !isProcessing && fileInputRef.current?.click()} disabled={isProcessing} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: 'rgba(107,114,128,0.15)', border: '1px solid rgba(107,114,128,0.3)', color: '#9ca3af', opacity: isProcessing ? 0.5 : 1 }} title="上传图片">
                                            <Upload size={14} />上传
                                        </button>
                                        {hasDesignImage && !isProcessing ? (
                                            <button onClick={async () => {
                                                try {
                                                    const response = await fetch(selectedAsset.designImageUrl!);
                                                    if (!response.ok) throw new Error('下载失败');
                                                    const blob = await response.blob();
                                                    const blobUrl = URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = blobUrl;
                                                    a.download = `${selectedAsset.name || 'asset'}.png`;
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    document.body.removeChild(a);
                                                    URL.revokeObjectURL(blobUrl);
                                                } catch (error) {
                                                    console.error('下载图片失败:', error);
                                                    alert('下载失败，请重试');
                                                }
                                            }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)', color: '#00f5ff' }} title="下载图片">
                                                <Download size={14} />下载
                                            </button>
                                        ) : (
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: 'rgba(107,114,128,0.1)', border: '1px solid rgba(107,114,128,0.2)', color: '#6b7280', opacity: 0.5 }} title="下载图片">
                                                <Download size={14} />下载
                                            </span>
                                        )}
                                        {hasDesignImage && !isProcessing && (
                                            <button onClick={handleOpenEditModal} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ background: 'linear-gradient(135deg, rgba(191,0,255,0.15), rgba(255,0,255,0.15))', border: '1px solid rgba(191,0,255,0.3)', color: '#bf00ff' }} title="编辑设计稿">
                                                <Edit3 size={14} />编辑
                                            </button>
                                        )}
                                    </div>
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUploadImage} className="hidden" />
                                </div>

                                {/* 右边：编辑器 */}
                                <div className="w-[280px] flex-shrink-0 flex flex-col gap-3 p-3 overflow-y-auto" style={{ borderLeft: '1px solid #1e1e2e' }}>
                                    <div><label className="block text-xs font-medium mb-1.5" style={{ color: '#9ca3af' }}>资产名称</label><Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="输入资产名称..." className="h-9 text-sm" /></div>
                                    <div className="flex-1 flex flex-col min-h-[120px]"><label className="block text-xs font-medium mb-1.5" style={{ color: '#9ca3af' }}>资产描述</label><Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="描述资产的外观、风格、细节等信息..." className="flex-1 min-h-0 resize-none text-sm" /></div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1.5" style={{ color: '#9ca3af' }}>参考图（最多5张）</label>
                                        <ReferenceImageUploader
                                            images={selectedAsset.referenceImageUrls || []}
                                            onChange={handleRefImagesChange}
                                            maxCount={5}
                                            maxSizeMB={10}
                                            imageSize="md"
                                            hint="单张不超过10MB"
                                            onError={(msg) => showToast(msg, 'error')}
                                        />
                                    </div>
                                    <button onClick={handleSave} disabled={isSaving} className="w-full h-9 rounded-lg flex items-center justify-center text-xs font-medium" style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(0,212,170,0.1))', border: '1px solid rgba(0,245,255,0.3)', color: '#00f5ff', opacity: isSaving ? 0.7 : 1 }}>
                                        {isSaving ? <><InlineLoading size={14} color="#00f5ff" /><span className="ml-2">保存中...</span></> : <><Save size={14} className="mr-2" />保存</>}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <div className="relative mb-6"><div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(191,0,255,0.1))', border: '1px solid rgba(0,245,255,0.2)' }}><Package size={36} style={{ color: 'rgba(0,245,255,0.5)' }} /></div><div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ff00ff, #bf00ff)' }}><Sparkles size={12} className="text-white" /></div></div>
                                <h3 className="text-lg font-semibold text-white mb-2">选择或创建资产</h3>
                                <p className="text-sm max-w-md mb-4" style={{ color: '#6b7280' }}>从左侧资产池选择一个资产进行编辑，或点击"新建"创建新资产</p>
                                <Button onClick={handleCreateAsset} className="h-10 px-6" style={{ background: 'linear-gradient(135deg, #00f5ff, #00d4aa)' }}><Plus size={16} className="mr-2" />新建资产</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
