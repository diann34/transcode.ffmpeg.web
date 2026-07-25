# 转码工坊

一个纯前端的本地音视频转码工具。它使用 WebAssembly 版 FFmpeg 在浏览器中处理文件，媒体文件不会上传到服务器。

## 功能

- 拖拽或选择本地音频、视频文件
- 输出 MP4、WebM、MP3、WAV、GIF
- 转换进度、取消转换与结果下载
- 高级参数：画质、分辨率、帧率与音频码率
- FFmpeg 核心采用 jsDelivr 主 CDN 与 unpkg 备用 CDN 自动回退
- 响应式界面，支持桌面和移动浏览器
- 首次使用时从 CDN 加载 FFmpeg 核心；之后所有转码在当前浏览器标签页完成

## 技术栈

- React 18 + TypeScript
- Vite 6
- `@ffmpeg/ffmpeg` / `@ffmpeg/util`
- pnpm

## 使用前准备

需要安装`Node.js`运行时和`pnpm`命令。

## 本地开发

```bash
pnpm install
pnpm dev
```

打开终端提示的本地地址即可使用。

## 生产构建

```bash
pnpm run build
pnpm preview
```

预览命令会自动打开 `ffmpeg.web.html`；预览服务器的根路径也会自动跳转到该文件。

构建产物会写入 `dist/`，主页文件名为 `ffmpeg.web.html`，该目录已被 Git 忽略。

> 不要直接双击打开 `dist/ffmpeg.web.html`。该应用使用 ES Module、Web Worker 与 WebAssembly，浏览器会在 `file://` 协议下限制这些能力。请使用下方的预览服务器，或将整个 `dist/` 目录部署到任意静态 Web 服务器。

## 使用说明

1. 选择或拖入一个音视频文件。
2. 选择输出格式。
3. 点击“开始转换”。首次转换会下载 FFmpeg WebAssembly 核心。
4. 等待进度完成，然后点击“下载文件”。

## 配置 GitHub 与友链

编辑 `src/config/site.ts`：修改 `githubUrl` 可设置导航栏 GitHub 图标地址；在 `friendLinks` 中添加 `{ name, url }` 条目，导航栏会自动展示友链。留空数组即可隐藏友链区域。

## 注意事项

- 转码会消耗本机 CPU 和内存；大文件或高分辨率视频需要更长时间。
- 浏览器需要支持 WebAssembly、Web Worker 和 Blob 下载。
- FFmpeg 核心首次加载需要网络连接；文件内容本身不会被上传。
- 不同浏览器和设备支持的输入编解码器不同，遇到无法解析的文件可尝试更换浏览器或先转换为常见格式。
