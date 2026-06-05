/**
 * 设置页面脚本 - 资源嗅探下载器
 * 负责设置的加载、保存和管理
 * 支持多浏览器：Chrome、Edge、Firefox、Opera、Brave、Vivaldi、Samsung Internet
 */

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

/**
 * 设置管理器类
 */
class OptionsManager {
  constructor() {
    this.settings = null;
    this.init();
  }

  /**
   * 初始化
   */
  async init() {
    // 检测浏览器
    this.detectBrowser();

    // 加载设置
    await this.loadSettings();

    // 绑定事件监听器
    this.bindEventListeners();

    console.log('设置页面已初始化');
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

    // 更新浏览器信息显示
    document.getElementById('browserIconDisplay').textContent = info.icon;
    document.getElementById('browserInfoDisplay').textContent = `${info.name} (${ua.match(/(chrome|firefox|edg|opr|vivaldi|samsungbrowser)\/[\d.]+/)?.[0] || 'unknown'})`;

    // 更新兼容性状态
    const isCompatible = ['chrome', 'edge', 'firefox', 'opera', 'brave', 'vivaldi'].includes(browserType);
    document.getElementById('compatibilityIcon').textContent = isCompatible ? '✅' : '⚠️';
    document.getElementById('compatibilityStatus').textContent = isCompatible
      ? '完全兼容，所有功能可用'
      : '部分兼容，某些功能可能受限';

    // 更新浏览器特定注意事项
    const notes = {
      chrome: [
        'Chrome 扩展需要 Manifest V3 支持',
        '某些网站可能需要额外权限'
      ],
      edge: [
        'Edge 完全兼容 Chrome 扩展',
        '某些功能可能需要 Microsoft 账户登录'
      ],
      firefox: [
        'Firefox 使用 Manifest V2/V3',
        '某些 API 可能与 Chrome 有差异',
        '建议使用 Firefox 78+ 版本'
      ],
      opera: [
        'Opera 完全兼容 Chrome 扩展',
        '某些功能可能需要 VPN 关闭',
        '建议使用 Opera 60+ 版本'
      ],
      brave: [
        'Brave 完全兼容 Chrome 扩展',
        'Shields 可能阻止某些功能',
        '建议在设置中调整 Shields 级别',
        '某些网站可能需要添加到白名单'
      ],
      vivaldi: [
        'Vivaldi 完全兼容 Chrome 扩展',
        '高度可定制，某些设置可能影响插件',
        '建议使用 Vivaldi 4.0+ 版本'
      ],
      samsung: [
        'Samsung Internet 基于 Chromium',
        '某些功能可能受限',
        '建议使用最新版本',
        '移动端体验可能不同'
      ],
      unknown: [
        '未知浏览器，可能存在兼容性问题',
        '建议使用 Chrome、Edge、Firefox、Opera、Brave 或 Vivaldi'
      ]
    };

    const notesList = document.getElementById('browserNotes');
    notesList.innerHTML = notes[browserType].map(note => `<li>${note}</li>`).join('');
  }

  /**
   * 加载设置
   */
  async loadSettings() {
    try {
      const response = await this.sendMessage({ action: 'getSettings' });
      if (response && response.settings) {
        this.settings = response.settings;
        this.applySettings();
      } else {
        this.settings = this.getDefaultSettings();
        this.applySettings();
      }
    } catch (error) {
      console.error('加载设置失败:', error);
      this.settings = this.getDefaultSettings();
      this.applySettings();
    }
  }

  /**
   * 获取默认设置
   * @returns {Object} 默认设置
   */
  getDefaultSettings() {
    return {
      sniffer: {
        enabled: true,
        autoDetect: true,
        detectTypes: ['video', 'audio', 'image', 'document', 'archive'],
        minFileSize: 0,
        maxFileSize: 0,
        ignoreSmallFiles: true,
        smallFileThreshold: 1024
      },
      download: {
        savePath: '',
        autoDownload: false,
        showSaveDialog: false,
        maxConcurrentDownloads: 3,
        retryOnFail: true,
        maxRetries: 3
      },
      ui: {
        theme: 'light',
        language: 'zh_CN',
        showNotifications: true,
        showBadge: true,
        badgeType: 'count',
        compactMode: false
      },
      filter: {
        defaultTypes: ['video', 'audio', 'image', 'document', 'archive'],
        customFilters: [],
        blockedDomains: [],
        blockedPatterns: []
      }
    };
  }

