import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { ScriptListPage } from '@/pages/ScriptListPage';
import { ScriptEditorPage } from '@/pages/ScriptEditorPage';
import { GlobalToastProvider, useGlobalToast, setGlobalShowToast } from '@/components/ui/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// 初始化全局 toast 的组件
function GlobalToastInitializer() {
  const { showToast } = useGlobalToast();

  useEffect(() => {
    setGlobalShowToast(showToast);
    return () => setGlobalShowToast(null);
  }, [showToast]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalToastProvider>
        <GlobalToastInitializer />
        <BrowserRouter>
          <div className="flex flex-col h-screen" style={{ backgroundColor: '#0a0a12' }}>
            {/* 赛博朋克背景 */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
              {/* 动态霓虹光晕 */}
              <div
                className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full blur-[120px] animate-glow-1"
                style={{ backgroundColor: 'rgba(0, 245, 255, 0.25)' }}
              />
              <div
                className="absolute top-1/4 -left-20 w-[400px] h-[400px] rounded-full blur-[100px] animate-glow-2"
                style={{ backgroundColor: 'rgba(255, 0, 255, 0.2)' }}
              />
              <div
                className="absolute -bottom-20 right-1/4 w-[450px] h-[450px] rounded-full blur-[110px] animate-glow-3"
                style={{ backgroundColor: 'rgba(138, 43, 226, 0.2)' }}
              />
              <div
                className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full blur-[80px] animate-glow-4"
                style={{ backgroundColor: 'rgba(0, 191, 255, 0.15)' }}
              />
            </div>

            {/* 导航栏已移除，默认显示AI漫剧页面 */}
            <Routes>
              {/* 根路径重定向到AI漫剧页面 */}
              <Route path="/" element={<Navigate to="/video" replace />} />
              {/* 保留其他路由，但暂时不通过导航访问 */}
              <Route path="/home" element={
                <main className="flex-1 container mx-auto px-4 py-8 overflow-auto relative">
                  <HomePage />
                </main>
              } />
              <Route path="/ai-comic" element={<Navigate to="/video" replace />} />
              <Route path="/video" element={
                <main className="flex-1 overflow-hidden relative">
                  <ScriptListPage />
                </main>
              } />
              <Route path="/video/script/:scriptId" element={
                <main className="flex-1 overflow-hidden relative">
                  <ScriptEditorPage />
                </main>
              } />
            </Routes>
          </div>
        </BrowserRouter>
      </GlobalToastProvider>
    </QueryClientProvider>
  );
}

export default App;
