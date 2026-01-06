/**
 * 视频关键帧截取工具
 */

/**
 * 从视频 URL 截取指定时间点的帧
 * @param videoUrl 视频 URL
 * @param time 时间点（秒）
 * @returns Promise<Blob> 图片 Blob
 */
export async function captureVideoFrame(videoUrl: string, time: number = 0): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      // 确保时间点在视频范围内
      const captureTime = Math.min(Math.max(0, time), video.duration);
      video.currentTime = captureTime;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建 Canvas 上下文'));
          return;
        }
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('无法生成图片'));
          }
        }, 'image/png');
      } catch (error) {
        reject(error);
      }
    };

    video.onerror = () => {
      reject(new Error('视频加载失败'));
    };

    video.src = videoUrl;
  });
}

/**
 * 下载 Blob 为文件
 * @param blob 文件 Blob
 * @param filename 文件名
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 从视频截取关键帧并下载
 * @param videoUrl 视频 URL
 * @param filename 保存的文件名（不含扩展名）
 * @param time 时间点（秒），默认为 0
 */
export async function captureAndDownloadFrame(
  videoUrl: string,
  filename: string,
  time: number = 0
): Promise<void> {
  try {
    const blob = await captureVideoFrame(videoUrl, time);
    downloadBlob(blob, `${filename}.png`);
  } catch (error) {
    console.error('截取关键帧失败:', error);
    throw error;
  }
}
