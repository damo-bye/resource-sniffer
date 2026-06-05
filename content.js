/**
 * 内容脚本 - 资源嗅探下载器
 * 负责在网页中提取资源信息
 * 支持多浏览器：Chrome、Edge、Firefox、Opera、Brave、Vivaldi、Samsung Internet
 */

(function() {
  'use strict';

  // 浏览器检测
  const detectBrowser = () => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('firefox')) return 'firefox';
    if (ua.includes('opr') || ua.includes('opera')) return 'opera';
    if (ua.includes('edg') || ua.includes('edge')) return 'edge';
    if (ua.includes('vivaldi')) return 'vivaldi';
    if (navigator.brave && navigator.brave.isBrave) return 'brave';
    if (ua.includes('samsungbrowser')) return 'samsung';
    if (ua.includes('chrome')) return 'chrome';
    return 'unknown';
  };

  const currentBrowser = detectBrowser();

  // 资源提取器类
  class ResourceExtractor {
    constructor() {
      this.resources = new Map();
      this.observer = null;
      this.init();
    }

    /**
     * 初始化提取器
     */
    init() {
      // 等待页面加载完成后提取资源
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.extractAllResources());
      } else {
        this.extractAllResources();
      }

      // 监听动态加载的资源
      this.observeDOMChanges();

      // 监听来自后台脚本的消息
      chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

      // 记录浏览器信息
      console.log(`资源嗅探下载器 - 内容脚本已加载 (${currentBrowser})`);
    }

    /**
     * 提取所有资源
     */
    extractAllResources() {
      this.extractVideoResources();
      this.extractAudioResources();
      this.extractImageResources();
      this.extractLinkResources();
      this.extractBackgroundImages();
      this.extractSourceResources();

      // 通知后台脚本
      this.notifyBackground();
    }

    /**
     * 提取视频资源
     */
    extractVideoResources() {
      // 提取 video 标签
      const videos = document.querySelectorAll('video');
      videos.forEach(video => {
        // 提取 src 属性
        if (video.src) {
          this.addResource(video.src, 'video', video.currentSrc || video.src);
        }

        // 提取 source 标签
        const sources = video.querySelectorAll('source');
        sources.forEach(source => {
          if (source.src) {
            this.addResource(source.src, 'video', source.type);
          }
        });

        // 提取 poster 属性
        if (video.poster) {
          this.addResource(video.poster, 'image', 'image/jpeg');
        }
      });

      // 提取 embed 和 object 标签中的视频
      const embeds = document.querySelectorAll('embed[src*=".swf"], embed[src*="video"]');
      embeds.forEach(embed => {
        if (embed.src) {
          this.addResource(embed.src, 'video');
        }
      });
    }

    /**
     * 提取音频资源
     */
    extractAudioResources() {
      const audios = document.querySelectorAll('audio');
      audios.forEach(audio => {
        if (audio.src) {
          this.addResource(audio.src, 'audio', audio.currentSrc || audio.src);
        }

        const sources = audio.querySelectorAll('source');
        sources.forEach(source => {
          if (source.src) {
            this.addResource(source.src, 'audio', source.type);
          }
        });
      });
    }

    /**
     * 提取图片资源
     */
    extractImageResources() {
      // 提取 img 标签
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (img.src && !img.src.startsWith('data:')) {
          this.addResource(img.src, 'image', 'image/' + this.getImageType(img.src));
        }

        // 提取 srcset 属性
        if (img.srcset) {
          const srcsetUrls = this.parseSrcset(img.srcset);
          srcsetUrls.forEach(url => {
            this.addResource(url, 'image', 'image/' + this.getImageType(url));
          });
        }
      });

      // 提取 picture 标签
      const pictures = document.querySelectorAll('picture');
      pictures.forEach(picture => {
        const sources = picture.querySelectorAll('source');
        sources.forEach(source => {
          if (source.srcset) {
            const srcsetUrls = this.parseSrcset(source.srcset);
            srcsetUrls.forEach(url => {
              this.addResource(url, 'image', source.type || 'image/' + this.getImageType(url));
            });
          }
        });
      });
    }

    /**
     * 提取链接资源
     */
    extractLinkResources() {
      const links = document.querySelectorAll('a[href]');
      links.forEach(link => {
        const href = link.href;
        if (this.isDownloadableLink(href)) {
          const type = this.getResourceTypeFromUrl(href);
          this.addResource(href, type);
        }
      });
    }

    /**
     * 提取背景图片
     */
    extractBackgroundImages() {
      const elements = document.querySelectorAll('*');
      elements.forEach(element => {
        const style = window.getComputedStyle(element);
        const backgroundImage = style.backgroundImage;

        if (backgroundImage && backgroundImage !== 'none') {
          const urls = this.extractUrlsFromCss(backgroundImage);
          urls.forEach(url => {
            if (!url.startsWith('data:')) {
              this.addResource(url, 'image', 'image/' + this.getImageType(url));
            }
          });
        }
      });
    }

    /**
     * 提取 source 标签资源
     */
    extractSourceResources() {
      const sources = document.querySelectorAll('source');
      sources.forEach(source => {
        if (source.src && source.type) {
          const type = this.getResourceTypeFromMime(source.type);
          this.addResource(source.src, type, source.type);
        }
      });
    }

    /**
     * 添加资源
     * @param {string} url - 资源 URL
     * @param {string} type - 资源类型
     * @param {string} mimeType - MIME 类型
     */
    addResource(url, type, mimeType = '') {
      try {
        // 规范化 URL
        const normalizedUrl = this.normalizeUrl(url);
        if (!normalizedUrl) return;

        // 生成资源 ID
        const resourceId = this.generateResourceId(normalizedUrl);

        // 避免重复
        if (this.resources.has(resourceId)) return;

        // 添加到资源列表
        this.resources.set(resourceId, {
          url: normalizedUrl,
          type: type,
          mimeType: mimeType,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('添加资源失败:', error);
      }
    }

    /**
     * 规范化 URL
     * @param {string} url - 原始 URL
     * @returns {string} 规范化后的 URL
     */
    normalizeUrl(url) {
      if (!url) return null;

      try {
        // 处理相对 URL
        if (url.startsWith('//')) {
          url = window.location.protocol + url;
        } else if (url.startsWith('/')) {
          url = window.location.origin + url;
        } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = new URL(url, window.location.href).href;
        }

        // 验证 URL
        new URL(url);
        return url;
      } catch {
        return null;
      }
    }

    /**
     * 生成资源 ID
     * @param {string} url - 资源 URL
     * @returns {string} 资源 ID
     */
    generateResourceId(url) {
      return btoa(url).replace(/[+/=]/g, '').substring(0, 32);
    }

    /**
     * 获取图片类型
     * @param {string} url - 图片 URL
     * @returns {string} 图片类型
     */
    getImageType(url) {
      const extension = url.split('.').pop().toLowerCase().split('?')[0];
      const typeMap = {
        'jpg': 'jpeg',
        'jpeg': 'jpeg',
        'png': 'png',
        'gif': 'gif',
        'webp': 'webp',
        'svg': 'svg+xml',
        'bmp': 'bmp',
        'ico': 'x-icon'
      };
      return typeMap[extension] || 'jpeg';
    }

    /**
     * 解析 srcset 属性
     * @param {string} srcset - srcset 属性值
     * @returns {Array} URL 列表
     */
    parseSrcset(srcset) {
      if (!srcset) return [];
      return srcset.split(',')
        .map(item => item.trim().split(/\s+/)[0])
        .filter(url => url && !url.startsWith('data:'));
    }

    /**
     * 从 CSS 中提取 URL
     * @param {string} css - CSS 值
     * @returns {Array} URL 列表
     */
    extractUrlsFromCss(css) {
      const urlRegex = /url\(['"]?([^'"()]+)['"]?\)/g;
      const urls = [];
      let match;

      while ((match = urlRegex.exec(css)) !== null) {
        urls.push(match[1]);
      }

      return urls;
    }

    /**
     * 检查是否是可下载的链接
     * @param {string} url - URL
     * @returns {boolean} 是否可下载
     */
    isDownloadableLink(url) {
      const downloadableExtensions = [
        '.mp4', '.webm', '.avi', '.mov', '.mkv', '.flv',
        '.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a',
        '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp',
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        '.zip', '.rar', '.7z', '.tar', '.gz'
      ];

      const urlLower = url.toLowerCase();
      return downloadableExtensions.some(ext => urlLower.includes(ext));
    }

    /**
     * 从 URL 获取资源类型
     * @param {string} url - URL
     * @returns {string} 资源类型
     */
    getResourceTypeFromUrl(url) {
      const urlLower = url.toLowerCase();

      if (urlLower.match(/\.(mp4|webm|avi|mov|mkv|flv|m3u8)(\?|$)/)) {
        return 'video';
      } else if (urlLower.match(/\.(mp3|wav|ogg|aac|flac|m4a)(\?|$)/)) {
        return 'audio';
      } else if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?|$)/)) {
        return 'image';
      } else if (urlLower.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)(\?|$)/)) {
        return 'document';
      } else if (urlLower.match(/\.(zip|rar|7z|tar|gz)(\?|$)/)) {
        return 'archive';
      }

      return 'other';
    }

    /**
     * 从 MIME 类型获取资源类型
     * @param {string} mimeType - MIME 类型
     * @returns {string} 资源类型
     */
    getResourceTypeFromMime(mimeType) {
      if (mimeType.startsWith('video/')) return 'video';
      if (mimeType.startsWith('audio/')) return 'audio';
      if (mimeType.startsWith('image/')) return 'image';
      return 'other';
    }

    /**
     * 监听 DOM 变化
     */
    observeDOMChanges() {
      this.observer = new MutationObserver((mutations) => {
        let shouldNotify = false;

        mutations.forEach(mutation => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                this.extractResourcesFromElement(node);
                shouldNotify = true;
              }
            });
          }
        });

        if (shouldNotify) {
          // 延迟通知，避免频繁更新
          clearTimeout(this.notifyTimeout);
          this.notifyTimeout = setTimeout(() => this.notifyBackground(), 1000);
        }
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    /**
     * 从元素中提取资源
     * @param {Element} element - DOM 元素
     */
    extractResourcesFromElement(element) {
      // 检查元素本身
      if (element.tagName === 'VIDEO' || element.tagName === 'AUDIO') {
        if (element.src) {
          this.addResource(element.src, element.tagName.toLowerCase() === 'video' ? 'video' : 'audio');
        }
      }

      if (element.tagName === 'IMG') {
        if (element.src && !element.src.startsWith('data:')) {
          this.addResource(element.src, 'image');
        }
      }

      if (element.tagName === 'A' && element.href) {
        if (this.isDownloadableLink(element.href)) {
          const type = this.getResourceTypeFromUrl(element.href);
          this.addResource(element.href, type);
        }
      }

      // 检查子元素
      const children = element.querySelectorAll('video, audio, img, a[href]');
      children.forEach(child => {
        if (child.tagName === 'VIDEO' || child.tagName === 'AUDIO') {
          if (child.src) {
            this.addResource(child.src, child.tagName.toLowerCase() === 'video' ? 'video' : 'audio');
          }
        }

        if (child.tagName === 'IMG') {
          if (child.src && !child.src.startsWith('data:')) {
            this.addResource(child.src, 'image');
          }
        }

        if (child.tagName === 'A' && child.href) {
          if (this.isDownloadableLink(child.href)) {
            const type = this.getResourceTypeFromUrl(child.href);
            this.addResource(child.href, type);
          }
        }
      });
    }

    /**
     * 通知后台脚本
     */
    notifyBackground() {
      const resources = Array.from(this.resources.values());
      chrome.runtime.sendMessage({
        action: 'contentResources',
        resources: resources,
        tabId: this.getCurrentTabId()
      }).catch(() => {
        // 忽略错误
      });
    }

    /**
     * 获取当前标签页 ID
     * @returns {number} 标签页 ID
     */
    getCurrentTabId() {
      // 内容脚本无法直接获取 tabId，通过消息获取
      return null;
    }

    /**
     * 处理消息
     * @param {Object} message - 消息对象
     * @param {Object} sender - 发送者信息
     * @param {Function} sendResponse - 响应函数
     */
    handleMessage(message, sender, sendResponse) {
      switch (message.action) {
        case 'getContentResources':
          sendResponse({
            resources: Array.from(this.resources.values())
          });
          break;

        case 'refreshResources':
          this.resources.clear();
          this.extractAllResources();
          sendResponse({
            resources: Array.from(this.resources.values())
          });
          break;
      }
    }
  }

  // 创建资源提取器实例
  const extractor = new ResourceExtractor();
})();
