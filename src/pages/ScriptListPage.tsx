import { useNavigate } from 'react-router-dom';
import { useVideoStore } from '@/stores/videoStore';
import { useEffect } from 'react';
import { Plus, Loader2, Sparkles, Film } from 'lucide-react';
import { ScriptCard } from '@/components/video/ScriptCard';

export const ScriptListPage = () => {
  const navigate = useNavigate();
  const { scripts, loadScripts, createScript, deleteScript, renameScript, isLoading } = useVideoStore();

  useEffect(() => {
    loadScripts();
  }, [loadScripts]);

  const handleCreateScript = async () => {
    const scriptId = await createScript();
    navigate(`/video/script/${scriptId}`);
  };

  const handleScriptClick = (scriptId: string) => {
    navigate(`/video/script/${scriptId}`);
  };

  const handleDeleteScript = async (scriptId: string) => {
    await deleteScript(scriptId);
  };

  const handleRenameScript = async (scriptId: string, newTitle: string) => {
    await renameScript(scriptId, newTitle);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="flex items-center gap-3" style={{ color: '#00f5ff' }}>
          <Loader2 className="animate-spin" size={24} />
          <span className="text-lg font-medium">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* 顶部标题栏 */}
      <div className="relative z-10 px-6 py-4" style={{ borderBottom: '1px solid rgba(60, 60, 80, 0.4)' }}>
        <div className="flex justify-between items-center">
          {/* 幻境AI Logo */}
          <div className="flex items-center gap-4">
            {/* 霓虹Logo */}
            <div className="relative group cursor-pointer" onClick={() => {}}>
              {/* 动态光效背景 */}
              <div 
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(0,245,255,0.3), rgba(191,0,255,0.3), transparent)',
                  filter: 'blur(8px)',
                }}
              />
              <div 
                className="relative w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, #00f5ff, #bf00ff, #ff0080)',
                  boxShadow: '0 0 20px rgba(0,245,255,0.4), 0 0 40px rgba(191,0,255,0.3)',
                }}
              >
                <span className="text-white text-lg font-bold" style={{ textShadow: '0 0 10px rgba(255,255,255,0.8)' }}>幻</span>
              </div>
              {/* 闪烁光点 */}
              <div 
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                style={{ 
                  backgroundColor: '#00f5ff',
                  boxShadow: '0 0 8px #00f5ff, 0 0 16px #00f5ff',
                  animation: 'pulse-glow 1.5s ease-in-out infinite',
                }}
              />
            </div>
            <div>
              <h1 
                className="text-2xl font-bold"
                style={{ 
                  background: 'linear-gradient(90deg, #00f5ff, #bf00ff, #ff0080, #00f5ff)',
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'gradient-flow 3s linear infinite',
                  textShadow: '0 0 30px rgba(0,245,255,0.3)',
                }}
              >
                幻境AI
              </h1>
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>创作属于你的AI漫剧故事</p>
            </div>
          </div>

          {/* 新建按钮 */}
          <button
            data-testid="create-script-button"
            onClick={handleCreateScript}
            className="group relative flex items-center gap-2 px-5 py-2.5 rounded-lg overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)',
              boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)'
            }}
          >
            <Plus size={18} className="text-white group-hover:rotate-90 transition-transform duration-300" />
            <span className="font-semibold text-white">新建剧本</span>
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        {scripts.length === 0 ? (
          /* 空状态 */
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative mb-8">
              {/* 外圈发光 */}
              <div 
                className="absolute inset-0 w-32 h-32 rounded-2xl blur-xl"
                style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.2), rgba(191,0,255,0.2))' }}
              />
              {/* 主图标 */}
              <div 
                className="relative w-32 h-32 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e' }}
              >
                <Film size={48} style={{ color: 'rgba(0,245,255,0.5)' }} />
                {/* 角标 */}
                <div 
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ 
                    background: 'linear-gradient(135deg, #ff00ff, #bf00ff)',
                    boxShadow: '0 0 15px rgba(255,0,255,0.5)'
                  }}
                >
                  <Plus size={16} className="text-white" />
                </div>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              开始你的创作之旅
            </h3>
            <p style={{ color: '#6b7280' }} className="mb-6 text-center max-w-md">
              点击上方按钮创建你的第一个剧本，用AI的力量将你的故事变成精彩的漫剧
            </p>
            <button
              onClick={handleCreateScript}
              className="group flex items-center gap-2 px-6 py-3 rounded-xl transition-all"
              style={{ 
                backgroundColor: '#12121a',
                border: '1px solid rgba(0,245,255,0.3)'
              }}
            >
              <Sparkles size={16} style={{ color: '#00f5ff' }} />
              <span style={{ color: '#00f5ff' }} className="font-medium">立即创建</span>
            </button>
          </div>
        ) : (
          /* 剧本网格 */
          <div 
            data-testid="script-grid"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
          >
            {scripts.map((script) => (
              <ScriptCard
                key={script.id}
                script={script}
                onClick={handleScriptClick}
                onDelete={handleDeleteScript}
                onRename={handleRenameScript}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
