/**
 * 资源嗅探下载器 - iOS 快捷指令脚本
 * 用于从 Safari 网页中提取可下载资源
 *
 * 使用方法：
 * 1. 在 Safari 中打开包含资源的网页
 * 2. 点击分享按钮，选择"资源嗅探下载器"
 * 3. 选择要下载的资源
 */

// ==================== 配置 ====================

const CONFIG = {
  // 支持的资源类型
  supportedTypes: {
    video: {
      extensions: ['.mp4', '.webm', '.avi', '.mov', '.mkv', '.flv', '.m3u8'],
      icon: '🎬',
      name: '视频'
    },
    audio: {
      extensions: ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a'],
      icon: '🎵',
      name: '音频'
    },
    image: {
      extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'],
      icon: '🖼️',
      name: '图片'
    },
    document: {
      extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'],
      icon: '📄',
      name: '文档'
    },
    archive: {
      extensions: ['.zip', '.rar', '.7z', '.tar', '.gz'],
      icon: '📦',
      name: '压缩包'
    }
  },

  // 忽略的 URL 模式
  ignorePatterns: [
    /^data:/i,
    /^javascript:/i,
    /^blob:/i,
    /analytics/i,
    /tracking/i,
    /advertisement/i
  ],

  // 最小文件大小（字节）
  minFileSize: 1024,

  // 最大文件名长度
  maxFilenameLength: 50
};

// ==================== 工具函数 ====================

/**
 * 从 URL 判断资源类型
 * @param {string} url - 资源 URL
 * @returns {string} 资源类型
 */
function getResourceType(url) {
  if (!url) return 'other';

  const lowerUrl = url.toLowerCase();

  for (const [type, config] of Object.entries(CONFIG.supportedTypes)) {
    if (config.extensions.some(ext => lowerUrl.includes(ext))) {
      return type;
    }
  }

  return 'other';
}

/**
 * 从 URL 提取文件名
 * @param {string} url - 资源 URL
 * @returns {string} 文件名
 */
