/**
 * 后台脚本 - 资源嗅探下载器
 * 负责监听网络请求、管理资源嗅探和下载任务
 * 支持多浏览器：Chrome、Edge、Firefox、Opera、Brave、Vivaldi、Samsung Internet
 */

// 导入模块
import { sniffer, ResourceType } from './lib/sniffer.js';
import { downloader } from './lib/downloader.js';
import { storage } from './lib/storage.js';
import { browser, BrowserType } from './lib/browser.js';

// 初始化插件
class ResourceSnifferBackground {
  constructor() {
    this.tabResources = new Map(); // 每个标签页的资源
    this.init();
  }

  /**
   * 初始化插件
   */
  async init() {
    // 初始化存储
    await storage.initialize();

    // 设置下载回调
    downloader.setCallbacks({
      onProgress: this.handleDownloadProgress.bind(this),
      onComplete: this.handleDownloadComplete.bind(this),
      onError: this.handleDownloadError.bind(this)
    });

    // 注册事件监听器
    this.registerEventListeners();

    // 记录浏览器信息
    const browserInfo = browser.getCompatibilityInfo();
    console.log('资源嗅探下载器已初始化');
    console.log('浏览器信息:', browserInfo);

    // 处理浏览器特定的初始化
    this.handleBrowserSpecificInit();
  }

  /**
   * 处理浏览器特定的初始化逻辑
   */
  handleBrowserSpecificInit() {
    const browserType = browser.getBrowserType();

    // Brave 浏览器特殊处理
    if (browserType === BrowserType.BRAVE) {
      console.log('Brave 浏览器检测到，某些功能可能需要调整 Shields 设置');
    }

    // Samsung Internet 特殊处理
    if (browserType === BrowserType.SAMSUNG) {
      console.log('Samsung Internet 检测到，某些功能可能受限');
    }

    // Firefox 特殊处理
    if (browserType === BrowserType.FIREFOX) {
      console.log('Firefox 浏览器检测到，使用兼容模式');
    }
  }

  /**
   * 注册事件监听器
   */
  registerEventListeners() {
    // 监听网络请求
    this.registerWebRequestListeners();

    // 监听标签页更新
    chrome.tabs.onUpdated.addListener(this.handleTabUpdated.bind(this));
    chrome.tabs.onRemoved.addListener(this.handleTabRemoved.bind(this));

    // 监听来自 popup 和 content script 的消息
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

    // 监听插件安装/更新
    chrome.runtime.onInstalled.addListener(this.handleInstalled.bind(this));
  }

  /**
   * 注册网络请求监听器
   */
  registerWebRequestListeners() {
    // 监听响应头，获取资源信息
    chrome.webRequest.onHeadersReceived.addListener(
      this.handleHeadersReceived.bind(this),
      { urls: ['<all_urls>'] },
      ['responseHeaders']
    );

    // 监听请求完成，记录资源
    chrome.webRequest.onCompleted.addListener(
      this.handleRequestCompleted.bind(this),
      { urls: ['<all_urls>'] },
      ['responseHeaders']
    );
  }

  /**
   * 处理响应头
   * @param {Object} details - 请求详情
   */
  handleHeadersReceived(details) {
    // 只处理主框架和子框架的请求
    if (details.tabId === -1) return;

    const contentType = this.getContentType(details.responseHeaders);
    const contentLength = this.getContentLength(details.responseHeaders);

    // 检查是否是可下载的资源
    if (this.isDownloadableResource(contentType, details.url)) {
      const resource = {
        url: details.url,
        mimeType: contentType,
        size: contentLength,
        tabId: details.tabId,
        timestamp: Date.now()
      };

      // 添加到嗅探器
      const resourceId = sniffer.addResource(resource);

      // 更新标签页资源
      this.addTabResource(details.tabId, resourceId);

      // 更新徽章
      this.updateBadge(details.tabId);
    }
  }

  /**
   * 处理请求完成
   * @param {Object} details - 请求详情
   */
  handleRequestCompleted(details) {
    // 可以在这里处理请求完成后的逻辑
    // 例如：更新资源大小、记录下载历史等
  }

  /**
   * 获取 Content-Type
   * @param {Array} headers - 响应头
   * @returns {string} Content-Type
   */
  getContentType(headers) {
    if (!headers) return '';
    const header = headers.find(h => h.name.toLowerCase() === 'content-type');
    return header ? header.value : '';
  }

  /**
   * 获取 Content-Length
   * @param {Array} headers - 响应头
   * @returns {number} Content-Length
   */
  getContentLength(headers) {
    if (!headers) return 0;
    const header = headers.find(h => h.name.toLowerCase() === 'content-length');
    return header ? parseInt(header.value, 10) : 0;
  }

