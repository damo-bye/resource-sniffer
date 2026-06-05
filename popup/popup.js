/**
 * Popup 弹窗脚本 - 资源嗅探下载器
 * 负责界面交互和与后台脚本通信
 * 支持多浏览器：Chrome、Edge、Firefox、Opera、Brave、Vivaldi、Samsung Internet
 */

// 资源类型图标映射
const RESOURCE_TYPE_ICONS = {
  video: '🎬',
  audio: '🎵',
  image: '🖼️',
  document: '📄',
  archive: '📦',
  other: '📁'
};

// 资源类型名称映射
const RESOURCE_TYPE_NAMES = {
  video: '视频',
  audio: '音频',
  image: '图片',
  document: '文档',
  archive: '压缩包',
  other: '其他'
};

// 浏览器信息映射
const BROWSER_INFO = {
  chrome: { name: 'Chrome', icon: '🌐' },
  edge: { name: 'Edge', icon: '🔷' },
  firefox: { name: 'Firefox', icon: '🦊' },
  opera: { name: 'Opera', icon: '🔴' },
  brave: { name: 'Brave', icon: '🦁' },
  vivaldi: { name: 'Vivaldi', icon: '🟣' },
  samsung: { name: 'Samsung Internet', icon: '📱' },
  unknown: { name: 'Unknown', icon: '❓' }
};

// 当前状态
let currentTabId = null;
let currentResources = [];
let selectedResources = new Set();
let currentFilter = 'all';
let currentSort = 'time';
let searchQuery = '';

/**
 * Popup 控制器类
 */
class PopupController {
  constructor() {
    this.init();
  }

  /**
   * 初始化
   */
  async init() {
    // 检测浏览器
    this.detectBrowser();

    // 获取当前标签页
    await this.getCurrentTab();

    // 绑定事件监听器
    this.bindEventListeners();

    // 加载资源列表
    await this.loadResources();

    // 监听来自后台脚本的消息
    this.listenForMessages();

    console.log('Popup 已初始化');
  }

  /**
   * 检测浏览器类型
   */
  detectBrowser() {
    const ua = navigator.userAgent.toLowerCase();
    let browserType = 'unknown';

    if (ua.includes('firefox')) {
      browserType = 'firefox';
    } else if (ua.includes('opr') || ua.includes('opera')) {
      browserType = 'opera';
    } else if (ua.includes('edg') || ua.includes('edge')) {
      browserType = 'edge';
    } else if (ua.includes('vivaldi')) {
      browserType = 'vivaldi';
    } else if (navigator.brave && navigator.brave.isBrave) {
      browserType = 'brave';
    } else if (ua.includes('samsungbrowser')) {
      browserType = 'samsung';
    } else if (ua.includes('chrome')) {
      browserType = 'chrome';
    }

    const info = BROWSER_INFO[browserType];
    document.getElementById('browserIcon').textContent = info.icon;
    document.getElementById('browserName').textContent = info.name;

    // 提取版本号
    let version = '';
    switch (browserType) {
      case 'chrome':
        version = ua.match(/chrome\/(\d+\.\d+)/)?.[1] || '';
        break;
      case 'edge':
        version = ua.match(/edg\/(\d+\.\d+)/)?.[1] || '';
        break;
      case 'firefox':
        version = ua.match(/firefox\/(\d+\.\d+)/)?.[1] || '';
        break;
      case 'opera':
        version = ua.match(/opr\/(\d+\.\d+)/)?.[1] || '';
        break;
      case 'vivaldi':
        version = ua.match(/vivaldi\/(\d+\.\d+)/)?.[1] || '';
        break;
      case 'samsung':
        version = ua.match(/samsungbrowser\/(\d+\.\d+)/)?.[1] || '';
        break;
    }

    if (version) {
      document.getElementById('browserVersion').textContent = `v${version}`;
    }
  }

