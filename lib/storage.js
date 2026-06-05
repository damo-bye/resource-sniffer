/**
 * 存储工具模块
 * 负责管理插件的设置和数据存储
 */

// 默认设置
const DEFAULT_SETTINGS = {
  // 嗅探设置
  sniffer: {
    enabled: true,
    autoDetect: true,
    detectTypes: ['video', 'audio', 'image', 'document', 'archive'],
    minFileSize: 0, // 最小文件大小 (KB)
    maxFileSize: 0, // 最大文件大小 (MB), 0 表示无限制
    ignoreSmallFiles: true,
    smallFileThreshold: 1024 // 忽略小于 1KB 的文件
  },

  // 下载设置
  download: {
    savePath: '', // 保存路径，空表示使用默认路径
    autoDownload: false,
    showSaveDialog: false,
    maxConcurrentDownloads: 3,
    retryOnFail: true,
    maxRetries: 3
  },

  // 界面设置
  ui: {
    theme: 'light', // light, dark, auto
    language: 'zh_CN',
    showNotifications: true,
    showBadge: true,
    badgeType: 'count', // count, type
    compactMode: false
  },

  // 过滤设置
  filter: {
    defaultTypes: ['video', 'audio', 'image', 'document', 'archive'],
    customFilters: [],
    blockedDomains: [],
    blockedPatterns: []
  }
};

/**
 * 存储管理器类
 */
export class StorageManager {
  constructor() {
    this.settings = null;
    this.initialized = false;
  }

  /**
   * 初始化存储管理器
   * @returns {Promise} 初始化结果
   */
  async initialize() {
    try {
      const result = await this.getFromStorage('settings');
      this.settings = result.settings || this.getDefaultSettings();
      this.initialized = true;
      return this.settings;
    } catch (error) {
      console.error('初始化存储管理器失败:', error);
      this.settings = this.getDefaultSettings();
      this.initialized = true;
      return this.settings;
    }
  }

  /**
   * 获取默认设置
   * @returns {Object} 默认设置
   */
  getDefaultSettings() {
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  }