  /**
   * 检查是否是可下载的资源
   * @param {string} contentType - Content-Type
   * @param {string} url - 资源 URL
   * @returns {boolean} 是否可下载
   */
  isDownloadableResource(contentType, url) {
    // 获取设置
    const settings = storage.getSettings();
    if (!settings.sniffer.enabled) return false;

    // 检查是否在忽略列表中
    if (this.isIgnoredUrl(url)) return false;

    // 根据 MIME 类型判断
    if (contentType) {
      const resourceType = sniffer.getResourceTypeByMime(contentType);
      if (resourceType !== ResourceType.OTHER) {
        return settings.sniffer.detectTypes.includes(resourceType);
      }
    }

    // 根据文件扩展名判断
    const resourceType = sniffer.getResourceTypeByExtension(url);
    if (resourceType !== ResourceType.OTHER) {
      return settings.sniffer.detectTypes.includes(resourceType);
    }

    return false;
  }

  /**
   * 检查是否是忽略的 URL
   * @param {string} url - URL
   * @returns {boolean} 是否忽略
   */
  isIgnoredUrl(url) {
    const settings = storage.getSettings();
    const blockedDomains = settings.filter.blockedDomains || [];

    try {
      const urlObj = new URL(url);

      // 检查阻止的域名
      if (blockedDomains.some(domain => urlObj.hostname.includes(domain))) {
        return true;
      }

      // 忽略常见的非资源请求
      const ignoredPatterns = [
        /\.js$/,
        /\.css$/,
        /\.html$/,
        /\.php$/,
        /\.asp$/,
        /\.aspx$/,
        /\.jsp$/,
        /analytics/,
        /tracking/,
        /advertisement/,
        /ads\./
      ];

      return ignoredPatterns.some(pattern => pattern.test(url));
    } catch {
      return false;
    }
  }

  /**
   * 添加标签页资源
   * @param {number} tabId - 标签页 ID
   * @param {string} resourceId - 资源 ID
   */
  addTabResource(tabId, resourceId) {
    if (!this.tabResources.has(tabId)) {
      this.tabResources.set(tabId, new Set());
    }
    this.tabResources.get(tabId).add(resourceId);
  }

  /**
   * 获取标签页资源
   * @param {number} tabId - 标签页 ID
   * @returns {Array} 资源列表
   */
  getTabResources(tabId) {
    const resourceIds = this.tabResources.get(tabId) || new Set();
    return Array.from(resourceIds)
      .map(id => sniffer.resources.get(id))
      .filter(Boolean);
  }

  /**
   * 更新插件徽章
   * @param {number} tabId - 标签页 ID
   */
  updateBadge(tabId) {
    const resources = this.getTabResources(tabId);
    const count = resources.length;

    chrome.action.setBadgeText({
      text: count > 0 ? count.toString() : '',
      tabId: tabId
    });

    chrome.action.setBadgeBackgroundColor({
      color: count > 0 ? '#4CAF50' : '#9E9E9E',
      tabId: tabId
    });
  }

  /**
   * 处理标签页更新
   * @param {number} tabId - 标签页 ID
   * @param {Object} changeInfo - 变更信息
   * @param {Object} tab - 标签页信息
   */
  handleTabUpdated(tabId, changeInfo, tab) {
    // 页面加载完成时清除旧资源
    if (changeInfo.status === 'loading') {
      sniffer.clearResourcesByTabId(tabId);
      this.tabResources.delete(tabId);
      this.updateBadge(tabId);
    }
  }

  /**
   * 处理标签页关闭
   * @param {number} tabId - 标签页 ID
   */
  handleTabRemoved(tabId) {
    sniffer.clearResourcesByTabId(tabId);
    this.tabResources.delete(tabId);
  }

  /**
   * 处理消息
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @param {Function} sendResponse - 响应函数
   * @returns {boolean} 是否异步响应
   */
  handleMessage(message, sender, sendResponse) {
    switch (message.action) {
      case 'getResources':
        this.handleGetResources(message, sendResponse);
        break;

      case 'downloadResource':
        this.handleDownloadResource(message, sendResponse);
        break;

      case 'downloadSelected':
        this.handleDownloadSelected(message, sendResponse);
        break;

      case 'clearResources':
        this.handleClearResources(message, sendResponse);
        break;

      case 'updateSettings':
        this.handleUpdateSettings(message, sendResponse);
        break;

      case 'getSettings':
        this.handleGetSettings(message, sendResponse);
        break;

      case 'toggleResourceSelection':
        this.handleToggleResourceSelection(message, sendResponse);
        break;

      case 'selectAllResources':
        this.handleSelectAllResources(message, sendResponse);
        break;

      default:
        sendResponse({ error: 'Unknown action' });
    }

    return true; // 异步响应
  }

