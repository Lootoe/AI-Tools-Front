import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Zap, Film } from 'lucide-react';
import { useVideoStore } from '@/stores/videoStore';
import { CyberAssetSidebar } from '@/components/video/CyberAssetSidebar';
import { EpisodeWorkspace } from '@/components/video/EpisodeWorkspace';
import { CharacterWorkspace } from '@/components/video/CharacterWorkspace';
import { SceneWorkspace } from '@/components/video/SceneWorkspace';
import { PropsWorkspace } from '@/components/video/PropsWorkspace';

export const ScriptEditorPage: React.FC = () => {
  const { scriptId } = useParams<{ scriptId: string }>();
  const navigate = useNavigate();
  const {
    scripts,
    loadScripts,
    selectScript,
    isLoading,
    currentAssetTab,
    setAssetTab,
  } = useVideoStore();

  useEffect(() => {
    if (scripts.length === 0) {
      loadScripts();
    }
  }, [scripts.length, loadScripts]);

  useEffect(() => {
    if (scriptId && scripts.length > 0) {
      const scriptExists = scripts.some((s) => s.id === scriptId);
      if (scriptExists) {
        selectScript(scriptId);
      } else {
        navigate('/video');
      }
    }
  }, [scriptId, scripts, selectScript, navigate]);

  const script = scripts.find((s) => s.id === scriptId);

  const renderWorkspace = () => {
    if (!script) return null;

    switch (currentAssetTab) {
      case 'storyboard':
        return <EpisodeWorkspace scriptId={script.id} />;
      case 'character':
        return <CharacterWorkspace scriptId={script.id} />;
      case 'scene':
        return <SceneWorkspace scriptId={script.id} />;
      case 'props':
        return <PropsWorkspace scriptId={script.id} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="flex items-center gap-3" style={{ color: '#00f5ff' }}>
          <div
            className="w-8 h-8 rounded-full animate-spin"
            style={{ border: '2px solid #00f5ff', borderTopColor: 'transparent' }}
          />
          <span className="text-lg font-medium">加载中...</span>
        </div>
      </div>
    );
  }

  if (!script) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center p-8">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 mx-auto"
            style={{
              background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(191,0,255,0.1))',
              border: '1px solid rgba(0,245,255,0.2)',
            }}
          >
            <Film size={40} style={{ color: 'rgba(0,245,255,0.5)' }} />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">剧本不存在</h3>
          <button
            onClick={() => navigate('/video')}
            className="px-4 py-2 rounded-lg transition-all"
            style={{
              backgroundColor: '#12121a',
              color: '#00f5ff',
              border: '1px solid rgba(0,245,255,0.3)',
            }}
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* 顶部工具栏 */}
      <div
        className="relative z-10 h-12 flex items-center justify-between px-4"
        style={{
          borderBottom: '1px solid #1e1e2e',
          backgroundColor: 'rgba(10,10,15,0.8)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="flex items-center gap-3">
          {/* 幻境AI Logo */}
          <button
            onClick={() => navigate('/video')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all group relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(191,0,255,0.1), rgba(255,0,128,0.1))',
              border: '1px solid rgba(0,245,255,0.3)',
            }}
          >
            {/* 动态光效背景 */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(0,245,255,0.2), rgba(191,0,255,0.2), transparent)',
                animation: 'shimmer 2s infinite',
              }}
            />
            {/* Logo图标 */}
            <div 
              className="relative w-6 h-6 rounded-md flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #00f5ff, #bf00ff, #ff0080)',
                boxShadow: '0 0 12px rgba(0,245,255,0.5), 0 0 24px rgba(191,0,255,0.3)',
              }}
            >
              <span className="text-white text-xs font-bold" style={{ textShadow: '0 0 8px rgba(255,255,255,0.8)' }}>幻</span>
            </div>
            {/* Logo文字 */}
            <span 
              className="relative font-bold text-sm tracking-wide"
              style={{
                background: 'linear-gradient(90deg, #00f5ff, #bf00ff, #ff0080, #00f5ff)',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'gradient-flow 3s linear infinite',
                textShadow: '0 0 20px rgba(0,245,255,0.5)',
              }}
            >
              幻境AI
            </span>
            {/* 闪烁光点 */}
            <div 
              className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: '#00f5ff',
                boxShadow: '0 0 6px #00f5ff, 0 0 12px #00f5ff',
                animation: 'pulse-glow 1.5s ease-in-out infinite',
              }}
            />
          </button>

          <div className="h-4 w-px" style={{ backgroundColor: '#1e1e2e' }} />

          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(191,0,255,0.1))',
                border: '1px solid rgba(0,245,255,0.2)',
              }}
            >
              <Zap size={14} style={{ color: '#00f5ff' }} />
            </div>
            <span className="font-medium text-sm" style={{ color: '#e5e7eb' }}>
              {script.title}
            </span>
          </div>
        </div>

        <div className="w-[100px]" />
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden p-3 gap-3">
        {/* 最左侧资产Tab */}
        <CyberAssetSidebar activeTab={currentAssetTab} onTabChange={setAssetTab} />

        {/* 工作区 */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {renderWorkspace()}
        </div>
      </div>
    </div>
  );
};
