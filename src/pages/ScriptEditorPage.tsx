import React, { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Film } from 'lucide-react';
import { useVideoStore } from '@/stores/videoStore';
import { CyberAssetSidebar } from '@/components/video/CyberAssetSidebar';
import { EpisodeWorkspace } from '@/components/video/EpisodeWorkspace';
import { ImageWorkspace } from '@/components/video/ImageWorkspace';
import { AssetCanvasWorkspace } from '@/components/video/AssetCanvasWorkspace';
import { AssetRepositoryWorkspace } from '@/components/video/AssetRepositoryWorkspace';
import { CharacterWorkspace } from '@/components/video/CharacterWorkspace';
import { AppNavbar } from '@/components/layout/AppNavbar';
import { AssetTabType } from '@/types/video';

export const ScriptEditorPage: React.FC = () => {
  const { scriptId, tab, episodeId, storyboardId } = useParams<{
    scriptId: string;
    tab?: string;
    episodeId?: string;
    storyboardId?: string;
  }>();
  const navigate = useNavigate();
  const {
    scripts,
    loadScripts,
    selectScript,
    isLoading,
  } = useVideoStore();

  // 从 URL 获取当前 tab，默认为 storyboard
  const currentAssetTab: AssetTabType = (tab as AssetTabType) || 'storyboard';

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
        // 如果没有 tab 参数，重定向到默认 tab
        if (!tab) {
          const script = scripts.find((s) => s.id === scriptId);
          const firstEpisode = script?.episodes[0];
          const firstStoryboard = firstEpisode?.storyboards[0];
          if (firstEpisode && firstStoryboard) {
            navigate(`/video/script/${scriptId}/storyboard/${firstEpisode.id}/${firstStoryboard.id}`, { replace: true });
          } else if (firstEpisode) {
            navigate(`/video/script/${scriptId}/storyboard/${firstEpisode.id}`, { replace: true });
          } else {
            navigate(`/video/script/${scriptId}/storyboard`, { replace: true });
          }
        }
      } else {
        navigate('/video');
      }
    }
  }, [scriptId, scripts, selectScript, navigate, tab]);

  const script = scripts.find((s) => s.id === scriptId);

  // TAB 切换处理
  const handleTabChange = useCallback((newTab: AssetTabType) => {
    if (!scriptId) return;

    // 对于需要 episodeId 的 tab，尝试保留当前 episodeId
    if (newTab === 'storyboard' || newTab === 'storyboardImage') {
      const currentEpisodeId = episodeId || script?.episodes[0]?.id;
      if (currentEpisodeId) {
        const episode = script?.episodes.find(e => e.id === currentEpisodeId);
        if (newTab === 'storyboard') {
          const firstStoryboard = episode?.storyboards[0];
          if (firstStoryboard) {
            navigate(`/video/script/${scriptId}/${newTab}/${currentEpisodeId}/${firstStoryboard.id}`);
          } else {
            navigate(`/video/script/${scriptId}/${newTab}/${currentEpisodeId}`);
          }
        } else {
          const firstStoryboardImage = episode?.storyboardImages[0];
          if (firstStoryboardImage) {
            navigate(`/video/script/${scriptId}/${newTab}/${currentEpisodeId}/${firstStoryboardImage.id}`);
          } else {
            navigate(`/video/script/${scriptId}/${newTab}/${currentEpisodeId}`);
          }
        }
      } else {
        navigate(`/video/script/${scriptId}/${newTab}`);
      }
    } else {
      // asset 和 character 不需要 episodeId
      navigate(`/video/script/${scriptId}/${newTab}`);
    }
  }, [scriptId, episodeId, script, navigate]);

  // 剧集切换处理
  const handleEpisodeChange = useCallback((newEpisodeId: string | null) => {
    if (!scriptId || !newEpisodeId) return;

    const episode = script?.episodes.find(e => e.id === newEpisodeId);
    if (currentAssetTab === 'storyboard') {
      const firstStoryboard = episode?.storyboards[0];
      if (firstStoryboard) {
        navigate(`/video/script/${scriptId}/${currentAssetTab}/${newEpisodeId}/${firstStoryboard.id}`);
      } else {
        navigate(`/video/script/${scriptId}/${currentAssetTab}/${newEpisodeId}`);
      }
    } else if (currentAssetTab === 'storyboardImage') {
      const firstStoryboardImage = episode?.storyboardImages[0];
      if (firstStoryboardImage) {
        navigate(`/video/script/${scriptId}/${currentAssetTab}/${newEpisodeId}/${firstStoryboardImage.id}`);
      } else {
        navigate(`/video/script/${scriptId}/${currentAssetTab}/${newEpisodeId}`);
      }
    }
  }, [scriptId, script, currentAssetTab, navigate]);

  // 分镜切换处理
  const handleStoryboardChange = useCallback((newStoryboardId: string | null) => {
    if (!scriptId || !episodeId || !newStoryboardId) return;
    navigate(`/video/script/${scriptId}/${currentAssetTab}/${episodeId}/${newStoryboardId}`);
  }, [scriptId, episodeId, currentAssetTab, navigate]);

  const renderWorkspace = () => {
    if (!script) return null;

    switch (currentAssetTab) {
      case 'storyboard':
        return (
          <EpisodeWorkspace
            scriptId={script.id}
            episodeId={episodeId}
            storyboardId={storyboardId}
            onEpisodeChange={handleEpisodeChange}
            onStoryboardChange={handleStoryboardChange}
          />
        );
      case 'storyboardImage':
        return (
          <ImageWorkspace
            scriptId={script.id}
            episodeId={episodeId}
            storyboardImageId={storyboardId}
            onEpisodeChange={handleEpisodeChange}
            onStoryboardImageChange={handleStoryboardChange}
          />
        );
      case 'assetCanvas':
        return <AssetCanvasWorkspace scriptId={script.id} />;
      case 'assetRepository':
        return <AssetRepositoryWorkspace scriptId={script.id} />;
      case 'character':
        return <CharacterWorkspace scriptId={script.id} />;
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
      <AppNavbar />

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden p-3 gap-3">
        {/* 最左侧资产Tab */}
        <CyberAssetSidebar activeTab={currentAssetTab} onTabChange={handleTabChange} />

        {/* 工作区 */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {renderWorkspace()}
        </div>
      </div>
    </div>
  );
};