  /**
   * 处理获取资源请求
   * @param {Object} message - 消息对象
   * @param {Function} sendResponse - 响应函数
   */
  handleGetResources(message, sendResponse) {
    const tabId = message.tabId;
    const resources = tabId ? this.getTabResources(tabId) : sniffer.getAllResources();
    const filteredResources = sniffer.getFilteredResources();
    const statistics = sniffer.getStatistics();

    sendResponse({
      resources: filteredResources,
      statistics: statistics,
      total: resources.length
    });
  }

  /**
   * 处理下载资源请求
   * @param {Object} message - 消息对象
   * @param {Function} sendResponse - 响应函数
   */
  async handleDownloadResource(message, sendResponse) {
    try {
      const resource = message.resource;
      const downloadId = await downloader.downloadResource(resource);
      sendResponse({ success: true, downloadId: downloadId });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * 处理批量下载请求
   * @param {Object} message - 消息对象
   * @param {Function} sendResponse - 响应函数
   */
  async handleDownloadSelected(message, sendResponse) {
    try {
      const selectedResources = sniffer.getSelectedResources();
      if (selectedResources.length === 0) {
        sendResponse({ success: false, error: '没有选中的资源' });
        return;
      }

      const results = await downloader.downloadResources(selectedResources);
      sendResponse({ success: true, results: results });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * 处理清除资源请求
   * @param {Object} message - 消息对象
   * @param {Function} sendResponse - 响应函数
   */
  handleClearResources(message, sendResponse) {
    const tabId = message.tabId;
    if (tabId) {
      sniffer.clearResourcesByTabId(tabId);
      this.tabResources.delete(tabId);
      this.updateBadge(tabId);
    } else {
      sniffer.clearResources();
      this.tabResources.clear();
    }
    sendResponse({ success: true });
  }

  /**
   * 处理更新设置请求
   * @param {Object} message - 消息对象
   * @param {Function} sendResponse - 响应函数
   */
  async handleUpdateSettings(message, sendResponse) {
    try {
      await storage.updateSettings(message.settings);
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * 处理获取设置请求
   * @param {Object} message - 消息对象
   * @param {Function} sendResponse - 响应函数
   */
  handleGetSettings(message, sendResponse) {
    const settings = storage.getSettings();
    sendResponse({ settings: settings });
  }

  /**
   * 处理切换资源选中状态
   * @param {Object} message - 消息对象
   * @param {Function} sendResponse - 响应函数
   */
  handleToggleResourceSelection(message, sendResponse) {
    const selected = sniffer.toggleResourceSelection(message.resourceId);
    sendResponse({ success: true, selected: selected });
  }

  /**
   * 处理全选/取消全选资源
   * @param {Object} message - 消息对象
   * @param {Function} sendResponse - 响应函数
   */
  handleSelectAllResources(message, sendResponse) {
    sniffer.selectAllResources(message.selected);
    sendResponse({ success: true });
  }

  /**
   * 处理下载进度
   * @param {string} downloadId - 下载 ID
   * @param {number} progress - 进度
   */
  handleDownloadProgress(downloadId, progress) {
    // 通知 popup 更新进度
    chrome.runtime.sendMessage({
      action: 'downloadProgress',
      downloadId: downloadId,
      progress: progress
    }).catch(() => {
      // popup 可能已关闭，忽略错误
    });
  }

  /**
   * 处理下载完成
   * @param {string} downloadId - 下载 ID
   */
  handleDownloadComplete(downloadId) {
    // 通知 popup 下载完成
    chrome.runtime.sendMessage({
      action: 'downloadComplete',
      downloadId: downloadId
    }).catch(() => {
      // popup 可能已关闭，忽略错误
    });

    // 显示通知
    const settings = storage.getSettings();
    if (settings.ui.showNotifications) {
      this.showNotification('下载完成', '资源已成功下载');
    }
  }

  /**
   * 处理下载错误
   * @param {string} downloadId - 下载 ID
   * @param {Error} error - 错误对象
   */
  handleDownloadError(downloadId, error) {
    // 通知 popup 下载错误
    chrome.runtime.sendMessage({
      action: 'downloadError',
      downloadId: downloadId,
      error: error.message
    }).catch(() => {
      // popup 可能已关闭，忽略错误
    });

    // 显示通知
    const settings = storage.getSettings();
    if (settings.ui.showNotifications) {
      this.showNotification('下载失败', error.message);
    }
  }

  /**
   * 显示通知
   * @param {string} title - 通知标题
   * @param {string} message - 通知内容
   */
  showNotification(title, message) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: title,
      message: message
    });
  }

  /**
   * 处理插件安装/更新
   * @param {Object} details - 安装详情
   */
  handleInstalled(details) {
    if (details.reason === 'install') {
      // 首次安装，打开设置页面
      chrome.runtime.openOptionsPage();
    }
  }
}

// 创建后台脚本实例
const background = new ResourceSnifferBackground();
