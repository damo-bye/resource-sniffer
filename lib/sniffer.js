/**
 * 资源嗅探核心模块
 * 负责识别和分类网页中的各类资源
 */

// 资源类型枚举
export const ResourceType = {
  VIDEO: 'video',
  AUDIO: 'audio',
  IMAGE: 'image',
  DOCUMENT: 'document',
  ARCHIVE: 'archive',
  OTHER: 'other'
};

// 资源类型图标映射
export const ResourceTypeIcon = {
  [ResourceType.VIDEO]: '🎬',
  [ResourceType.AUDIO]: '🎵',
  [ResourceType.IMAGE]: '🖼️',
  [ResourceType.DOCUMENT]: '📄',
  [ResourceType.ARCHIVE]: '📦',
  [ResourceType.OTHER]: '📁'
};

// MIME 类型到资源类型的映射
const MIME_TYPE_MAP = {
  // 视频类型
  'video/mp4': ResourceType.VIDEO,
  'video/webm': ResourceType.VIDEO,
  'video/ogg': ResourceType.VIDEO,
  'video/avi': ResourceType.VIDEO,
  'video/quicktime': ResourceType.VIDEO,
  'video/x-msvideo': ResourceType.VIDEO,
  'video/x-flv': ResourceType.VIDEO,
  'video/x-matroska': ResourceType.VIDEO,
  'application/x-mpegURL': ResourceType.VIDEO,
  'application/vnd.apple.mpegurl': ResourceType.VIDEO,

  // 音频类型
  'audio/mpeg': ResourceType.AUDIO,
  'audio/mp3': ResourceType.AUDIO,
  'audio/ogg': ResourceType.AUDIO,
  'audio/wav': ResourceType.AUDIO,
  'audio/webm': ResourceType.AUDIO,
  'audio/aac': ResourceType.AUDIO,
  'audio/flac': ResourceType.AUDIO,
  'audio/x-m4a': ResourceType.AUDIO,

  // 图片类型
  'image/jpeg': ResourceType.IMAGE,
  'image/png': ResourceType.IMAGE,
  'image/gif': ResourceType.IMAGE,
  'image/webp': ResourceType.IMAGE,
  'image/svg+xml': ResourceType.IMAGE,
  'image/bmp': ResourceType.IMAGE,
  'image/tiff': ResourceType.IMAGE,
  'image/x-icon': ResourceType.IMAGE,

  // 文档类型
  'application/pdf': ResourceType.DOCUMENT,
  'application/msword': ResourceType.DOCUMENT,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ResourceType.DOCUMENT,
  'application/vnd.ms-excel': ResourceType.DOCUMENT,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ResourceType.DOCUMENT,
  'application/vnd.ms-powerpoint': ResourceType.DOCUMENT,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ResourceType.DOCUMENT,
  'text/plain': ResourceType.DOCUMENT,

  // 压缩包类型
  'application/zip': ResourceType.ARCHIVE,
  'application/x-rar-compressed': ResourceType.ARCHIVE,
  'application/x-7z-compressed': ResourceType.ARCHIVE,
  'application/gzip': ResourceType.ARCHIVE,
  'application/x-tar': ResourceType.ARCHIVE
};

