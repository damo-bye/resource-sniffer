# iOS 快捷指令版 - 资源嗅探下载器

由于 iOS 设备对浏览器扩展的支持非常有限，我们提供了一个基于 iOS 快捷指令（Shortcuts）的解决方案，让 iPhone 和 iPad 用户也能享受资源嗅探功能。

## ✨ 功能特点

- ✅ **无需安装 App**：直接使用 iOS 原生快捷指令
- ✅ **Safari 集成**：通过共享表单直接调用
- ✅ **资源分类**：自动识别视频、音频、图片、文档等
- ✅ **一键下载**：支持下载到本地或 iCloud
- ✅ **分享功能**：支持分享到其他应用
- ✅ **免费使用**：无需开发者账号或付费

## 📱 系统要求

- **设备**：iPhone 或 iPad
- **系统**：iOS 14.0 或更高版本
- **应用**：快捷指令（Shortcuts）App
- **浏览器**：Safari（用于网页资源嗅探）

## 🚀 安装方法

### 方法一：直接安装（推荐）

1. **下载快捷指令文件**
   - 在 iPhone/iPad 上打开 Safari
   - 访问本项目的 `ios` 目录
   - 点击下载 `ResourceSniffer.shortcut` 文件

2. **安装快捷指令**
   - 打开"快捷指令" App
   - 点击"我的快捷指令"
   - 点击右上角的 "+" 按钮
   - 选择"添加不受信任的快捷指令"
   - 选择下载的 `ResourceSniffer.shortcut` 文件

3. **允许权限**
   - 首次运行时，系统会请求权限
   - 允许访问网络、下载文件等权限

### 方法二：手动创建

如果无法直接安装，可以按照以下步骤手动创建：

1. **打开快捷指令 App**
2. **创建新快捷指令**
3. **按照下方的脚本配置添加动作**
4. **保存并命名**

## 📖 使用方法

### 基本使用

1. **打开 Safari**
   - 浏览包含资源的网页

2. **调用快捷指令**
   - 点击底部的"分享"按钮（方框带箭头图标）
   - 在分享菜单中找到"资源嗅探下载器"
   - 点击运行

3. **选择资源**
   - 快捷指令会自动检测页面中的资源
   - 显示资源列表，按类型分类
   - 选择要下载的资源

4. **下载资源**
   - 选择下载位置（本地/iCloud）
   - 等待下载完成
   - 可以选择打开或分享下载的文件

### 高级功能

#### 批量下载
- 选择"下载全部"选项
- 快捷指令会下载所有检测到的资源

#### 资源预览
- 选择资源后可以预览
- 视频：显示缩略图和时长
- 音频：显示波形和时长
- 图片：显示预览图

#### 分享资源
- 下载后可以选择分享
- 支持 AirDrop、微信、QQ 等
- 可以保存到"文件" App

## 🔧 快捷指令脚本

以下是快捷指令的核心 JavaScript 代码：

