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

构建产物会写入 `dist/`，该目录已被 Git 忽略。

## 使用说明

1. 选择或拖入一个音视频文件。
2. 选择输出格式。
3. 点击“开始转换”。首次转换会下载 FFmpeg WebAssembly 核心。
4. 等待进度完成，然后点击“下载文件”。

## 注意事项

- 转码会消耗本机 CPU 和内存；大文件或高分辨率视频需要更长时间。
- 浏览器需要支持 WebAssembly、Web Worker 和 Blob 下载。
- FFmpeg 核心首次加载需要网络连接；文件内容本身不会被上传。
- 不同浏览器和设备支持的输入编解码器不同，遇到无法解析的文件可尝试更换浏览器或先转换为常见格式。
