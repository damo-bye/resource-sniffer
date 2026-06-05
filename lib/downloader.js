/**
 * 下载管理模块
 * 负责处理资源的下载逻辑
 */

/**
 * 下载管理器类
 */
export class DownloadManager {
  constructor() {
    this.downloadQueue = new Map(); // 下载队列
    this.downloadHistory = []; // 下载历史
    this.isDownloading = false;
    this.maxConcurrentDownloads = 3; // 最大并发下载数
    this.onProgressCallback = null;
    this.onCompleteCallback = null;
    this.onErrorCallback = null;
  }

  /**
   * 设置回调函数
   * @param {Object} callbacks - 回调函数对象
   */
  setCallbacks(callbacks) {
    this.onProgressCallback = callbacks.onProgress || null;
    this.onCompleteCallback = callbacks.onComplete || null;
    this.onErrorCallback = callbacks.onError || null;
  }

  /**
   * 下载单个资源
   * @param {Object} resource - 资源对象
   * @returns {Promise} 下载结果
   */
  async downloadResource(resource) {
    const downloadId = this.generateDownloadId(resource);

    // 检查是否已在下载队列中
    if (this.downloadQueue.has(downloadId)) {
      console.warn('资源已在下载队列中:', resource.filename);
      return;
    }

    // 添加到下载队列
    this.downloadQueue.set(downloadId, {
      resource: resource,
      status: 'pending',
      progress: 0,
      startTime: Date.now()
    });

    try {
      // 使用浏览器下载 API
      const browserDownloadId = await this.startBrowserDownload(resource);

      // 更新下载状态
      this.updateDownloadStatus(downloadId, 'downloading', 0);

      // 监听下载进度
      this.trackDownloadProgress(browserDownloadId, downloadId);

      return browserDownloadId;
    } catch (error) {
      this.updateDownloadStatus(downloadId, 'error', 0, error.message);
      this.notifyError(downloadId, error);
      throw error;
    }
  }

