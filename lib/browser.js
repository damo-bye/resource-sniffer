/**
 * 浏览器检测和适配模块
 * 负责检测当前浏览器类型并提供适配功能
 */

/**
 * 支持的浏览器类型
 */
export const BrowserType = {
  CHROME: 'chrome',
  EDGE: 'edge',
  FIREFOX: 'firefox',
  OPERA: 'opera',
  BRAVE: 'brave',
  VIVALDI: 'vivaldi',
  SAMSUNG: 'samsung',
  UNKNOWN: 'unknown'
};

/**
 * 浏览器信息类
 */
class BrowserDetector {
  constructor() {
    this.browserType = BrowserType.UNKNOWN;
    this.browserVersion = '';
    this.isChromiumBased = false;
    this.userAgent = navigator.userAgent;

    this.detect();
  }

  /**
   * 检测浏览器类型
   */
  detect() {
    const ua = this.userAgent.toLowerCase();

    // 检测顺序很重要，因为某些浏览器的 userAgent 包含其他浏览器的标识

    // Firefox
    if (ua.includes('firefox')) {
      this.browserType = BrowserType.FIREFOX;
      this.isChromiumBased = false;
    }
    // Opera (必须在 Chrome 之前检测，因为 Opera 的 userAgent 包含 Chrome)
    else if (ua.includes('opr') || ua.includes('opera')) {
      this.browserType = BrowserType.OPERA;
      this.isChromiumBased = true;
    }
    // Edge (必须在 Chrome 之前检测)
    else if (ua.includes('edg') || ua.includes('edge')) {
      this.browserType = BrowserType.EDGE;
      this.isChromiumBased = true;
    }
    // Vivaldi (必须在 Chrome 之前检测)
    else if (ua.includes('vivaldi')) {
      this.browserType = BrowserType.VIVALDI;
      this.isChromiumBased = true;
    }
    // Brave (Brave 不会在 userAgent 中标识自己，需要特殊检测)
    else if (this.isBrave()) {
      this.browserType = BrowserType.BRAVE;
      this.isChromiumBased = true;
    }
    // Samsung Internet
    else if (ua.includes('samsungbrowser')) {
      this.browserType = BrowserType.SAMSUNG;
      this.isChromiumBased = true;
    }
    // Chrome (放在最后，因为很多浏览器的 userAgent 都包含 Chrome)
    else if (ua.includes('chrome')) {
      this.browserType = BrowserType.CHROME;
      this.isChromiumBased = true;
    }

    // 提取版本号
    this.extractVersion();
  }

  /**
   * 检测是否是 Brave 浏览器
   * Brave 不会在 userAgent 中标识自己，需要通过其他方式检测
   * @returns {boolean} 是否是 Brave
   */
  isBrave() {
    // 检测 Brave 特有的 API
    if (navigator.brave && navigator.brave.isBrave) {
      return true;
    }

    // 检测 Brave 特有的属性
    if (window.chrome && window.chrome.brave) {
      return true;
    }

    return false;
  }

  /**
   * 提取浏览器版本号
   */
  extractVersion() {
    const ua = this.userAgent;
    let version = '';

    switch (this.browserType) {
      case BrowserType.CHROME:
        version = this.extractVersionByPattern(ua, /Chrome\/(\d+\.\d+\.\d+\.\d+)/);
        break;
      case BrowserType.EDGE:
        version = this.extractVersionByPattern(ua, /Edg\/(\d+\.\d+\.\d+\.\d+)/);
        break;
      case BrowserType.FIREFOX:
        version = this.extractVersionByPattern(ua, /Firefox\/(\d+\.\d+)/);
        break;
      case BrowserType.OPERA:
        version = this.extractVersionByPattern(ua, /OPR\/(\d+\.\d+\.\d+\.\d+)/);
        break;
      case BrowserType.VIVALDI:
        version = this.extractVersionByPattern(ua, /Vivaldi\/(\d+\.\d+\.\d+\.\d+)/);
        break;
      case BrowserType.SAMSUNG:
        version = this.extractVersionByPattern(ua, /SamsungBrowser\/(\d+\.\d+)/);
        break;
      default:
        version = 'unknown';
    }

    this.browserVersion = version;
  }

