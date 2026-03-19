declare global {
  interface Window {
    env?: Record<string, string>
  }
}

export const runtimeEnv: Record<string, string> = window.env ?? {}
