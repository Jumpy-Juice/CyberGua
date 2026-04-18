/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 方舟推理接入点 ID（ep-…）或控制台给出的模型名 */
  readonly VITE_ARK_MODEL?: string
  /**
   * 对话接口路径。默认 `/api/ark/chat/completions`（开发时走 Vite 代理）。
   * 若已自建反代，可设为同源完整路径。
   */
  readonly VITE_ARK_CHAT_PATH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