  /**
   * 从存储中获取数据
   * @param {string|Array} keys - 键名
   * @returns {Promise<Object>} 存储的数据
   */
  getFromStorage(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * 保存数据到存储
   * @param {Object} data - 要保存的数据
   * @returns {Promise} 保存结果
   */
  saveToStorage(data) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 从存储中删除数据
   * @param {string|Array} keys - 键名
   * @returns {Promise} 删除结果
   */
  removeFromStorage(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(keys, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 获取设置
   * @returns {Object} 设置对象
   */
  getSettings() {
    return this.settings || this.getDefaultSettings();
  }

  /**
   * 更新设置
   * @param {Object} newSettings - 新设置
   * @returns {Promise} 更新结果
   */
  async updateSettings(newSettings) {
    this.settings = this.mergeSettings(this.settings, newSettings);
    await this.saveToStorage({ settings: this.settings });
    return this.settings;
  }

  /**
   * 深度合并设置
   * @param {Object} target - 目标对象
   * @param {Object} source - 源对象
   * @returns {Object} 合并后的对象
   */
  mergeSettings(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.mergeSettings(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  /**
   * 重置设置为默认值
   * @returns {Promise} 重置结果
   */
  async resetSettings() {
    this.settings = this.getDefaultSettings();
    await this.saveToStorage({ settings: this.settings });
    return this.settings;
  }

  /**
   * 获取指定设置项
   * @param {string} path - 设置路径，如 'sniffer.enabled'
   * @returns {*} 设置值
   */
  getSetting(path) {
    const keys = path.split('.');
    let value = this.settings;
    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return undefined;
      }
    }
    return value;
  }

  /**
   * 更新指定设置项
   * @param {string} path - 设置路径
   * @param {*} value - 新值
   * @returns {Promise} 更新结果
   */
  async updateSetting(path, value) {
    const keys = path.split('.');
    const newSettings = { ...this.settings };
    let current = newSettings;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    return await this.updateSettings(newSettings);
  }

  /**
   * 保存下载历史
   * @param {Array} history - 下载历史
   * @returns {Promise} 保存结果
   */
  async saveDownloadHistory(history) {
    await this.saveToStorage({ downloadHistory: history });
  }

  /**
   * 获取下载历史
   * @returns {Promise<Array>} 下载历史
   */
  async getDownloadHistory() {
    const result = await this.getFromStorage('downloadHistory');
    return result.downloadHistory || [];
  }

  /**
   * 清除下载历史
   * @returns {Promise} 清除结果
   */
  async clearDownloadHistory() {
    await this.removeFromStorage('downloadHistory');
  }

  /**
   * 保存自定义过滤器
   * @param {Array} filters - 过滤器列表
   * @returns {Promise} 保存结果
   */
  async saveCustomFilters(filters) {
    await this.updateSetting('filter.customFilters', filters);
  }

  /**
   * 获取自定义过滤器
   * @returns {Array} 过滤器列表
   */
  getCustomFilters() {
    return this.getSetting('filter.customFilters') || [];
  }

  /**
   * 添加自定义过滤器
   * @param {Object} filter - 过滤器对象
   * @returns {Promise} 添加结果
   */
  async addCustomFilter(filter) {
    const filters = this.getCustomFilters();
    filters.push({
      ...filter,
      id: `filter_${Date.now()}`,
      createdAt: Date.now()
    });
    await this.saveCustomFilters(filters);
    return filters;
  }

  /**
   * 删除自定义过滤器
   * @param {string} filterId - 过滤器 ID
   * @returns {Promise} 删除结果
   */
  async removeCustomFilter(filterId) {
    const filters = this.getCustomFilters().filter(f => f.id !== filterId);
    await this.saveCustomFilters(filters);
    return filters;
  }

  /**
   * 保存阻止的域名列表
   * @param {Array} domains - 域名列表
   * @returns {Promise} 保存结果
   */
  async saveBlockedDomains(domains) {
    await this.updateSetting('filter.blockedDomains', domains);
  }

  /**
   * 获取阻止的域名列表
   * @returns {Array} 域名列表
   */
  getBlockedDomains() {
    return this.getSetting('filter.blockedDomains') || [];
  }

  /**
   * 添加阻止的域名
   * @param {string} domain - 域名
   * @returns {Promise} 添加结果
   */
  async addBlockedDomain(domain) {
    const domains = this.getBlockedDomains();
    if (!domains.includes(domain)) {
      domains.push(domain);
      await this.saveBlockedDomains(domains);
    }
    return domains;
  }

  /**
   * 删除阻止的域名
   * @param {string} domain - 域名
   * @returns {Promise} 删除结果
   */
  async removeBlockedDomain(domain) {
    const domains = this.getBlockedDomains().filter(d => d !== domain);
    await this.saveBlockedDomains(domains);
    return domains;
  }

  /**
   * 导出所有设置
   * @returns {Promise<Object>} 设置数据
   */
  async exportSettings() {
    const settings = this.getSettings();
    const history = await this.getDownloadHistory();
    return {
      settings: settings,
      downloadHistory: history,
      exportTime: Date.now(),
      version: '1.0.0'
    };
  }

  /**
   * 导入设置
   * @param {Object} data - 设置数据
   * @returns {Promise} 导入结果
   */
  async importSettings(data) {
    if (data.settings) {
      await this.updateSettings(data.settings);
    }
    if (data.downloadHistory) {
      await this.saveDownloadHistory(data.downloadHistory);
    }
  }

  /**
   * 清除所有数据
   * @returns {Promise} 清除结果
   */
  async clearAllData() {
    await this.removeFromStorage(['settings', 'downloadHistory']);
    this.settings = this.getDefaultSettings();
  }
}

// 导出单例实例
export const storage = new StorageManager();
