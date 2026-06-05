# Microsoft Edge Add-ons 上传指南

## 📋 准备工作清单

### ✅ 已完成
- [x] 扩展源代码
- [x] 打包脚本 (`package-edge.bat`)
- [x] 商店素材生成工具 (`store-assets/generate-edge-assets.html`)
- [x] 隐私政策页面 (`privacy-policy.html`)
- [x] ZIP 打包文件 (`resource-sniffer-edge.zip`)

### ⏳ 待完成
- [ ] 生成商店素材图片
- [ ] 登录 Microsoft 开发者中心
- [ ] 填写扩展信息
- [ ] 上传素材和扩展包
- [ ] 提交审核

---

## 🚀 详细上传步骤

### 第一步：生成商店素材

#### 方式 A：使用在线工具（推荐）

1. **打开素材生成工具**
   - 在浏览器中打开：`store-assets/generate-edge-assets.html`
   - 或者直接访问 GitHub 上的文件

2. **下载素材图片**
   - 点击"📥 下载商店图标"按钮（300x300 像素）
   - 点击"📥 下载小型促销图"按钮（440x280 像素）
   - 点击"📥 下载大型促销图"按钮（1400x560 像素）

3. **保存到文件夹**
   - 创建 `edge-assets` 文件夹
   - 将下载的图片移动到该文件夹

#### 方式 B：使用打包脚本

1. **运行脚本**
   - 双击 `store-assets/generate-edge-assets.bat`
   - 按照提示操作

2. **下载素材**
   - 在浏览器中点击下载按钮
   - 将文件保存到 `edge-assets` 文件夹

---

### 第二步：生成截图

Microsoft Edge Add-ons 要求至少 1 张截图（1280x800 像素）。

#### 生成截图的方法：

1. **使用浏览器开发者工具**
   - 打开扩展的弹窗页面
   - 按 F12 打开开发者工具
   - 点击设备模拟按钮（手机图标）
   - 设置分辨率为 1280x800
   - 截图保存

2. **使用截图工具**
   - Windows：使用"截图工具"或按 Win+Shift+S
   - Mac：使用 Command+Shift+4

3. **建议的截图内容**
   - 扩展弹窗界面（显示资源列表）
   - 资源预览功能
   - 下载进度界面
   - 设置页面

---

### 第三步：登录 Microsoft 开发者中心

1. **访问开发者中心**
   - 打开浏览器，访问：https://partner.microsoft.com/dashboard/microsoftedge/overview
   - 使用您的 Microsoft 账号登录

2. **进入扩展管理**
   - 登录后，点击左侧菜单的 "Extensions"
   - 或者直接访问：https://partner.microsoft.com/dashboard/microsoftedge/extensions

---

### 第四步：提交新扩展

1. **开始提交**
   - 点击 "Submit new extension" 按钮
   - 进入扩展提交流程

2. **上传扩展包**
   - 点击 "Upload" 或 "Choose file"
   - 选择打包好的 ZIP 文件：`resource-sniffer-edge.zip`
   - 等待上传完成

---

### 第五步：填写扩展信息

#### 基本信息

| 字段 | 内容 |
|------|------|
| Extension name | 资源嗅探下载器 |
| Description | 智能检测网页中的视频、音频、图片等资源，支持预览和批量下载。支持 Chrome、Edge、Firefox、Opera、Brave、Vivaldi 等主流浏览器。 |
| Category | Productivity |
| Language | 中文（简体）|

#### 详细描述

```
🔍 资源嗅探下载器 - 让资源下载更简单！

✨ 核心功能：
• 智能检测网页中的视频、音频、图片、文档、压缩包等资源
• 支持资源预览（视频/音频在线播放、图片缩放查看）
• 单个和批量下载功能
• 自定义检测规则和过滤条件
• 多浏览器支持（Chrome、Edge、Firefox、Opera、Brave、Vivaldi）

🎯 使用场景：
• 下载在线视频和音频
• 批量保存网页图片
• 下载文档和压缩包
• 资源嗅探和分析

⚡ 技术特点：
• 轻量高效，无框架依赖
• 现代化 UI 设计
• 完善的设置选项
• 跨浏览器兼容

📖 使用方法：
1. 浏览网页时，插件会自动检测可下载资源
2. 点击插件图标查看检测到的资源列表
3. 选择需要的资源进行下载
4. 支持筛选、搜索和批量操作

🔒 隐私保护：
• 不收集任何用户数据
• 仅在用户主动操作时下载资源
• 所有数据本地存储
• 完全开源，代码透明

🌐 支持平台：
• Chrome 88+
• Edge 88+
• Firefox 78+
• Opera 60+
• Brave
• Vivaldi 4.0+

📧 联系方式：
• GitHub: https://github.com/damo-bye/resource-sniffer
• 邮箱: 2377870150@qq.com
```