// 文件扩展名到资源类型的映射
const EXTENSION_MAP = {
  // 视频扩展名
  '.mp4': ResourceType.VIDEO,
  '.webm': ResourceType.VIDEO,
  '.avi': ResourceType.VIDEO,
  '.mov': ResourceType.VIDEO,
  '.mkv': ResourceType.VIDEO,
  '.flv': ResourceType.VIDEO,
  '.wmv': ResourceType.VIDEO,
  '.m3u8': ResourceType.VIDEO,
  '.ts': ResourceType.VIDEO,

  // 音频扩展名
  '.mp3': ResourceType.AUDIO,
  '.wav': ResourceType.AUDIO,
  '.ogg': ResourceType.AUDIO,
  '.aac': ResourceType.AUDIO,
  '.flac': ResourceType.AUDIO,
  '.m4a': ResourceType.AUDIO,
  '.wma': ResourceType.AUDIO,

  // 图片扩展名
  '.jpg': ResourceType.IMAGE,
  '.jpeg': ResourceType.IMAGE,
  '.png': ResourceType.IMAGE,
  '.gif': ResourceType.IMAGE,
  '.webp': ResourceType.IMAGE,
  '.svg': ResourceType.IMAGE,
  '.bmp': ResourceType.IMAGE,
  '.ico': ResourceType.IMAGE,
  '.tiff': ResourceType.IMAGE,

  // 文档扩展名
  '.pdf': ResourceType.DOCUMENT,
  '.doc': ResourceType.DOCUMENT,
  '.docx': ResourceType.DOCUMENT,
  '.xls': ResourceType.DOCUMENT,
  '.xlsx': ResourceType.DOCUMENT,
  '.ppt': ResourceType.DOCUMENT,
  '.pptx': ResourceType.DOCUMENT,
  '.txt': ResourceType.DOCUMENT,

  // 压缩包扩展名
  '.zip': ResourceType.ARCHIVE,
  '.rar': ResourceType.ARCHIVE,
  '.7z': ResourceType.ARCHIVE,
  '.tar': ResourceType.ARCHIVE,
  '.gz': ResourceType.ARCHIVE
};

/**
 * 资源嗅探器类
 */
export class ResourceSniffer {
  constructor() {
    this.resources = new Map(); // 存储检测到的资源
    this.filters = {
      types: Object.values(ResourceType), // 默认显示所有类型
      minSize: 0, // 最小文件大小
      maxSize: Infinity, // 最大文件大小
      searchQuery: '' // 搜索关键词
    };
  }

  /**
   * 根据 MIME 类型获取资源类型
   * @param {string} mimeType - MIME 类型
   * @returns {string} 资源类型
   */
  getResourceTypeByMime(mimeType) {
    if (!mimeType) return ResourceType.OTHER;
    const baseType = mimeType.split(';')[0].trim().toLowerCase();
    return MIME_TYPE_MAP[baseType] || ResourceType.OTHER;
  }

