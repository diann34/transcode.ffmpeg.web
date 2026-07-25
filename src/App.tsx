import {
  ChevronDown,
  FileVideo,
  LockKeyhole,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from "lucide-react";
import { useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

type OutputFormat = "mp4" | "webm" | "mp3" | "wav" | "gif";
type Quality = "high" | "balanced" | "compact";
type Resolution = "original" | "1080" | "720" | "480";
type FrameRate = "source" | "60" | "30" | "24";

const formats: { id: OutputFormat; title: string; note: string }[] = [
  { id: "mp4", title: "MP4", note: "通用视频" },
  { id: "webm", title: "WebM", note: "网页视频" },
  { id: "mp3", title: "MP3", note: "提取音频" },
  { id: "wav", title: "WAV", note: "无损音频" },
  { id: "gif", title: "GIF", note: "动态图片" },
];
const CORE_CDNS = [
  "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm",
  "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm",
];
const MIME_TYPES: Record<OutputFormat, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  gif: "image/gif",
};
const sizeLabel = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.ceil(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

function outputArguments(
  input: string,
  output: string,
  type: OutputFormat,
  options: {
    quality: Quality;
    resolution: Resolution;
    frameRate: FrameRate;
    audioBitrate: string;
  },
) {
  const crf = { high: "18", balanced: "23", compact: "28" }[options.quality];
  const filters = [
    options.resolution === "original" ? "" : `scale=-2:${options.resolution}`,
  ].filter(Boolean);
  const videoFilters = filters.length ? ["-vf", filters.join(",")] : [];
  const frameRate =
    options.frameRate === "source" ? [] : ["-r", options.frameRate];
  if (type === "mp3")
    return [
      "-i",
      input,
      "-vn",
      "-c:a",
      "libmp3lame",
      "-b:a",
      options.audioBitrate,
      output,
    ];
  if (type === "wav") return ["-i", input, "-vn", "-c:a", "pcm_s16le", output];
  if (type === "gif")
    return [
      "-i",
      input,
      "-vf",
      `fps=${options.frameRate === "source" ? "12" : options.frameRate},${filters[0] || "scale=640:-1:flags=lanczos"}`,
      output,
    ];
  if (type === "webm")
    return [
      "-i",
      input,
      ...videoFilters,
      ...frameRate,
      "-c:v",
      "libvpx-vp9",
      "-crf",
      crf,
      "-b:v",
      "0",
      "-c:a",
      "libopus",
      "-b:a",
      options.audioBitrate,
      output,
    ];
  return [
    "-i",
    input,
    ...videoFilters,
    ...frameRate,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    crf,
    "-c:a",
    "aac",
    "-b:a",
    options.audioBitrate,
    output,
  ];
}

export default function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<OutputFormat>("mp4");
  const [dragging, setDragging] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [quality, setQuality] = useState<Quality>("balanced");
  const [resolution, setResolution] = useState<Resolution>("original");
  const [frameRate, setFrameRate] = useState<FrameRate>("source");
  const [audioBitrate, setAudioBitrate] = useState("192k");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const busy = status.startsWith("正在");
  const choose = (files?: FileList | null) => {
    const selected = files?.[0];
    if (selected) {
      setFile(selected);
      setOutputUrl(null);
      setProgress(0);
      setStatus("");
    }
  };

  const loadCore = async (ffmpeg: FFmpeg) => {
    let lastError: unknown;
    for (const [index, baseURL] of CORE_CDNS.entries()) {
      try {
        setStatus(`正在加载转码引擎（CDN ${index + 1}/${CORE_CDNS.length}）…`);
        await ffmpeg.load({
          coreURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.js`,
            "text/javascript",
          ),
          wasmURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.wasm`,
            "application/wasm",
          ),
        });
        return;
      } catch (error) {
        lastError = error;
        console.warn(`FFmpeg CDN ${index + 1} 加载失败`, error);
      }
    }
    throw lastError;
  };

  const convert = async () => {
    if (!file) return;
    try {
      setOutputUrl(null);
      setProgress(0);
      let ffmpeg = ffmpegRef.current;
      if (!ffmpeg) {
        ffmpeg = new FFmpeg();
        ffmpeg.on("progress", ({ progress: value }) =>
          setProgress(Math.min(100, Math.round(value * 100))),
        );
        ffmpegRef.current = ffmpeg;
      }
      if (!ffmpeg.loaded) await loadCore(ffmpeg);
      const inputName = `source.${file.name.split(".").pop()?.toLowerCase() || "input"}`;
      const outputName = `converted.${format}`;
      setStatus("正在转换…");
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      await ffmpeg.exec(
        outputArguments(inputName, outputName, format, {
          quality,
          resolution,
          frameRate,
          audioBitrate,
        }),
      );
      const data = (await ffmpeg.readFile(outputName)) as Uint8Array;
      const buffer = data.buffer.slice(
        data.byteOffset,
        data.byteOffset + data.byteLength,
      ) as ArrayBuffer;
      setOutputUrl(
        URL.createObjectURL(new Blob([buffer], { type: MIME_TYPES[format] })),
      );
      setProgress(100);
      setStatus("转换完成，可以下载了。");
    } catch (error) {
      console.error(error);
      setStatus("转换未完成，请尝试较小的文件或更换网络后重试。");
    }
  };
  const cancel = () => {
    ffmpegRef.current?.terminate();
    ffmpegRef.current = null;
    setStatus("已取消转换。");
    setProgress(0);
  };
  const isVideoOutput =
    format === "mp4" || format === "webm" || format === "gif";

  return (
    <main>
      <nav>
        <a className="brand" href="#top">
          <span className="brand-mark">
            <Zap size={18} fill="currentColor" />
          </span>
          <span>转码工坊</span>
        </a>
        <span className="local-pill">
          <LockKeyhole size={14} /> 100% 本地处理
        </span>
      </nav>
      <section id="top" className="hero">
        <div className="eyebrow">
          <Sparkles size={15} /> 不上传，直接转换
        </div>
        <h1>
          让每个格式
          <br />
          <em>轻松流动</em>
        </h1>
        <p>
          在浏览器中完成音视频转码。文件始终留在你的设备，快速、安全且无需安装软件。
        </p>
      </section>
      <section className="workspace">
        <div
          className={`dropzone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            choose(event.dataTransfer.files);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="audio/*,video/*"
            onChange={(event) => choose(event.target.files)}
          />
          {file ? (
            <>
              <FileVideo size={36} />
              <strong>{file.name}</strong>
              <span>{sizeLabel(file.size)} · 点击更换文件</span>
            </>
          ) : (
            <>
              <span className="upload-icon">
                <FileVideo size={28} />
              </span>
              <strong>选择或拖入一个媒体文件</strong>
              <span>支持视频、音频及常见媒体格式</span>
              <button type="button">浏览文件</button>
            </>
          )}
        </div>
        <div className="settings">
          <div className="settings-heading">
            <div>
              <span className="step">01</span>
              <h2>输出格式</h2>
            </div>
            <span>选择你需要的文件类型</span>
          </div>
          <div className="format-grid">
            {formats.map((item) => (
              <button
                key={item.id}
                className={`format-card ${format === item.id ? "selected" : ""}`}
                onClick={() => setFormat(item.id)}
              >
                <strong>{item.title}</strong>
                <span>{item.note}</span>
              </button>
            ))}
          </div>
          <div className="advanced">
            <button
              type="button"
              className="advanced-toggle"
              onClick={() => setAdvanced(!advanced)}
              aria-expanded={advanced}
            >
              <span>
                <SlidersHorizontal size={15} /> 高级选项
              </span>
              <ChevronDown size={16} className={advanced ? "rotated" : ""} />
            </button>
            <div
              className={`advanced-content ${advanced ? "open" : ""}`}
              aria-hidden={!advanced}
            >
              <div className="advanced-grid">
                <label>
                  画质
                  <select
                    value={quality}
                    disabled={!advanced}
                    onChange={(event) =>
                      setQuality(event.target.value as Quality)
                    }
                  >
                    <option value="high">高画质（文件较大）</option>
                    <option value="balanced">平衡</option>
                    <option value="compact">更小文件</option>
                  </select>
                </label>
                {isVideoOutput && (
                  <>
                    <label>
                      分辨率
                      <select
                        value={resolution}
                        disabled={!advanced}
                        onChange={(event) =>
                          setResolution(event.target.value as Resolution)
                        }
                      >
                        <option value="original">保持原始</option>
                        <option value="1080">最高 1080p</option>
                        <option value="720">最高 720p</option>
                        <option value="480">最高 480p</option>
                      </select>
                    </label>
                    <label>
                      帧率
                      <select
                        value={frameRate}
                        disabled={!advanced}
                        onChange={(event) =>
                          setFrameRate(event.target.value as FrameRate)
                        }
                      >
                        <option value="source">保持原始</option>
                        <option value="60">60 fps</option>
                        <option value="30">30 fps</option>
                        <option value="24">24 fps</option>
                      </select>
                    </label>
                  </>
                )}
                <label>
                  音频码率
                  <select
                    value={audioBitrate}
                    disabled={!advanced}
                    onChange={(event) => setAudioBitrate(event.target.value)}
                  >
                    <option value="128k">128 kbps</option>
                    <option value="192k">192 kbps</option>
                    <option value="320k">320 kbps</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
          <div className="convert-row">
            <p>{status || "转码引擎从高速 CDN 加载，文件始终在本地处理。"}</p>
            <div className="action-buttons">
              {busy && (
                <button className="cancel" onClick={cancel}>
                  取消
                </button>
              )}
              {outputUrl ? (
                <a
                  className="convert download"
                  href={outputUrl}
                  download={`converted.${format}`}
                >
                  下载文件 <span>↓</span>
                </a>
              ) : (
                <button
                  className="convert"
                  onClick={convert}
                  disabled={!file || busy}
                >
                  开始转换 <span>→</span>
                </button>
              )}
            </div>
          </div>
          {(busy || progress > 0) && (
            <div className="progress" aria-label={`转换进度 ${progress}%`}>
              <div style={{ width: `${progress}%` }} />
              <span>{progress}%</span>
            </div>
          )}
        </div>
      </section>
      <section className="benefits">
        <article>
          <LockKeyhole size={20} />
          <div>
            <h3>隐私优先</h3>
            <p>文件不会离开你的设备</p>
          </div>
        </article>
        <article>
          <Zap size={20} />
          <div>
            <h3>性能良好</h3>
            <p>快速高效的转码体验</p>
          </div>
        </article>
        <article>
          <FileVideo size={20} />
          <div>
            <h3>常用格式齐全</h3>
            <p>视频、音频、GIF 一站转换</p>
          </div>
        </article>
      </section>
    </main>
  );
}