  /**
   * 根据正则表达式提取版本号
   * @param {string} ua - userAgent
   * @param {RegExp} pattern - 正则表达式
   * @returns {string} 版本号
   */
  extractVersionByPattern(ua, pattern) {
    const match = ua.match(pattern);
    return match ? match[1] : 'unknown';
  }

  /**
   * 获取浏览器类型
   * @returns {string} 浏览器类型
   */
  getBrowserType() {
    return this.browserType;
  }

  /**
   * 获取浏览器版本
   * @returns {string} 浏览器版本
   */
  getBrowserVersion() {
    return this.browserVersion;
  }

  /**
   * 是否是 Chromium 内核
   * @returns {boolean} 是否是 Chromium 内核
   */
  isChromium() {
    return this.isChromiumBased;
  }

  /**
   * 获取浏览器名称
   * @returns {string} 浏览器名称
   */
  getBrowserName() {
    const names = {
      [BrowserType.CHROME]: 'Chrome',
      [BrowserType.EDGE]: 'Edge',
      [BrowserType.FIREFOX]: 'Firefox',
      [BrowserType.OPERA]: 'Opera',
      [BrowserType.BRAVE]: 'Brave',
      [BrowserType.VIVALDI]: 'Vivaldi',
      [BrowserType.SAMSUNG]: 'Samsung Internet',
      [BrowserType.UNKNOWN]: 'Unknown'
    };
    return names[this.browserType] || 'Unknown';
  }

  /**
   * 获取浏览器图标
   * @returns {string} 浏览器图标 emoji
   */
  getBrowserIcon() {
    const icons = {
      [BrowserType.CHROME]: '🌐',
      [BrowserType.EDGE]: '🔷',
      [BrowserType.FIREFOX]: '🦊',
      [BrowserType.OPERA]: '🔴',
      [BrowserType.BRAVE]: '🦁',
      [BrowserType.VIVALDI]: '🟣',
      [BrowserType.SAMSUNG]: '📱',
      [BrowserType.UNKNOWN]: '❓'
    };
    return icons[this.browserType] || '❓';
  }

  /**
   * 获取浏览器特定的 API 前缀
   * @returns {string} API 前缀
   */
  getApiPrefix() {
    if (this.browserType === BrowserType.FIREFOX) {
      return 'browser';
    }
    return 'chrome';
  }

  /**
   * 获取浏览器特定的下载行为
   * @returns {Object} 下载行为配置
   */
  getDownloadBehavior() {
    const behaviors = {
      [BrowserType.CHROME]: {
        showSaveDialog: true,
        useBrowserDownload: true,
        supportPause: true
      },
      [BrowserType.EDGE]: {
        showSaveDialog: true,
        useBrowserDownload: true,
        supportPause: true
      },
      [BrowserType.FIREFOX]: {
        showSaveDialog: true,
        useBrowserDownload: true,
        supportPause: true
      },
      [BrowserType.OPERA]: {
        showSaveDialog: true,
        useBrowserDownload: true,
        supportPause: true
      },
      [BrowserType.BRAVE]: {
        showSaveDialog: true,
        useBrowserDownload: true,
        supportPause: true,
        note: 'Brave 可能会阻止某些下载，请检查 Shields 设置'
      },
      [BrowserType.VIVALDI]: {
        showSaveDialog: true,
        useBrowserDownload: true,
        supportPause: true
      },
      [BrowserType.SAMSUNG]: {
        showSaveDialog: false,
        useBrowserDownload: true,
        supportPause: false,
        note: 'Samsung Internet 可能有下载限制'
      }
    };
    return behaviors[this.browserType] || behaviors[BrowserType.CHROME];
  }