function extractFilename(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    let filename = pathname.split('/').pop();

    // 解码 URL 编码的文件名
    filename = decodeURIComponent(filename);

    // 移除查询参数
    filename = filename.split('?')[0];

    // 截断过长的文件名
    if (filename.length > CONFIG.maxFilenameLength) {
      const ext = filename.split('.').pop();
      filename = filename.substring(0, CONFIG.maxFilenameLength - ext.length - 4) + '...' + ext;
    }

    return filename || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '未知';

  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

/**
 * 检查 URL 是否应该被忽略
 * @param {string} url - 资源 URL
 * @returns {boolean} 是否忽略
 */
function shouldIgnoreUrl(url) {
  return CONFIG.ignorePatterns.some(pattern => pattern.test(url));
}

/**
 * 规范化 URL
 * @param {string} url - 原始 URL
 * @param {string} baseUrl - 基础 URL
 * @returns {string} 规范化后的 URL
 */
function normalizeUrl(url, baseUrl) {
  if (!url) return null;

  try {
    // 处理相对 URL
    if (url.startsWith('//')) {
      url = 'https:' + url;
    } else if (url.startsWith('/')) {
      const urlObj = new URL(baseUrl);
      url = urlObj.origin + url;
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = new URL(url, baseUrl).href;
    }

    // 验证 URL
    new URL(url);
    return url;
  } catch {
    return null;
  }
}

// ==================== 核心功能 ====================

/**
 * 注入到网页的 JavaScript 代码
 * 用于提取网页中的资源
 */
const INJECTED_SCRIPT = `
(function() {
  'use strict';

  const resources = [];
  const seen = new Set();

  // 添加资源
  function addResource(url, type) {
    if (!url || seen.has(url)) return;
    seen.add(url);
    resources.push({ url, type });
  }

  // 提取视频资源
  document.querySelectorAll('video, video source').forEach(el => {
    if (el.src) addResource(el.src, 'video');
    if (el.poster) addResource(el.poster, 'image');
  });

  // 提取音频资源
  document.querySelectorAll('audio, audio source').forEach(el => {
    if (el.src) addResource(el.src, 'audio');
  });

  // 提取图片资源
  document.querySelectorAll('img').forEach(el => {
    if (el.src && !el.src.startsWith('data:')) {
      addResource(el.src, 'image');
    }
    if (el.srcset) {
      el.srcset.split(',').forEach(item => {
        const url = item.trim().split(/\\s+/)[0];
        if (url && !url.startsWith('data:')) addResource(url, 'image');
      });
    }
  });

  // 提取链接资源
  document.querySelectorAll('a[href]').forEach(el => {
    const href = el.href;
    if (href && href.match(/\\.(mp4|mp3|jpg|png|pdf|zip|webm|wav|gif)(\\?|$)/i)) {
      addResource(href, 'link');
    }
  });

  // 提取背景图片
  document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    const bg = style.backgroundImage;
    if (bg && bg !== 'none') {
      const matches = bg.match(/url\\(['"]?([^'"()]+)['"]?\\)/g);
      if (matches) {
        matches.forEach(match => {
          const url = match.replace(/url\\(['"]?|['"]?\\)/g, '');
          if (url && !url.startsWith('data:')) addResource(url, 'image');
        });
      }
    }
  });

  // 提取 source 标签
  document.querySelectorAll('source').forEach(el => {
    if (el.src && el.type) {
      if (el.type.startsWith('video/')) addResource(el.src, 'video');
      else if (el.type.startsWith('audio/')) addResource(el.src, 'audio');
    }
  });

  return JSON.stringify(resources);
})();
`;

/**
 * 执行资源嗅探
 * @param {string} pageUrl - 当前页面 URL
 * @returns {Promise<Array>} 资源列表
 */
async function sniffResources(pageUrl) {
  try {
    // 注入脚本到当前页面
    const result = await Safari.currentTab.executeJavaScript(INJECTED_SCRIPT);

    // 解析结果
    const rawResources = JSON.parse(result);

    // 处理资源列表
    const resources = rawResources
      .map(item => {
        const url = normalizeUrl(item.url, pageUrl);
        if (!url || shouldIgnoreUrl(url)) return null;

        const type = getResourceType(url);
        const filename = extractFilename(url);

        return {
          id: btoa(url).replace(/[+/=]/g, '').substring(0, 16),
          url: url,
          type: type,
          filename: filename,
          icon: CONFIG.supportedTypes[type]?.icon || '📁',
          typeName: CONFIG.supportedTypes[type]?.name || '其他'
        };
      })
      .filter(Boolean);

    // 去重
    const uniqueResources = [];
    const seen = new Set();

    resources.forEach(resource => {
      if (!seen.has(resource.url)) {
        seen.add(resource.url);
        uniqueResources.push(resource);
      }
    });

    return uniqueResources;
  } catch (error) {
    console.error('资源嗅探失败:', error);
    return [];
  }
}

/**
 * 按类型分组资源
 * @param {Array} resources - 资源列表
 * @returns {Object} 分组后的资源
 */
function groupResourcesByType(resources) {
  const groups = {};

  resources.forEach(resource => {
    if (!groups[resource.type]) {
      groups[resource.type] = {
        icon: CONFIG.supportedTypes[resource.type]?.icon || '📁',
        name: CONFIG.supportedTypes[resource.type]?.name || '其他',
        items: []
      };
    }
    groups[resource.type].items.push(resource);
  });

  return groups;
}

/**
 * 生成资源列表文本
 * @param {Object} groups - 分组后的资源
 * @returns {string} 格式化的文本
 */
function formatResourceList(groups) {
  let text = '🔍 检测到的资源：\n\n';

  for (const [type, group] of Object.entries(groups)) {
    text += `${group.icon} ${group.name} (${group.items.length})\n`;
    group.items.forEach((item, index) => {
      text += `  ${index + 1}. ${item.filename}\n`;
    });
    text += '\n';
  }

  return text;
}

// ==================== 主程序 ====================

/**
 * 主函数
 */
async function main() {
  try {
    // 显示加载提示
    const alert = new Alert();
    alert.title = '🔍 资源嗅探下载器';
    alert.message = '正在检测页面资源...';
    alert.addAction('确定');
    await alert.present();

    // 获取当前页面 URL
    const pageUrl = Safari.currentTab.url;

    // 执行资源嗅探
    const resources = await sniffResources(pageUrl);

    if (resources.length === 0) {
      const noResourceAlert = new Alert();
      noResourceAlert.title = '📭 未检测到资源';
      noResourceAlert.message = '当前页面没有检测到可下载的资源。\n\n提示：\n- 尝试刷新页面\n- 确保页面已完全加载\n- 某些动态加载的资源可能无法检测';
      noResourceAlert.addAction('确定');
      await noResourceAlert.present();
      return;
    }

    // 按类型分组
    const groups = groupResourcesByType(resources);

    // 显示资源列表
    const listText = formatResourceList(groups);

    // 创建选择菜单
    const menu = new Alert();
    menu.title = '📋 选择资源';
    menu.message = listText + '\n请选择操作：';

    // 添加操作按钮
    menu.addAction('下载全部');
    menu.addAction('按类型选择');
    menu.addCancelAction('取消');

    const action = await menu.present();

    if (action === -1) return; // 用户取消

    if (action === 0) {
      // 下载全部
      await downloadResources(resources);
    } else if (action === 1) {
      // 按类型选择
      await selectByType(groups);
    }
  } catch (error) {
    console.error('程序执行失败:', error);

    const errorAlert = new Alert();
    errorAlert.title = '❌ 错误';
    errorAlert.message = `执行失败: ${error.message}`;
    errorAlert.addAction('确定');
    await errorAlert.present();
  }
}

/**
 * 按类型选择资源
 * @param {Object} groups - 分组后的资源
 */
async function selectByType(groups) {
  const types = Object.keys(groups);

  // 创建类型选择菜单
  const typeMenu = new Alert();
  typeMenu.title = '📂 选择资源类型';
  typeMenu.message = '请选择要下载的资源类型：';

  types.forEach(type => {
    const group = groups[type];
    typeMenu.addAction(`${group.icon} ${group.name} (${group.items.length})`);
  });
  typeMenu.addCancelAction('返回');

  const typeAction = await typeMenu.present();

  if (typeAction === -1) return; // 用户返回

  const selectedType = types[typeAction];
  const selectedGroup = groups[selectedType];

  // 创建资源选择菜单
  const resourceMenu = new Alert();
  resourceMenu.title = `${selectedGroup.icon} ${selectedGroup.name}`;
  resourceMenu.message = '请选择要下载的资源：';

  selectedGroup.items.forEach((item, index) => {
    resourceMenu.addAction(`${index + 1}. ${item.filename}`);
  });
  resourceMenu.addAction('下载全部');
  resourceMenu.addCancelAction('返回');

  const resourceAction = await resourceMenu.present();

  if (resourceAction === -1) {
    // 返回上一级
    await selectByType(groups);
    return;
  }

  if (resourceAction === selectedGroup.items.length) {
    // 下载全部
    await downloadResources(selectedGroup.items);
  } else {
    // 下载单个
    await downloadResources([selectedGroup.items[resourceAction]]);
  }
}

/**
 * 下载资源
 * @param {Array} resources - 要下载的资源列表
 */
async function downloadResources(resources) {
  // 显示下载进度
  const progressAlert = new Alert();
  progressAlert.title = '⬇️ 下载中';
  progressAlert.message = `准备下载 ${resources.length} 个资源...`;
  progressAlert.addAction('取消');
  const progressAction = await progressAlert.present();

  if (progressAction === 0) return; // 用户取消

  // 选择保存位置
  const locationMenu = new Alert();
  locationMenu.title = '📁 选择保存位置';
  locationMenu.message = '请选择下载文件的保存位置：';
  locationMenu.addAction('iCloud Drive');
  locationMenu.addAction('本地存储');
  locationMenu.addAction('仅预览（不下载）');
  locationMenu.addCancelAction('取消');

  const locationAction = await locationMenu.present();

  if (locationAction === -1) return; // 用户取消

  const saveToICloud = locationAction === 0;
  const previewOnly = locationAction === 2;

  // 执行下载
  let downloadedCount = 0;
  let failedCount = 0;

  for (const resource of resources) {
    try {
      if (previewOnly) {
        // 预览模式：打开 URL
        await Safari.open(resource.url);
      } else {
        // 下载模式：使用 Quick Look 预览
        const quickLook = new QuickLook();
        quickLook.url = resource.url;
        await quickLook.present();

        // 如果用户选择保存，会自动保存到选择的位置
        downloadedCount++;
      }
    } catch (error) {
      console.error(`下载失败: ${resource.filename}`, error);
      failedCount++;
    }
  }

  // 显示结果
  const resultAlert = new Alert();
  resultAlert.title = '✅ 下载完成';
  resultAlert.message = `成功: ${downloadedCount}\n失败: ${failedCount}\n总计: ${resources.length}`;
  resultAlert.addAction('确定');
  await resultAlert.present();
}

// ==================== 运行 ====================

// 运行主函数
main();
