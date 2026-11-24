// Pomodoro: blocos de foco com pausas curtas e, a cada N blocos, uma pausa longa.
// 25/5/15 com pausa longa a cada 4 é o padrão clássico da técnica (Cirillo), não um número
// comprovado em pesquisa. Por isso tudo é configurável.

export type Fase = 'foco' | 'pausa' | 'longa'

export interface PrefPomodoro {
  foco: number
  pausa: number
  longa: number
  /** quantos focos até a pausa longa */
  ciclos: number
  som: boolean
  /** sugestões para a pausa; {min} vira a duração da pausa */
  atividades: string[]
}

export interface EstadoPomodoro {
  fase: Fase
  /** focos terminados desde o último "zerar" */
  feitos: number
  rodando: boolean
  /** quando termina (ms), se estiver rodando */
  terminaEm: number | null
  /** quanto falta (ms), se estiver parado no meio */
  restante: number | null
  sugestao: string | null
}

export const ATIVIDADES_PADRAO = [
  'Olhe para o teto (ou para longe) por {min} minutos, sem tela.',
  'Levante e beba um copo de água.',
  'Alongue pescoço, ombros e punhos devagar.',
  'Olhe pela janela para algo bem longe por 20 segundos. Repita 3 vezes.',
  'Respire devagar: inspire em 4 s, segure 4 s, solte em 6 s. Repita 5 vezes.',
  'Caminhe até outro cômodo e volte.',
  'Feche os olhos e lembre, sem olhar, 3 coisas que acabou de estudar.',
  'Deite no chão por {min} minutos e só respire.',
]

export const POMODORO_PADRAO: PrefPomodoro = { foco: 25, pausa: 5, longa: 15, ciclos: 4, som: true, atividades: ATIVIDADES_PADRAO }

export const PARADO: EstadoPomodoro = { fase: 'foco', feitos: 0, rodando: false, terminaEm: null, restante: null, sugestao: null }

export const duracao = (fase: Fase, p: PrefPomodoro) => (fase === 'foco' ? p.foco : fase === 'pausa' ? p.pausa : p.longa) * 60_000

export function faltam(e: EstadoPomodoro, p: PrefPomodoro, agora: number) {
  if (e.rodando && e.terminaEm) return Math.max(0, e.terminaEm - agora)
  return e.restante ?? duracao(e.fase, p)
}

export function sortear(p: PrefPomodoro, fase: Fase, evitar?: string | null): string | null {
  const lista = p.atividades.filter((a) => a.trim())
  if (!lista.length) return null
  const opcoes = lista.length > 1 ? lista.filter((a) => a !== evitar) : lista
  const a = opcoes[Math.floor(Math.random() * opcoes.length)]
  return a.replaceAll('{min}', String(fase === 'longa' ? p.longa : p.pausa))
}

/** o que vem depois de uma fase acabar */
export function proxima(e: EstadoPomodoro, p: PrefPomodoro, agora: number): EstadoPomodoro {
  if (e.fase === 'foco') {
    const feitos = e.feitos + 1
    const fase: Fase = feitos % p.ciclos === 0 ? 'longa' : 'pausa'
    // a pausa começa sozinha, com uma sugestão
    return { fase, feitos, rodando: true, terminaEm: agora + duracao(fase, p), restante: null, sugestao: sortear(p, fase, e.sugestao) }
  }
  // acabou a pausa: o foco espera você apertar "começar"
  return { ...e, fase: 'foco', rodando: false, terminaEm: null, restante: null, sugestao: null }
}

export const relogio = (ms: number) => {
  const s = Math.ceil(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** três bipes curtos, sem arquivo de áudio */
export function bipar() {
  try {
    const ctx = new AudioContext()
    ;[0, 0.25, 0.5].forEach((t) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = 880
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.18)
      o.connect(g).connect(ctx.destination)
      o.start(ctx.currentTime + t)
      o.stop(ctx.currentTime + t + 0.2)
    })
    setTimeout(() => ctx.close(), 1200)
  } catch {
    /* sem áudio: segue em silêncio */
  }
}
