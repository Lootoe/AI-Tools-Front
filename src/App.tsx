import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { HomePage } from '@/pages/HomePage';
import { ChatPage } from '@/pages/ChatPage';
import { WorkflowPage } from '@/pages/WorkflowPage';
import { TextToImagePage } from '@/pages/TextToImagePage';
import { ImageToVideoPage } from '@/pages/ImageToVideoPage';
import { useModelStore } from '@/stores/modelStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const loadModels = useModelStore((state) => state.loadModels);

  useEffect(() => {
    loadModels();
  }, [loadModels]);
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950/20">
          {/* 背景装饰 */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl" />
            <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />
          </div>
          
          <Navbar />
          <Routes>
            <Route path="/" element={
              <main className="flex-1 container mx-auto px-4 py-8 overflow-auto relative">
                <HomePage />
              </main>
            } />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/workflow" element={
              <main className="flex-1 container mx-auto px-4 py-8 overflow-auto relative">
                <WorkflowPage />
              </main>
            } />
            <Route path="/text-to-image" element={
              <main className="flex-1 px-4 py-4 overflow-hidden relative">
                <TextToImagePage />
              </main>
            } />
            <Route path="/image-to-video" element={
              <main className="flex-1 container mx-auto px-4 py-8 overflow-auto relative">
                <ImageToVideoPage />
              </main>
            } />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