  /**
   * 批量下载资源
   * @param {Array} resources - 资源列表
   * @returns {Promise} 下载结果
   */
  async downloadResources(resources) {
    if (this.isDownloading) {
      console.warn('已有下载任务正在进行中');
      return;
    }

    this.isDownloading = true;
    const results = [];

    try {
      // 分批下载，控制并发数
      for (let i = 0; i < resources.length; i += this.maxConcurrentDownloads) {
        const batch = resources.slice(i, i + this.maxConcurrentDownloads);
        const batchPromises = batch.map(resource =>
          this.downloadResource(resource).catch(error => ({
            error: error.message,
            resource: resource
          }))
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // 更新总体进度
        const progress = ((i + batch.length) / resources.length) * 100;
        this.notifyProgress('batch', progress);
      }

      this.isDownloading = false;
      this.notifyComplete(results);
      return results;
    } catch (error) {
      this.isDownloading = false;
      this.notifyError('batch', error);
      throw error;
    }
  }

  /**
   * 开始浏览器下载
   * @param {Object} resource - 资源对象
   * @returns {Promise<number>} 浏览器下载 ID
   */
  async startBrowserDownload(resource) {
    return new Promise((resolve, reject) => {
      const downloadOptions = {
        url: resource.url,
        filename: this.sanitizeFilename(resource.filename),
        saveAs: false
      };

      chrome.downloads.download(downloadOptions, (downloadId) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(downloadId);
        }
      });
    });
  }

  /**
   * 跟踪下载进度
   * @param {number} browserDownloadId - 浏览器下载 ID
   * @param {string} downloadId - 内部下载 ID
   */
  trackDownloadProgress(browserDownloadId, downloadId) {
    const checkProgress = () => {
      chrome.downloads.search({ id: browserDownloadId }, (downloads) => {
        if (downloads && downloads.length > 0) {
          const download = downloads[0];
          const progress = download.totalBytes > 0
            ? (download.bytesReceived / download.totalBytes) * 100
            : 0;

          this.updateDownloadStatus(downloadId, download.state, progress);

          if (download.state === 'complete') {
            this.addToHistory(downloadId, download);
            this.notifyComplete(downloadId);
          } else if (download.state === 'interrupted') {
            this.updateDownloadStatus(downloadId, 'error', progress, download.error);
            this.notifyError(downloadId, new Error(download.error));
          } else if (download.state === 'in_progress') {
            this.notifyProgress(downloadId, progress);
            setTimeout(checkProgress, 500);
          }
        }
      });
    };

    checkProgress();
  }

  /**
   * 更新下载状态
   * @param {string} downloadId - 下载 ID
   * @param {string} status - 状态
   * @param {number} progress - 进度
   * @param {string} error - 错误信息
   */
  updateDownloadStatus(downloadId, status, progress, error = null) {
    const download = this.downloadQueue.get(downloadId);
    if (download) {
      download.status = status;
      download.progress = progress;
      if (error) {
        download.error = error;
      }
      this.downloadQueue.set(downloadId, download);
    }
  }

  /**
   * 添加到下载历史
   * @param {string} downloadId - 下载 ID
   * @param {Object} download - 下载信息
   */
  addToHistory(downloadId, download) {
    const queueItem = this.downloadQueue.get(downloadId);
    if (queueItem) {
      this.downloadHistory.unshift({
        id: downloadId,
        resource: queueItem.resource,
        startTime: queueItem.startTime,
        endTime: Date.now(),
        filename: download.filename,
        fileSize: download.fileSize
      });

      // 限制历史记录数量
      if (this.downloadHistory.length > 100) {
        this.downloadHistory.pop();
      }
    }
  }

  /**
   * 生成下载 ID
   * @param {Object} resource - 资源对象
   * @returns {string} 下载 ID
   */
  generateDownloadId(resource) {
    return `download_${resource.id}_${Date.now()}`;
  }

  /**
   * 清理文件名
   * @param {string} filename - 原始文件名
   * @returns {string} 清理后的文件名
   */
  sanitizeFilename(filename) {
    // 移除或替换非法字符
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 255);
  }

  /**
   * 取消下载
   * @param {string} downloadId - 下载 ID
   */
  async cancelDownload(downloadId) {
    const download = this.downloadQueue.get(downloadId);
    if (download && download.browserDownloadId) {
      await chrome.downloads.cancel(download.browserDownloadId);
      this.updateDownloadStatus(downloadId, 'cancelled', 0);
      this.downloadQueue.delete(downloadId);
    }
  }

  /**
   * 暂停下载
   * @param {string} downloadId - 下载 ID
   */
  async pauseDownload(downloadId) {
    const download = this.downloadQueue.get(downloadId);
    if (download && download.browserDownloadId) {
      await chrome.downloads.pause(download.browserDownloadId);
      this.updateDownloadStatus(downloadId, 'paused', download.progress);
    }
  }

  /**
   * 恢复下载
   * @param {string} downloadId - 下载 ID
   */
  async resumeDownload(downloadId) {
    const download = this.downloadQueue.get(downloadId);
    if (download && download.browserDownloadId) {
      await chrome.downloads.resume(download.browserDownloadId);
      this.updateDownloadStatus(downloadId, 'downloading', download.progress);
    }
  }

  /**
   * 获取下载队列
   * @returns {Map} 下载队列
   */
  getDownloadQueue() {
    return this.downloadQueue;
  }

  /**
   * 获取下载历史
   * @returns {Array} 下载历史
   */
  getDownloadHistory() {
    return this.downloadHistory;
  }

  /**
   * 清除下载历史
   */
  clearDownloadHistory() {
    this.downloadHistory = [];
  }

  /**
   * 获取下载统计信息
   * @returns {Object} 统计信息
   */
  getStatistics() {
    const queue = Array.from(this.downloadQueue.values());
    return {
      total: queue.length,
      pending: queue.filter(d => d.status === 'pending').length,
      downloading: queue.filter(d => d.status === 'downloading').length,
      completed: queue.filter(d => d.status === 'complete').length,
      failed: queue.filter(d => d.status === 'error').length,
      historyCount: this.downloadHistory.length
    };
  }

  // 通知方法
  notifyProgress(downloadId, progress) {
    if (this.onProgressCallback) {
      this.onProgressCallback(downloadId, progress);
    }
  }

  notifyComplete(downloadId) {
    if (this.onCompleteCallback) {
      this.onCompleteCallback(downloadId);
    }
  }

  notifyError(downloadId, error) {
    if (this.onErrorCallback) {
      this.onErrorCallback(downloadId, error);
    }
  }
}

// 导出单例实例
export const downloader = new DownloadManager();