---

### 第六步：上传商店素材

1. **商店图标**
   - 上传 300 x 300 像素的 PNG 图标
   - 文件名：`edge-store-icon.png`

2. **小型促销图**
   - 上传 440 x 280 像素的图片
   - 文件名：`edge-small-promo.png`

3. **大型促销图**
   - 上传 1400 x 560 像素的图片
   - 文件名：`edge-large-promo.png`

4. **截图**
   - 至少上传 1 张截图（1280 x 800 像素）
   - 建议上传 3-5 张，展示主要功能

---

### 第七步：设置隐私和权限

#### 隐私政策

- **隐私政策 URL**：https://github.com/damo-bye/resource-sniffer/blob/master/privacy-policy.html
- **数据收集声明**：选择 "This extension does not collect user data"

#### 权限说明

在 "Permissions" 部分，解释为什么需要这些权限：

```
本扩展需要以下权限才能正常工作：

1. webRequest 权限
   用途：检测网页中的可下载资源
   说明：此权限用于监听网络请求，识别视频、音频、图片等资源的 URL，以便用户可以选择下载。扩展不会收集或传输任何用户数据。

2. downloads 权限
   用途：下载用户选择的资源
   说明：此权限用于将用户选择的资源下载到本地。扩展不会自动下载任何文件，只有在用户主动点击下载按钮时才会触发。

3. tabs 权限
   用途：获取当前标签页信息
   说明：此权限用于获取当前标签页的 URL 和标题，以便在弹窗中显示资源列表。扩展不会访问其他标签页的信息。

4. storage 权限
   用途：存储用户设置和下载历史
   说明：此权限用于保存用户的个性化设置和下载历史记录。所有数据都存储在本地，不会上传到任何服务器。

5. activeTab 权限
   用途：访问当前标签页
   说明：仅在用户点击扩展图标时访问当前标签页。不会自动访问其他页面。
```

#### 内容安全

- 选择 "This extension does not contain any mature or adult content"

---

### 第八步：提交审核

1. **检查信息**
   - 仔细检查所有填写的信息
   - 确保素材图片清晰
   - 确保权限说明完整

2. **提交审核**
   - 点击 "Submit for review"
   - 等待 Microsoft 审核

3. **审核时间**
   - 通常 1-7 个工作日
   - 可以在开发者中心查看审核状态

---

## 📊 审核状态说明

| 状态 | 说明 |
|------|------|
| In review | 审核中 |
| Approved | 审核通过，已发布 |
| Rejected | 审核被拒绝，需要修改 |
| Needs attention | 需要关注，可能有小问题 |

---

## 🔧 常见问题

### Q: 审核被拒绝怎么办？

**A:** 
1. 查看拒绝原因（通常会邮件通知）
2. 根据原因修改扩展或素材
3. 重新提交审核
4. 常见拒绝原因：
   - 权限说明不充分
   - 素材图片不符合要求
   - 隐私政策不完整
   - 扩展描述不清晰

### Q: 如何查看下载量？

**A:** 
1. 登录开发者中心
2. 进入扩展管理页面
3. 查看 "Analytics" 或 "Statistics" 部分

### Q: 如何更新扩展？

**A:** 
1. 修改代码后，重新打包 ZIP 文件
2. 登录开发者中心
3. 选择已发布的扩展
4. 点击 "Update"
5. 上传新版本的 ZIP 文件
6. 填写更新说明
7. 提交审核

### Q: 需要多少费用？

**A:** 
- Microsoft Edge Add-ons 开发者账号：免费
- 无其他费用

### Q: 如何删除扩展？

**A:** 
1. 登录开发者中心
2. 进入扩展管理页面
3. 选择要删除的扩展
4. 点击 "Delete" 或 "Unpublish"

---

## 📞 获取帮助

- **Microsoft Edge Add-ons 文档**：https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/
- **开发者支持**：https://developer.microsoft.com/en-us/microsoft-edge/support/
- **GitHub Issues**：https://github.com/damo-bye/resource-sniffer/issues

---

## ✅ 完成检查清单

上传完成后，请检查以下项目：

- [ ] 扩展已成功上传
- [ ] 商店素材已上传
- [ ] 截图已上传（至少 1 张）
- [ ] 隐私政策 URL 已填写
- [ ] 权限说明已填写
- [ ] 扩展描述完整清晰
- [ ] 已提交审核

---

## 🎉 审核通过后

审核通过后，您的扩展将：

1. **自动发布**到 Microsoft Edge Add-ons
2. **用户可以搜索**到您的扩展
3. **支持自动更新**
4. **可以在开发者中心**查看统计数据

用户可以在 Edge 浏览器中搜索 "资源嗅探下载器" 找到并安装您的扩展！

---

**祝您上传顺利！** 🚀