  /**
   * 获取当前标签页
   */
  async getCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTabId = tab?.id;
    } catch (error) {
      console.error('获取当前标签页失败:', error);
    }
  }

  /**
   * 绑定事件监听器
   */
  bindEventListeners() {
    // 头部按钮
    document.getElementById('btnSettings').addEventListener('click', () => this.openSettings());
    document.getElementById('btnRefresh').addEventListener('click', () => this.refreshResources());
    document.getElementById('btnClear').addEventListener('click', () => this.clearResources());

    // 筛选按钮
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.type));
    });

    // 搜索输入
    document.getElementById('searchInput').addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      this.renderResourceList();
    });

    // 排序选择
    document.getElementById('sortBy').addEventListener('change', (e) => {
      currentSort = e.target.value;
      this.renderResourceList();
    });

    // 全选复选框
    document.getElementById('selectAll').addEventListener('change', (e) => {
      this.toggleSelectAll(e.target.checked);
    });

    // 底部按钮
    document.getElementById('btnDownloadSelected').addEventListener('click', () => this.downloadSelected());
    document.getElementById('btnPreview').addEventListener('click', () => this.previewSelected());
    document.getElementById('btnDownloadAll').addEventListener('click', () => this.downloadAll());

    // 预览模态框
    document.getElementById('btnClosePreview').addEventListener('click', () => this.closePreviewModal());
    document.getElementById('btnClosePreviewFooter').addEventListener('click', () => this.closePreviewModal());
    document.getElementById('btnDownloadPreview').addEventListener('click', () => this.downloadPreviewResource());

    // 下载模态框
    document.getElementById('btnCloseDownload').addEventListener('click', () => this.closeDownloadModal());
    document.getElementById('btnCloseDownloadFooter').addEventListener('click', () => this.closeDownloadModal());
    document.getElementById('btnCancelDownload').addEventListener('click', () => this.cancelDownload());
  }

  /**
   * 监听来自后台脚本的消息
   */
  listenForMessages() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case 'downloadProgress':
          this.updateDownloadProgress(message.downloadId, message.progress);
          break;
        case 'downloadComplete':
          this.handleDownloadComplete(message.downloadId);
          break;
        case 'downloadError':
          this.handleDownloadError(message.downloadId, message.error);
          break;
      }
    });
  }

  /**
   * 加载资源列表
   */
  async loadResources() {
    try {
      const response = await this.sendMessage({
        action: 'getResources',
        tabId: currentTabId
      });

      if (response) {
        currentResources = response.resources || [];
        this.updateStatistics(response.statistics);
        this.renderResourceList();
      }
    } catch (error) {
      console.error('加载资源失败:', error);
      this.showError('加载资源失败，请重试');
    }
  }

  /**
   * 渲染资源列表
   */
  renderResourceList() {
    const container = document.getElementById('resourceList');
    const filteredResources = this.getFilteredResources();

    if (filteredResources.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-text">暂未检测到资源</div>
          <div class="empty-hint">请浏览网页内容，资源将自动检测</div>
        </div>
      `;
      this.updateButtons();
      return;
    }

    container.innerHTML = filteredResources.map(resource => this.createResourceItem(resource)).join('');
    this.updateButtons();
  }

  /**
   * 创建资源项 HTML
   * @param {Object} resource - 资源对象
   * @returns {string} HTML 字符串
   */
  createResourceItem(resource) {
    const isSelected = selectedResources.has(resource.id);
    const icon = RESOURCE_TYPE_ICONS[resource.type] || RESOURCE_TYPE_ICONS.other;
    const typeName = RESOURCE_TYPE_NAMES[resource.type] || RESOURCE_TYPE_NAMES.other;
    const size = this.formatFileSize(resource.size);
    const filename = this.truncateFilename(resource.filename, 30);

    return `
      <div class="resource-item ${isSelected ? 'selected' : ''}" data-id="${resource.id}">
        <div class="resource-checkbox">
          <input type="checkbox" ${isSelected ? 'checked' : ''} data-id="${resource.id}" />
        </div>
        <div class="resource-icon">${icon}</div>
        <div class="resource-info">
          <div class="resource-name" title="${resource.filename}">${filename}</div>
          <div class="resource-meta">
            <span class="resource-type">${typeName}</span>
            <span class="resource-size">${size}</span>
          </div>
        </div>
        <div class="resource-actions">
          <button class="btn-action preview" data-id="${resource.id}" title="预览">👁️</button>
          <button class="btn-action download" data-id="${resource.id}" title="下载">⬇️</button>
        </div>
      </div>
    `;
  }

  /**
   * 获取过滤后的资源
   * @returns {Array} 过滤后的资源列表
   */
  getFilteredResources() {
    let resources = [...currentResources];

    // 按类型过滤
    if (currentFilter !== 'all') {
      resources = resources.filter(r => r.type === currentFilter);
    }

    // 按搜索词过滤
    if (searchQuery) {
      resources = resources.filter(r =>
        r.filename.toLowerCase().includes(searchQuery) ||
        r.url.toLowerCase().includes(searchQuery)
      );
    }

    // 排序
    resources.sort((a, b) => {
      switch (currentSort) {
        case 'time':
          return b.timestamp - a.timestamp;
        case 'size':
          return b.size - a.size;
        case 'name':
          return a.filename.localeCompare(b.filename);
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

    return resources;
  }

  /**
   * 更新统计信息
   * @param {Object} statistics - 统计信息
   */
  updateStatistics(statistics) {
    if (!statistics) return;

    document.getElementById('totalCount').textContent = `总数: ${statistics.total || 0}`;
    document.getElementById('selectedCount').textContent = `已选: ${selectedResources.size}`;
    document.getElementById('downloadCount').textContent = `下载: ${statistics.byType ? Object.values(statistics.byType).reduce((a, b) => a + b, 0) : 0}`;
  }

  /**
   * 更新按钮状态
   */
  updateButtons() {
    const hasSelected = selectedResources.size > 0;
    const hasResources = currentResources.length > 0;

    document.getElementById('btnDownloadSelected').disabled = !hasSelected;
    document.getElementById('btnPreview').disabled = !hasSelected || selectedResources.size > 1;
    document.getElementById('btnDownloadAll').disabled = !hasResources;
    document.getElementById('selectAll').checked = selectedResources.size === currentResources.length && currentResources.length > 0;
  }

  /**
   * 设置筛选类型
   * @param {string} type - 资源类型
   */
  setFilter(type) {
    currentFilter = type;

    // 更新按钮状态
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === type);
    });

    this.renderResourceList();
  }

  /**
   * 切换资源选中状态
   * @param {string} resourceId - 资源 ID
   * @param {boolean} selected - 选中状态
   */
  toggleResourceSelection(resourceId, selected) {
    if (selected) {
      selectedResources.add(resourceId);
    } else {
      selectedResources.delete(resourceId);
    }

    // 通知后台脚本
    this.sendMessage({
      action: 'toggleResourceSelection',
      resourceId: resourceId
    });

    this.updateButtons();
    this.updateStatistics();
  }

  /**
   * 全选/取消全选
   * @param {boolean} selected - 选中状态
   */
  toggleSelectAll(selected) {
    const filteredResources = this.getFilteredResources();

    if (selected) {
      filteredResources.forEach(r => selectedResources.add(r.id));
    } else {
      selectedResources.clear();
    }

    // 通知后台脚本
    this.sendMessage({
      action: 'selectAllResources',
      selected: selected
    });

    this.renderResourceList();
  }

  /**
   * 刷新资源
   */
  async refreshResources() {
    try {
      // 通知内容脚本刷新
      if (currentTabId) {
        await chrome.tabs.sendMessage(currentTabId, { action: 'refreshResources' });
      }

      // 重新加载资源
      await this.loadResources();
      this.showSuccess('资源已刷新');
    } catch (error) {
      console.error('刷新资源失败:', error);
      this.showError('刷新资源失败');
    }
  }

  /**
   * 清除资源
   */
  async clearResources() {
    if (!confirm('确定要清除所有检测到的资源吗？')) return;

    try {
      await this.sendMessage({
        action: 'clearResources',
        tabId: currentTabId
      });

      currentResources = [];
      selectedResources.clear();
      this.renderResourceList();
      this.showSuccess('资源已清除');
    } catch (error) {
      console.error('清除资源失败:', error);
      this.showError('清除资源失败');
    }
  }

  /**
   * 下载选中的资源
   */
  async downloadSelected() {
    if (selectedResources.size === 0) {
      this.showWarning('请先选择要下载的资源');
      return;
    }

    this.showDownloadModal();

    try {
      const response = await this.sendMessage({
        action: 'downloadSelected'
      });

      if (response && response.success) {
        this.showSuccess('下载任务已开始');
      } else {
        this.showError(response?.error || '下载失败');
      }
    } catch (error) {
      console.error('下载失败:', error);
      this.showError('下载失败，请重试');
    }
  }

  /**
   * 下载所有资源
   */
  async downloadAll() {
    if (currentResources.length === 0) {
      this.showWarning('没有可下载的资源');
      return;
    }

    // 选中所有资源
    this.toggleSelectAll(true);

    // 开始下载
    await this.downloadSelected();
  }

  /**
   * 预览选中的资源
   */
  previewSelected() {
    if (selectedResources.size !== 1) {
      this.showWarning('请选择一个资源进行预览');
      return;
    }

    const resourceId = Array.from(selectedResources)[0];
    const resource = currentResources.find(r => r.id === resourceId);

    if (resource) {
      this.showPreviewModal(resource);
    }
  }

  /**
   * 显示预览模态框
   * @param {Object} resource - 资源对象
   */
  showPreviewModal(resource) {
    const modal = document.getElementById('previewModal');
    const title = document.getElementById('previewTitle');
    const body = document.getElementById('previewBody');

    title.textContent = resource.filename;
    body.innerHTML = this.createPreviewContent(resource);

    modal.classList.add('active');

    // 保存当前预览的资源
    this.currentPreviewResource = resource;
  }

  /**
   * 创建预览内容
   * @param {Object} resource - 资源对象
   * @returns {string} HTML 字符串
   */
  createPreviewContent(resource) {
    let previewHtml = '<div class="preview-container">';

    // 根据资源类型创建预览
    switch (resource.type) {
      case 'video':
        previewHtml += `
          <video class="preview-media" controls>
            <source src="${resource.url}" type="${resource.mimeType}">
            您的浏览器不支持视频预览
          </video>
        `;
        break;

      case 'audio':
        previewHtml += `
          <audio class="preview-media" controls style="width: 100%">
            <source src="${resource.url}" type="${resource.mimeType}">
            您的浏览器不支持音频预览
          </audio>
        `;
        break;

      case 'image':
        previewHtml += `
          <img class="preview-media" src="${resource.url}" alt="${resource.filename}" />
        `;
        break;

      default:
        previewHtml += `
          <div class="preview-media" style="padding: 40px; text-align: center; background: #f5f5f5; border-radius: 8px;">
            <div style="font-size: 48px; margin-bottom: 16px;">${RESOURCE_TYPE_ICONS[resource.type] || '📁'}</div>
            <div style="font-size: 16px; color: #666;">此文件类型不支持预览</div>
          </div>
        `;
    }

    // 资源信息
    previewHtml += `
      <div class="preview-info">
        <div class="preview-info-item">
          <span class="preview-info-label">文件名</span>
          <span class="preview-info-value">${resource.filename}</span>
        </div>
        <div class="preview-info-item">
          <span class="preview-info-label">类型</span>
          <span class="preview-info-value">${RESOURCE_TYPE_NAMES[resource.type] || '未知'}</span>
        </div>
        <div class="preview-info-item">
          <span class="preview-info-label">大小</span>
          <span class="preview-info-value">${this.formatFileSize(resource.size)}</span>
        </div>
        <div class="preview-info-item">
          <span class="preview-info-label">URL</span>
          <span class="preview-info-value" style="font-size: 11px; word-break: break-all;">${resource.url}</span>
        </div>
      </div>
    `;

    previewHtml += '</div>';
    return previewHtml;
  }

  /**
   * 关闭预览模态框
   */
  closePreviewModal() {
    const modal = document.getElementById('previewModal');
    modal.classList.remove('active');
    this.currentPreviewResource = null;
  }

  /**
   * 下载预览的资源
   */
  async downloadPreviewResource() {
    if (!this.currentPreviewResource) return;

    try {
      await this.sendMessage({
        action: 'downloadResource',
        resource: this.currentPreviewResource
      });

      this.closePreviewModal();
      this.showSuccess('下载已开始');
    } catch (error) {
      console.error('下载失败:', error);
      this.showError('下载失败');
    }
  }

  /**
   * 显示下载模态框
   */
  showDownloadModal() {
    const modal = document.getElementById('downloadModal');
    modal.classList.add('active');
    this.updateDownloadProgress(null, 0);
  }

  /**
   * 关闭下载模态框
   */
  closeDownloadModal() {
    const modal = document.getElementById('downloadModal');
    modal.classList.remove('active');
  }

  /**
   * 更新下载进度
   * @param {string} downloadId - 下载 ID
   * @param {number} progress - 进度
   */
  updateDownloadProgress(downloadId, progress) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    if (progressFill) {
      progressFill.style.width = `${progress}%`;
    }

    if (progressText) {
      progressText.textContent = progress >= 100 ? '下载完成' : `下载中... ${Math.round(progress)}%`;
    }
  }

  /**
   * 处理下载完成
   * @param {string} downloadId - 下载 ID
   */
  handleDownloadComplete(downloadId) {
    this.updateDownloadProgress(downloadId, 100);
    this.showSuccess('下载完成');
  }

  /**
   * 处理下载错误
   * @param {string} downloadId - 下载 ID
   * @param {string} error - 错误信息
   */
  handleDownloadError(downloadId, error) {
    this.showError(`下载失败: ${error}`);
  }

  /**
   * 取消下载
   */
  cancelDownload() {
    // 发送取消下载消息
    this.sendMessage({ action: 'cancelDownload' });
    this.closeDownloadModal();
    this.showWarning('下载已取消');
  }

  /**
   * 打开设置页面
   */
  openSettings() {
    chrome.runtime.openOptionsPage();
  }

  /**
   * 发送消息到后台脚本
   * @param {Object} message - 消息对象
   * @returns {Promise} 响应结果
   */
  sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的大小
   */
  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '未知';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
  }

  /**
   * 截断文件名
   * @param {string} filename - 文件名
   * @param {number} maxLength - 最大长度
   * @returns {string} 截断后的文件名
   */
  truncateFilename(filename, maxLength) {
    if (!filename) return '未知文件';
    if (filename.length <= maxLength) return filename;

    const extension = filename.split('.').pop();
    const name = filename.substring(0, maxLength - extension.length - 4);
    return `${name}...${extension}`;
  }

  /**
   * 显示成功消息
   * @param {string} message - 消息内容
   */
  showSuccess(message) {
    this.showToast(message, 'success');
  }

  /**
   * 显示错误消息
   * @param {string} message - 消息内容
   */
  showError(message) {
    this.showToast(message, 'error');
  }

  /**
   * 显示警告消息
   * @param {string} message - 消息内容
   */
  showWarning(message) {
    this.showToast(message, 'warning');
  }

  /**
   * 显示提示消息
   * @param {string} message - 消息内容
   * @param {string} type - 消息类型
   */
  showToast(message, type = 'info') {
    // 创建提示元素
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 10px 20px;
      border-radius: 4px;
      color: white;
      font-size: 14px;
      z-index: 10000;
      animation: fadeInOut 3s ease;
    `;

    // 设置背景颜色
    switch (type) {
      case 'success':
        toast.style.backgroundColor = '#4CAF50';
        break;
      case 'error':
        toast.style.backgroundColor = '#f44336';
        break;
      case 'warning':
        toast.style.backgroundColor = '#ff9800';
        break;
      default:
        toast.style.backgroundColor = '#2196F3';
    }

    document.body.appendChild(toast);

    // 3秒后移除
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    10% { opacity: 1; transform: translateX(-50%) translateY(0); }
    90% { opacity: 1; transform: translateX(-50%) translateY(0); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  }
`;
document.head.appendChild(style);

// 初始化 Popup 控制器
const popup = new PopupController();