  /**
   * 根据文件扩展名获取资源类型
   * @param {string} url - 资源 URL
   * @returns {string} 资源类型
   */
  getResourceTypeByExtension(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      const lastDotIndex = pathname.lastIndexOf('.');
      if (lastDotIndex === -1) return ResourceType.OTHER;
      const extension = pathname.substring(lastDotIndex);
      return EXTENSION_MAP[extension] || ResourceType.OTHER;
    } catch {
      return ResourceType.OTHER;
    }
  }

  /**
   * 获取资源类型（优先使用 MIME 类型，其次使用扩展名）
   * @param {string} url - 资源 URL
   * @param {string} mimeType - MIME 类型
   * @returns {string} 资源类型
   */
  getResourceType(url, mimeType) {
    const typeByMime = this.getResourceTypeByMime(mimeType);
    if (typeByMime !== ResourceType.OTHER) {
      return typeByMime;
    }
    return this.getResourceTypeByExtension(url);
  }

  /**
   * 添加资源
   * @param {Object} resource - 资源对象
   * @param {string} resource.url - 资源 URL
   * @param {string} resource.type - 资源类型
   * @param {string} resource.mimeType - MIME 类型
   * @param {number} resource.size - 文件大小
   * @param {string} resource.filename - 文件名
   * @param {number} resource.tabId - 标签页 ID
   * @returns {string} 资源 ID
   */
  addResource(resource) {
    const resourceId = this.generateResourceId(resource.url);
    const resourceType = this.getResourceType(resource.url, resource.mimeType);
    const filename = resource.filename || this.extractFilename(resource.url);

    const resourceData = {
      id: resourceId,
      url: resource.url,
      type: resourceType,
      mimeType: resource.mimeType || '',
      size: resource.size || 0,
      filename: filename,
      tabId: resource.tabId,
      timestamp: Date.now(),
      selected: false
    };

    // 避免重复添加
    if (!this.resources.has(resourceId)) {
      this.resources.set(resourceId, resourceData);
    }

    return resourceId;
  }

  /**
   * 生成资源 ID
   * @param {string} url - 资源 URL
   * @returns {string} 资源 ID
   */
  generateResourceId(url) {
    // 使用 URL 作为唯一标识
    return btoa(url).replace(/[+/=]/g, '').substring(0, 32);
  }

  /**
   * 从 URL 中提取文件名
   * @param {string} url - 资源 URL
   * @returns {string} 文件名
   */
  extractFilename(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop();
      return filename || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * 获取所有资源
   * @returns {Array} 资源列表
   */
  getAllResources() {
    return Array.from(this.resources.values());
  }

  /**
   * 根据标签页 ID 获取资源
   * @param {number} tabId - 标签页 ID
   * @returns {Array} 资源列表
   */
  getResourcesByTabId(tabId) {
    return this.getAllResources().filter(r => r.tabId === tabId);
  }

  /**
   * 根据类型获取资源
   * @param {string} type - 资源类型
   * @returns {Array} 资源列表
   */
  getResourcesByType(type) {
    return this.getAllResources().filter(r => r.type === type);
  }

  /**
   * 获取过滤后的资源
   * @returns {Array} 过滤后的资源列表
   */
  getFilteredResources() {
    let resources = this.getAllResources();

    // 按类型过滤
    if (this.filters.types.length > 0) {
      resources = resources.filter(r => this.filters.types.includes(r.type));
    }

    // 按大小过滤
    resources = resources.filter(r => {
      if (r.size === 0) return true; // 未知大小的资源默认显示
      return r.size >= this.filters.minSize && r.size <= this.filters.maxSize;
    });

    // 按搜索关键词过滤
    if (this.filters.searchQuery) {
      const query = this.filters.searchQuery.toLowerCase();
      resources = resources.filter(r =>
        r.filename.toLowerCase().includes(query) ||
        r.url.toLowerCase().includes(query)
      );
    }

    return resources;
  }

  /**
   * 设置过滤器
   * @param {Object} filters - 过滤器配置
   */
  setFilters(filters) {
    this.filters = { ...this.filters, ...filters };
  }

  /**
   * 切换资源选中状态
   * @param {string} resourceId - 资源 ID
   * @returns {boolean} 新的选中状态
   */
  toggleResourceSelection(resourceId) {
    const resource = this.resources.get(resourceId);
    if (resource) {
      resource.selected = !resource.selected;
      return resource.selected;
    }
    return false;
  }

  /**
   * 全选/取消全选资源
   * @param {boolean} selected - 选中状态
   */
  selectAllResources(selected) {
    this.resources.forEach(resource => {
      resource.selected = selected;
    });
  }

  /**
   * 获取选中的资源
   * @returns {Array} 选中的资源列表
   */
  getSelectedResources() {
    return this.getAllResources().filter(r => r.selected);
  }

  /**
   * 清除所有资源
   */
  clearResources() {
    this.resources.clear();
  }

  /**
   * 清除指定标签页的资源
   * @param {number} tabId - 标签页 ID
   */
  clearResourcesByTabId(tabId) {
    this.resources.forEach((resource, id) => {
      if (resource.tabId === tabId) {
        this.resources.delete(id);
      }
    });
  }

  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '未知';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
  }

  /**
   * 获取资源统计信息
   * @returns {Object} 统计信息
   */
  getStatistics() {
    const resources = this.getAllResources();
    const stats = {
      total: resources.length,
      byType: {},
      totalSize: 0
    };

    Object.values(ResourceType).forEach(type => {
      stats.byType[type] = 0;
    });

    resources.forEach(resource => {
      stats.byType[resource.type]++;
      stats.totalSize += resource.size;
    });

    return stats;
  }
}

// 导出单例实例
export const sniffer = new ResourceSniffer();