  /**
   * 将设置应用到界面
   */
  applySettings() {
    if (!this.settings) return;

    // 嗅探设置
    document.getElementById('snifferEnabled').checked = this.settings.sniffer.enabled;
    document.getElementById('detectVideo').checked = this.settings.sniffer.detectTypes.includes('video');
    document.getElementById('detectAudio').checked = this.settings.sniffer.detectTypes.includes('audio');
    document.getElementById('detectImage').checked = this.settings.sniffer.detectTypes.includes('image');
    document.getElementById('detectDocument').checked = this.settings.sniffer.detectTypes.includes('document');
    document.getElementById('detectArchive').checked = this.settings.sniffer.detectTypes.includes('archive');
    document.getElementById('minFileSize').value = this.settings.sniffer.minFileSize;
    document.getElementById('maxFileSize').value = this.settings.sniffer.maxFileSize;
    document.getElementById('smallFileThreshold').value = this.settings.sniffer.smallFileThreshold;

    // 下载设置
    document.getElementById('savePath').value = this.settings.download.savePath;
    document.getElementById('maxConcurrentDownloads').value = this.settings.download.maxConcurrentDownloads;
    document.getElementById('showSaveDialog').checked = this.settings.download.showSaveDialog;
    document.getElementById('retryOnFail').checked = this.settings.download.retryOnFail;
    document.getElementById('maxRetries').value = this.settings.download.maxRetries;

    // 界面设置
    document.getElementById('theme').value = this.settings.ui.theme;
    document.getElementById('language').value = this.settings.ui.language;
    document.getElementById('showNotifications').checked = this.settings.ui.showNotifications;
    document.getElementById('showBadge').checked = this.settings.ui.showBadge;
    document.getElementById('compactMode').checked = this.settings.ui.compactMode;

    // 过滤设置
    document.getElementById('blockedDomains').value = (this.settings.filter.blockedDomains || []).join('\n');
    document.getElementById('customFilters').value = (this.settings.filter.blockedPatterns || []).join('\n');
  }

  /**
   * 从界面收集设置
   * @returns {Object} 收集到的设置
   */
  collectSettings() {
    // 收集检测类型
    const detectTypes = [];
    if (document.getElementById('detectVideo').checked) detectTypes.push('video');
    if (document.getElementById('detectAudio').checked) detectTypes.push('audio');
    if (document.getElementById('detectImage').checked) detectTypes.push('image');
    if (document.getElementById('detectDocument').checked) detectTypes.push('document');
    if (document.getElementById('detectArchive').checked) detectTypes.push('archive');

    // 收集阻止的域名
    const blockedDomains = document.getElementById('blockedDomains').value
      .split('\n')
      .map(d => d.trim())
      .filter(d => d.length > 0);

    // 收集自定义过滤规则
    const blockedPatterns = document.getElementById('customFilters').value
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    return {
      sniffer: {
        enabled: document.getElementById('snifferEnabled').checked,
        autoDetect: true,
        detectTypes: detectTypes,
        minFileSize: parseInt(document.getElementById('minFileSize').value) || 0,
        maxFileSize: parseInt(document.getElementById('maxFileSize').value) || 0,
        ignoreSmallFiles: true,
        smallFileThreshold: parseInt(document.getElementById('smallFileThreshold').value) || 1024
      },
      download: {
        savePath: document.getElementById('savePath').value,
        autoDownload: false,
        showSaveDialog: document.getElementById('showSaveDialog').checked,
        maxConcurrentDownloads: parseInt(document.getElementById('maxConcurrentDownloads').value) || 3,
        retryOnFail: document.getElementById('retryOnFail').checked,
        maxRetries: parseInt(document.getElementById('maxRetries').value) || 3
      },
      ui: {
        theme: document.getElementById('theme').value,
        language: document.getElementById('language').value,
        showNotifications: document.getElementById('showNotifications').checked,
        showBadge: document.getElementById('showBadge').checked,
        badgeType: 'count',
        compactMode: document.getElementById('compactMode').checked
      },
      filter: {
        defaultTypes: detectTypes,
        customFilters: blockedPatterns,
        blockedDomains: blockedDomains,
        blockedPatterns: blockedPatterns
      }
    };
  }

  /**
   * 绑定事件监听器
   */
  bindEventListeners() {
    // 保存按钮
    document.getElementById('btnSave').addEventListener('click', () => this.saveSettings());

    // 导出按钮
    document.getElementById('btnExport').addEventListener('click', () => this.exportSettings());

    // 导入按钮
    document.getElementById('btnImport').addEventListener('click', () => this.importSettings());

    // 清除历史按钮
    document.getElementById('btnClearHistory').addEventListener('click', () => this.clearHistory());

    // 重置按钮
    document.getElementById('btnReset').addEventListener('click', () => this.resetSettings());

    // 帮助按钮
    document.getElementById('btnHelp').addEventListener('click', (e) => {
      e.preventDefault();
      this.showHelp();
    });

    // 反馈按钮
    document.getElementById('btnFeedback').addEventListener('click', (e) => {
      e.preventDefault();
      this.showFeedback();
    });

    // 文件导入
    document.getElementById('importFile').addEventListener('change', (e) => this.handleImportFile(e));

    // 监听设置变化
    this.bindSettingChangeListeners();
  }

