/**
 * 通用文件下载工具
 * - 跨域签名 URL 不能用 <a download>（浏览器会忽略 download 属性），
 *   必须 fetch + blob + 临时 ObjectURL 触发下载。
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`下载失败: HTTP ${response.status}`);
  }
  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // 延迟释放，确保浏览器完成下载
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
}
