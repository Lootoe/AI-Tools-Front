import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { ScriptListPage } from '@/pages/ScriptListPage';
import { ScriptEditorPage } from '@/pages/ScriptEditorPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { AuthPage } from '@/pages/AuthPage';
import { LandingPage } from '@/pages/LandingPage';
import { useAuthStore } from '@/stores/authStore';
import { GlobalToastProvider, useGlobalToast, setGlobalShowToast } from '@/components/ui/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// 路由守卫组件
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}

// 初始化全局 toast 的组件
function GlobalToastInitializer() {
  const { showToast } = useGlobalToast();
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    setGlobalShowToast(showToast);
    return () => setGlobalShowToast(null);
  }, [showToast]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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
              {/* 首页（落地页+登录） */}
              <Route path="/" element={<LandingPage />} />
              {/* 兼容旧的登录路由 */}
              <Route path="/home" element={<LandingPage />} />
              {/* 以下路由需要登录 */}
              <Route path="/home" element={
                <ProtectedRoute>
                  <main className="flex-1 container mx-auto px-4 py-8 overflow-auto relative">
                    <HomePage />
                  </main>
                </ProtectedRoute>
              } />
              <Route path="/ai-comic" element={<Navigate to="/video" replace />} />
              <Route path="/video" element={
                <ProtectedRoute>
                  <main className="flex-1 overflow-hidden relative">
                    <ScriptListPage />
                  </main>
                </ProtectedRoute>
              } />
              <Route path="/video/script/:scriptId" element={
                <ProtectedRoute>
                  <main className="flex-1 overflow-hidden relative">
                    <ScriptEditorPage />
                  </main>
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <main className="flex-1 overflow-auto relative">
                    <ProfilePage />
                  </main>
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </BrowserRouter>
      </GlobalToastProvider>
    </QueryClientProvider>
  );
}

export default App;
