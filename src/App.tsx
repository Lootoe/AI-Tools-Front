import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { ChatPage } from '@/pages/ChatPage';
import { WorkflowPage } from '@/pages/WorkflowPage';
import { TextToImagePage } from '@/pages/TextToImagePage';
import { ImageToVideoPage } from '@/pages/ImageToVideoPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/workflow" element={<WorkflowPage />} />
          <Route path="/text-to-image" element={<TextToImagePage />} />
          <Route path="/image-to-video" element={<ImageToVideoPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
