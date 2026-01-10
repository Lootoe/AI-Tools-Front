import React, { useState, useEffect, useRef } from 'react';
import { Package, Sparkles, Plus, Trash2, Wand2, Image as ImageIcon, Download, Upload, Save, ChevronDown, X, ImagePlus, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Loading, InlineLoading } from '@/components/ui/Loading';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAssetStore } from '@/stores/assetStore';
import { useAuthStore } from '@/stores/authStore';
import { generateAssetDesign, editImage } from '@/services/assetApi';
import { uploadImage } from '@/services/api';
import { Asset, PromptTemplateType, PROMPT_TEMPLATES } from '@/types/asset';
import CoinIcon from '@/img/coin.png';

interface AssetWorkspaceProps { scriptId: string; }

const IMAGE_MODELS = [
    { value: 'nano-banana-2', label: 'Nano Banana 2' },
    { value: 'doubao-seedream-3-0-t2i-250415', label: '豆包' },
] as const;
type ImageModel = typeof IMAGE_MODELS[number]['value'];

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
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
    const [editDescription, setEditDescription] = useState('');
    const [editName, setEditName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [selectedPromptTemplate, setSelectedPromptTemplate] = useState<PromptTemplateType>('none');
    const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const refImageInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isUploadingRef, setIsUploadingRef] = useState(false);
    const [selectedModel, setSelectedModel] = useState<ImageModel>('nano-banana-2');
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; assetId: string | null; assetName: string }>({ isOpen: false, assetId: null, assetName: '' });
    // 编辑弹框状态
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editPrompt, setEditPrompt] = useState('');
    const [editModel, setEditModel] = useState<ImageModel>('nano-banana-2');
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
            const response = await generateAssetDesign(selectedAsset.id, scriptId, editDescription.trim(), selectedPromptTemplate, selectedModel, selectedAsset.referenceImageUrls || []);
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

    const handleUploadRefImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files; if (!files || !selectedAsset) return;
        setIsUploadingRef(true);
        try { const urls: string[] = []; for (const f of Array.from(files)) { const r = await uploadImage(f); if (r.success && r.url) urls.push(r.url); } if (urls.length) { await updateAsset(scriptId, selectedAsset.id, { referenceImageUrls: [...(selectedAsset.referenceImageUrls || []), ...urls] }); showToast(`上传 ${urls.length} 张参考图`, 'success'); } } catch { }
        finally { setIsUploadingRef(false); if (refImageInputRef.current) refImageInputRef.current.value = ''; }
    };

    const handleDeleteRefImage = async (i: number) => { if (!selectedAsset) return; await updateAsset(scriptId, selectedAsset.id, { referenceImageUrls: (selectedAsset.referenceImageUrls || []).filter((_, idx) => idx !== i) }); showToast('参考图已删除', 'success'); };
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
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                    {selectedAsset ? (
                        <>
                            <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(191,0,255,0.15), rgba(255,0,255,0.15))', border: '1px solid rgba(191,0,255,0.3)' }}><Wand2 size={14} style={{ color: '#bf00ff' }} /></div><span className="text-sm font-medium text-white">资产编辑器</span></div>
                            <div className="flex-1 flex gap-4 overflow-hidden">
                                <div className="w-[340px] flex-shrink-0 flex flex-col gap-3 rounded-xl p-4" style={{ backgroundColor: 'rgba(10,10,15,0.6)', border: '1px solid #1e1e2e' }}>
                                    <div><label className="block text-xs font-medium mb-1.5" style={{ color: '#9ca3af' }}>资产名称</label><Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="输入资产名称..." className="h-9 text-sm" /></div>
                                    <div className="flex-1 flex flex-col min-h-0"><label className="block text-xs font-medium mb-1.5" style={{ color: '#9ca3af' }}>资产描述</label><Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="描述资产的外观、风格、细节等信息..." className="flex-1 min-h-0 resize-none text-sm" /></div>
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5"><label className="text-xs font-medium" style={{ color: '#9ca3af' }}>参考图</label><button onClick={() => !isUploadingRef && refImageInputRef.current?.click()} disabled={isUploadingRef} className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs" style={{ backgroundColor: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.2)', color: '#00f5ff', opacity: isUploadingRef ? 0.5 : 1 }}><ImagePlus size={14} />{isUploadingRef ? '上传中...' : '添加参考图'}</button><input ref={refImageInputRef} type="file" accept="image/*" multiple onChange={handleUploadRefImage} className="hidden" /></div>
                                        <div className="flex flex-wrap gap-1.5 p-2 rounded-lg min-h-[60px]" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(30,30,46,0.8)' }}>
                                            {!(selectedAsset.referenceImageUrls?.length) ? <div className="w-full flex items-center justify-center text-xs" style={{ color: '#4b5563' }}>点击上方按钮上传参考图</div> : selectedAsset.referenceImageUrls.map((url, i) => (
                                                <div key={i} className="relative group w-12 h-12 rounded overflow-hidden" style={{ border: '1px solid rgba(30,30,46,0.8)' }}><img src={url} alt="" className="w-full h-full object-cover" /><button onClick={() => handleDeleteRefImage(i)} className="absolute top-0.5 right-0.5 p-0.5 rounded opacity-0 group-hover:opacity-100" style={{ backgroundColor: 'rgba(239,68,68,0.9)' }}><X size={8} className="text-white" /></button></div>
                                            ))}
                                        </div>
                                    </div>
                                    <button onClick={handleSave} disabled={isSaving} className="w-full h-10 rounded-lg flex items-center justify-center text-sm font-medium" style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(0,212,170,0.1))', border: '1px solid rgba(0,245,255,0.3)', color: '#00f5ff', opacity: isSaving ? 0.7 : 1 }}>{isSaving ? <><InlineLoading size={16} color="#00f5ff" /><span className="ml-2">保存中...</span></> : <><Save size={16} className="mr-2" />保存资产信息</>}</button>
                                </div>

                                <div className="flex-1 flex flex-col rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(10,10,15,0.6)', border: '1px solid #1e1e2e' }}>
                                    <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid #1e1e2e' }}>
                                        <div className="flex items-center gap-2"><ImageIcon size={14} style={{ color: '#00f5ff' }} /><span className="text-sm font-medium text-white">资产设计稿</span></div>
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <button onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)} disabled={isProcessing} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: 'rgba(191,0,255,0.1)', border: '1px solid rgba(191,0,255,0.2)', color: '#bf00ff', opacity: isProcessing ? 0.5 : 1 }}><span>{PROMPT_TEMPLATES.find(t => t.type === selectedPromptTemplate)?.label}</span><ChevronDown size={12} /></button>
                                                {isTemplateDropdownOpen && <><div className="fixed inset-0 z-10" onClick={() => setIsTemplateDropdownOpen(false)} /><div className="absolute right-0 top-full mt-1 z-20 rounded-lg overflow-hidden min-w-[160px]" style={{ backgroundColor: 'rgba(18,18,26,0.98)', border: '1px solid rgba(191,0,255,0.2)' }}>{PROMPT_TEMPLATES.map((t) => <button key={t.type} onClick={() => { setSelectedPromptTemplate(t.type); setIsTemplateDropdownOpen(false); }} className="w-full px-3 py-1.5 text-xs text-left" style={{ color: selectedPromptTemplate === t.type ? '#bf00ff' : '#d1d5db', backgroundColor: selectedPromptTemplate === t.type ? 'rgba(191,0,255,0.1)' : 'transparent' }}>{t.label}</button>)}</div></>}
                                            </div>
                                            <div className="relative">
                                                <button onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)} disabled={isProcessing} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.2)', color: '#00f5ff', opacity: isProcessing ? 0.5 : 1 }}><span>{IMAGE_MODELS.find(m => m.value === selectedModel)?.label}</span><ChevronDown size={12} /></button>
                                                {isModelDropdownOpen && <><div className="fixed inset-0 z-10" onClick={() => setIsModelDropdownOpen(false)} /><div className="absolute right-0 top-full mt-1 z-20 rounded-lg overflow-hidden" style={{ backgroundColor: 'rgba(18,18,26,0.98)', border: '1px solid rgba(0,245,255,0.2)' }}>{IMAGE_MODELS.map((m) => <button key={m.value} onClick={() => { setSelectedModel(m.value); setIsModelDropdownOpen(false); }} className="w-full px-3 py-1.5 text-xs text-left whitespace-nowrap" style={{ color: selectedModel === m.value ? '#00f5ff' : '#d1d5db', backgroundColor: selectedModel === m.value ? 'rgba(0,245,255,0.1)' : 'transparent' }}>{m.label}</button>)}</div></>}
                                            </div>
                                            <button onClick={handleGenerateDesign} disabled={isProcessing || !editDescription.trim()} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs" style={{ background: isProcessing || !editDescription.trim() ? 'rgba(191,0,255,0.1)' : 'linear-gradient(135deg, rgba(191,0,255,0.2), rgba(255,0,255,0.2))', border: '1px solid rgba(191,0,255,0.3)', color: '#bf00ff', opacity: isProcessing || !editDescription.trim() ? 0.5 : 1 }}><Sparkles size={12} />生成（<img src={CoinIcon} alt="" className="w-4 h-4 inline" />{selectedModel === 'nano-banana-2' ? 4 : 2}）</button>
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col overflow-hidden">
                                        <div className="flex-1 flex items-center justify-center p-4 overflow-auto relative">
                                            {isProcessing && <Loading overlay size={28} color="#bf00ff" text={isUploading ? '正在上传...' : '正在生成设计稿...'} />}
                                            {selectedAsset.designImageUrl ? <img src={selectedAsset.designImageUrl} alt="设计稿" className="max-w-full max-h-full object-contain rounded-lg" style={{ boxShadow: '0 0 30px rgba(0,245,255,0.1)' }} /> : <div className="flex flex-col items-center gap-3 text-center"><div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.05), rgba(191,0,255,0.05))', border: '1px solid rgba(0,245,255,0.1)' }}><ImageIcon size={32} style={{ color: 'rgba(0,245,255,0.3)' }} /></div><p className="text-sm" style={{ color: '#6b7280' }}>点击下方"生成"或"上传"添加资产设计稿</p></div>}
                                        </div>
                                        {/* 底部工具栏 */}
                                        <div className="px-4 py-3 flex items-center justify-center gap-3">
                                            <button onClick={() => !isProcessing && fileInputRef.current?.click()} disabled={isProcessing} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: 'rgba(107,114,128,0.15)', border: '1px solid rgba(107,114,128,0.3)', color: '#9ca3af', opacity: isProcessing ? 0.5 : 1 }} title="上传图片">
                                                <Upload size={14} />上传
                                            </button>
                                            {hasDesignImage && !isProcessing ? (
                                                <a href={selectedAsset.designImageUrl} download className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)', color: '#00f5ff' }} title="下载图片">
                                                    <Download size={14} />下载
                                                </a>
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
                                </div>
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
        </>
    );
};