```javascript
// 资源嗅探下载器 - iOS 快捷指令脚本
// 用于从 Safari 网页中提取可下载资源

// 资源类型定义
const ResourceTypes = {
  VIDEO: 'video',
  AUDIO: 'audio',
  IMAGE: 'image',
  DOCUMENT: 'document',
  ARCHIVE: 'archive',
  OTHER: 'other'
};

// 资源类型图标
const TypeIcons = {
  video: '🎬',
  audio: '🎵',
  image: '🖼️',
  document: '📄',
  archive: '📦',
  other: '📁'
};

// 资源类型名称
const TypeNames = {
  video: '视频',
  audio: '音频',
  image: '图片',
  document: '文档',
  archive: '压缩包',
  other: '其他'
};

// 从 URL 判断资源类型
function getResourceType(url) {
  const lowerUrl = url.toLowerCase();

  // 视频类型
  if (lowerUrl.match(/\.(mp4|webm|avi|mov|mkv|flv|m3u8)(\?|$)/)) {
    return ResourceTypes.VIDEO;
  }

  // 音频类型
  if (lowerUrl.match(/\.(mp3|wav|ogg|aac|flac|m4a)(\?|$)/)) {
    return ResourceTypes.AUDIO;
  }

  // 图片类型
  if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?|$)/)) {
    return ResourceTypes.IMAGE;
  }

  // 文档类型
  if (lowerUrl.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)(\?|$)/)) {
    return ResourceTypes.DOCUMENT;
  }

  // 压缩包类型
  if (lowerUrl.match(/\.(zip|rar|7z|tar|gz)(\?|$)/)) {
    return ResourceTypes.ARCHIVE;
  }

  return ResourceTypes.OTHER;
}

// 提取文件名
function extractFilename(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop();
    return filename || 'unknown';
  } catch {
    return 'unknown';
  }
}

// 主函数
function main() {
  // 获取当前网页 URL
  const webpageURL = Safari.currentTab.url;

  // 注入 JavaScript 到网页
  const script = `
    (function() {
      const resources = [];

      // 提取视频资源
      document.querySelectorAll('video, video source').forEach(el => {
        if (el.src) resources.push({ url: el.src, type: 'video' });
        if (el.poster) resources.push({ url: el.poster, type: 'image' });
      });

      // 提取音频资源
      document.querySelectorAll('audio, audio source').forEach(el => {
        if (el.src) resources.push({ url: el.src, type: 'audio' });
      });

      // 提取图片资源
      document.querySelectorAll('img').forEach(el => {
        if (el.src && !el.src.startsWith('data:')) {
          resources.push({ url: el.src, type: 'image' });
        }
      });

      // 提取链接资源
      document.querySelectorAll('a[href]').forEach(el => {
        const href = el.href;
        if (href.match(/\.(mp4|mp3|jpg|png|pdf|zip)(\?|$)/i)) {
          resources.push({ url: href, type: 'link' });
        }
      });

      return JSON.stringify(resources);
    })();
  `;

  // 执行脚本并获取结果
  const result = Safari.currentTab.executeJavaScript(script);

  return result;
}

// 运行主函数
main();
```

## 📋 支持的资源类型

| 类型 | 扩展名 | 说明 |
|------|--------|------|
| 🎬 视频 | mp4, webm, avi, mov, mkv, flv, m3u8 | 在线视频、本地视频 |
| 🎵 音频 | mp3, wav, ogg, aac, flac, m4a | 音乐、播客、音效 |
| 🖼️ 图片 | jpg, jpeg, png, gif, webp, svg, bmp | 照片、插图、图标 |
| 📄 文档 | pdf, doc, docx, xls, xlsx, ppt, pptx | 文档、表格、演示文稿 |
| 📦 压缩包 | zip, rar, 7z, tar, gz | 压缩文件 |

## ⚠️ 注意事项

### 权限要求
- **网络访问**：需要访问网络下载资源
- **文件访问**：需要保存下载的文件
- **Safari 访问**：需要读取当前网页内容

### 限制说明
- **仅限 Safari**：只能在 Safari 浏览器中使用
- **静态资源**：主要检测静态加载的资源
- **无预览功能**：iOS 快捷指令不支持复杂预览
- **无批量下载**：需要逐个选择下载

### 常见问题

**Q: 为什么没有检测到某些资源？**
A: 快捷指令主要检测静态资源，动态加载的资源可能无法检测。尝试刷新页面后重新运行。

**Q: 下载的文件在哪里？**
A: 默认保存到"文件" App 的 iCloud Drive 或本地存储。可以在快捷指令中修改保存位置。

**Q: 支持哪些网站？**
A: 理论上支持所有网站，但某些网站可能有防盗链措施，导致下载失败。

**Q: 如何更新快捷指令？**
A: 下载新版本的快捷指令文件，删除旧版本后安装新版本。

## 🔄 更新日志

### v1.0.0 (2026-06-05)
- 🎉 首次发布
- ✨ 支持视频、音频、图片、文档、压缩包检测
- ✨ 支持一键下载到本地或 iCloud
- ✨ 支持分享到其他应用

## 📞 反馈与支持

如有问题或建议，请通过以下方式反馈：
- GitHub Issues
- 邮件联系开发者

---

**资源嗅探下载器 iOS 快捷指令版** - 让 iPhone/iPad 也能轻松下载网页资源！
