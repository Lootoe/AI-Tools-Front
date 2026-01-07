// 批量下载视频工具函数

import { Episode } from '@/types/video';

/**
 * 下载单个视频文件
 */
async function downloadSingleVideo(
  url: string,
  filename: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('下载失败');

    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    
    const reader = response.body?.getReader();
    if (!reader) throw new Error('无法读取响应');

    const chunks: Uint8Array[] = [];
    let receivedLength = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      receivedLength += value.length;

      if (total > 0 && onProgress) {
        onProgress((receivedLength / total) * 100);
      }
    }

    // 合并所有块
    const blob = new Blob(chunks);
    
    // 创建下载链接
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error(`下载失败: ${filename}`, error);
    throw error;
  }
}

/**
 * 批量下载剧集中所有分镜的当前选中副本视频
 */
export async function downloadEpisodeVideos(
  episode: Episode,
  onProgress?: (current: number, total: number, filename: string) => void
): Promise<{ success: number; failed: number }> {
  // 筛选出有可下载视频的分镜（优先使用当前选中副本，否则使用旧数据）
  const downloadableStoryboards = episode.storyboards
    .map((sb) => {
      // 优先使用当前选中的副本
      const activeVariant = sb.variants?.find((v) => v.id === sb.activeVariantId);
      if (activeVariant?.status === 'completed' && activeVariant?.videoUrl) {
        return { storyboard: sb, videoUrl: activeVariant.videoUrl };
      }
      // 兼容旧数据
      if (sb.status === 'completed' && sb.videoUrl) {
        return { storyboard: sb, videoUrl: sb.videoUrl };
      }
      return null;
    })
    .filter((item): item is { storyboard: typeof episode.storyboards[0]; videoUrl: string } => item !== null);

  if (downloadableStoryboards.length === 0) {
    throw new Error('没有可下载的视频');
  }

  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < downloadableStoryboards.length; i++) {
    const { storyboard, videoUrl } = downloadableStoryboards[i];
    
    // 构建文件名：剧集序号_分镜序号.mp4
    const filename = `E${String(episode.episodeNumber).padStart(2, '0')}_S${String(storyboard.sceneNumber).padStart(2, '0')}.mp4`;
    
    try {
      if (onProgress) {
        onProgress(i + 1, downloadableStoryboards.length, filename);
      }

      await downloadSingleVideo(videoUrl, filename);
      successCount++;
      
      // 添加延迟避免浏览器阻止多个下载
      if (i < downloadableStoryboards.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`下载失败: ${filename}`, error);
      failedCount++;
    }
  }

  return { success: successCount, failed: failedCount };
}