  /**
   * 获取浏览器特定的注意事项
   * @returns {Array<string>} 注意事项列表
   */
  getBrowserNotes() {
    const notes = {
      [BrowserType.CHROME]: [
        'Chrome 扩展需要 Manifest V3 支持',
        '某些网站可能需要额外权限'
      ],
      [BrowserType.EDGE]: [
        'Edge 完全兼容 Chrome 扩展',
        '某些功能可能需要 Microsoft 账户登录'
      ],
      [BrowserType.FIREFOX]: [
        'Firefox 使用 Manifest V2/V3',
        '某些 API 可能与 Chrome 有差异',
        '建议使用 Firefox 78+ 版本'
      ],
      [BrowserType.OPERA]: [
        'Opera 完全兼容 Chrome 扩展',
        '某些功能可能需要 VPN 关闭',
        '建议使用 Opera 60+ 版本'
      ],
      [BrowserType.BRAVE]: [
        'Brave 完全兼容 Chrome 扩展',
        'Shields 可能阻止某些功能',
        '建议在设置中调整 Shields 级别',
        '某些网站可能需要添加到白名单'
      ],
      [BrowserType.VIVALDI]: [
        'Vivaldi 完全兼容 Chrome 扩展',
        '高度可定制，某些设置可能影响插件',
        '建议使用 Vivaldi 4.0+ 版本'
      ],
      [BrowserType.SAMSUNG]: [
        'Samsung Internet 基于 Chromium',
        '某些功能可能受限',
        '建议使用最新版本',
        '移动端体验可能不同'
      ]
    };
    return notes[this.browserType] || ['未知浏览器，可能存在兼容性问题'];
  }

  /**
   * 检查浏览器是否支持特定功能
   * @param {string} feature - 功能名称
   * @returns {boolean} 是否支持
   */
  supportsFeature(feature) {
    const support = {
      notifications: [BrowserType.CHROME, BrowserType.EDGE, BrowserType.FIREFOX, BrowserType.OPERA, BrowserType.BRAVE, BrowserType.VIVALDI],
      downloads: [BrowserType.CHROME, BrowserType.EDGE, BrowserType.FIREFOX, BrowserType.OPERA, BrowserType.BRAVE, BrowserType.VIVALDI, BrowserType.SAMSUNG],
      webRequest: [BrowserType.CHROME, BrowserType.EDGE, BrowserType.FIREFOX, BrowserType.OPERA, BrowserType.BRAVE, BrowserType.VIVALDI],
      storage: [BrowserType.CHROME, BrowserType.EDGE, BrowserType.FIREFOX, BrowserType.OPERA, BrowserType.BRAVE, BrowserType.VIVALDI, BrowserType.SAMSUNG],
      tabs: [BrowserType.CHROME, BrowserType.EDGE, BrowserType.FIREFOX, BrowserType.OPERA, BrowserType.BRAVE, BrowserType.VIVALDI]
    };

    return support[feature] ? support[feature].includes(this.browserType) : false;
  }

  /**
   * 获取浏览器兼容性信息
   * @returns {Object} 兼容性信息
   */
  getCompatibilityInfo() {
    return {
      browser: this.getBrowserName(),
      version: this.getBrowserVersion(),
      isChromium: this.isChromiumBased,
      apiPrefix: this.getApiPrefix(),
      downloadBehavior: this.getDownloadBehavior(),
      notes: this.getBrowserNotes(),
      features: {
        notifications: this.supportsFeature('notifications'),
        downloads: this.supportsFeature('downloads'),
        webRequest: this.supportsFeature('webRequest'),
        storage: this.supportsFeature('storage'),
        tabs: this.supportsFeature('tabs')
      }
    };
  }
}

// 导出单例实例
export const browser = new BrowserDetector();