  /**
   * 绑定设置变化监听器
   */
  bindSettingChangeListeners() {
    // 监听所有输入框、选择框、复选框的变化
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('change', () => {
        // 标记设置已修改
        this.markSettingsModified();
      });
    });
  }

  /**
   * 标记设置已修改
   */
  markSettingsModified() {
    const saveBtn = document.getElementById('btnSave');
    saveBtn.style.animation = 'pulse 1s infinite';
    saveBtn.title = '设置已修改，请点击保存';
  }

  /**
   * 清除修改标记
   */
  clearModifiedMark() {
    const saveBtn = document.getElementById('btnSave');
    saveBtn.style.animation = 'none';
    saveBtn.title = '保存设置';
  }

  /**
   * 保存设置
   */
  async saveSettings() {
    try {
      const settings = this.collectSettings();
      const response = await this.sendMessage({
        action: 'updateSettings',
        settings: settings
      });

      if (response && response.success) {
        this.settings = settings;
        this.clearModifiedMark();
        this.showNotification('设置已保存', 'success');
      } else {
        this.showNotification('保存失败: ' + (response?.error || '未知错误'), 'error');
      }
    } catch (error) {
      console.error('保存设置失败:', error);
      this.showNotification('保存失败，请重试', 'error');
    }
  }

  /**
   * 导出设置
   */
  async exportSettings() {
    try {
      const settings = this.collectSettings();
      const exportData = {
        settings: settings,
        exportTime: new Date().toISOString(),
        version: '1.0.0'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `resource-sniffer-settings-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showNotification('设置已导出', 'success');
    } catch (error) {
      console.error('导出设置失败:', error);
      this.showNotification('导出失败', 'error');
    }
  }

  /**
   * 导入设置
   */
  importSettings() {
    document.getElementById('importFile').click();
  }

  /**
   * 处理导入文件
   * @param {Event} event - 文件选择事件
   */
  async handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      if (importData.settings) {
        this.settings = importData.settings;
        this.applySettings();
        await this.saveSettings();
        this.showNotification('设置已导入', 'success');
      } else {
        this.showNotification('无效的设置文件', 'error');
      }
    } catch (error) {
      console.error('导入设置失败:', error);
      this.showNotification('导入失败，请检查文件格式', 'error');
    }

    // 清空文件输入
    event.target.value = '';
  }

  /**
   * 清除下载历史
   */
  async clearHistory() {
    if (!confirm('确定要清除所有下载历史吗？此操作不可恢复。')) {
      return;
    }

    try {
      await this.sendMessage({ action: 'clearDownloadHistory' });
      this.showNotification('下载历史已清除', 'success');
    } catch (error) {
      console.error('清除历史失败:', error);
      this.showNotification('清除失败', 'error');
    }
  }

  /**
   * 重置设置
   */
  async resetSettings() {
    if (!confirm('确定要重置所有设置为默认值吗？此操作不可恢复。')) {
      return;
    }

    try {
      this.settings = this.getDefaultSettings();
      this.applySettings();
      await this.saveSettings();
      this.showNotification('设置已重置为默认值', 'success');
    } catch (error) {
      console.error('重置设置失败:', error);
      this.showNotification('重置失败', 'error');
    }
  }

  /**
   * 显示帮助
   */
  showHelp() {
    alert(`资源嗅探下载器 - 帮助

功能说明：
• 自动检测网页中的视频、音频、图片等资源
• 支持资源预览和批量下载
• 可自定义检测规则和过滤条件

使用方法：
1. 浏览网页时，插件会自动检测可下载资源
2. 点击插件图标查看检测到的资源列表
3. 选择需要的资源进行下载

快捷键：
• Ctrl+Shift+D: 打开插件弹窗
• Ctrl+Shift+S: 打开设置页面

问题反馈：
如有问题或建议，请通过反馈按钮联系我们。`);
  }

  /**
   * 显示反馈
   */
  showFeedback() {
    const feedbackUrl = 'https://github.com/your-repo/resource-sniffer/issues';
    window.open(feedbackUrl, '_blank');
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
   * 显示通知
   * @param {string} message - 通知内容
   * @param {string} type - 通知类型
   */
  showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;

    // 显示通知
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // 3秒后隐藏
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
`;
document.head.appendChild(style);

// 初始化设置管理器
const options = new OptionsManager();
