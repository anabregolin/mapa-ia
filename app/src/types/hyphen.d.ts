declare module 'hyphen/pt' {
  interface Opcoes {
    hyphenChar?: string
    minWordLength?: number
    exceptions?: string[]
    debug?: boolean
  }
  export function hyphenateSync(texto: string, opcoes?: Opcoes): string
}
