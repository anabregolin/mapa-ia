import { topicoPorId } from '../content/topicos'
import type { Topico } from '../content/tipos'
import { DIA, diaMais } from './treino'

/**
 * Depois de estudar, o tópico volta para uma olhada nestes intervalos (em dias; 1h = 1/24).
 * Cada "lembrei" sobe um degrau; "esqueci" volta ao primeiro. O primeiro degrau é 1 dia porque
 * revisar depois de dormir segura bem mais que revisar logo em seguida.
 */
export const INTERVALOS_PADRAO = [1, 3, 7, 14, 30]
/** minutos de leitura até o primeiro "pare e relembre" dentro do tópico */
export const MINUTOS_PADRAO = 20

export interface Revisita {
  /** quando estudou ou revisitou pela última vez */
  em: number
  /** degrau nos intervalos */
  n: number
}

export function voltaEm(r: Revisita, intervalos: number[]) {
  const d = intervalos[Math.min(r.n, intervalos.length - 1)] ?? 1
  // dias inteiros contam a partir da meia-noite ("amanhã" é amanhã); horas contam do momento exato
  return Number.isInteger(d) ? diaMais(r.em, d) : r.em + d * DIA
}
export const venceu = (r: Revisita | undefined, intervalos: number[], agora: number) => !!r && voltaEm(r, intervalos) <= agora

/** "faz 3 dias", "faz 2 horas" */
export function haQuanto(r: Revisita, agora: number) {
  const horas = (agora - r.em) / 3_600_000
  if (horas < 1) return 'faz menos de 1 hora'
  if (horas < 24) return `faz ${Math.round(horas)} ${Math.round(horas) === 1 ? 'hora' : 'horas'}`
  const dias = Math.max(1, Math.round((diaMais(agora, 0) - diaMais(r.em, 0)) / DIA))
  return `faz ${dias} ${dias === 1 ? 'dia' : 'dias'}`
}

/** "agora", "em 40 min", "em 5 h", "amanhã", "em 3 dias" */
export function faltaQuanto(alvo: number, agora: number) {
  const ms = alvo - agora
  if (ms <= 0) return 'agora'
  const min = Math.ceil(ms / 60_000)
  if (min < 60) return `em ${min} min`
  if (min < 12 * 60) return `em ${Math.round(min / 60)} h`
  const dias = Math.round((diaMais(alvo, 0) - diaMais(agora, 0)) / DIA)
  if (dias <= 1) return 'amanhã'
  return `em ${dias} dias`
}

export function proximaRevisita(r: Revisita | undefined, lembrou: boolean, agora: number): Revisita {
  return { em: agora, n: lembrou ? (r ? r.n + 1 : 1) : 0 }
}

/** Tópicos cuja revisita já venceu. */
export function topicosQueVoltam(revisitas: Record<string, Revisita>, intervalos: number[], agora: number): Topico[] {
  return Object.keys(revisitas)
    .filter((id) => venceu(revisitas[id], intervalos, agora))
    .map((id) => topicoPorId.get(id))
    .filter((t): t is Topico => !!t)
}

/** Lê "1h, 1, 3, 7" → [1/24, 1, 3, 7]. Devolve null se não fizer sentido. */
export function lerIntervalos(texto: string): number[] | null {
  const partes = texto.split(/[;,\s]+/).filter(Boolean)
  const dias = partes.map((p) => {
    const m = p.match(/^(\d+(?:[.,]\d+)?)(h|d)?$/i)
    if (!m) return NaN
    const n = Number(m[1].replace(',', '.'))
    return m[2]?.toLowerCase() === 'h' ? n / 24 : n
  })
  if (!dias.length || dias.some((d) => !Number.isFinite(d) || d <= 0)) return null
  if (dias.some((d, i) => i > 0 && d < dias[i - 1])) return null
  return dias
}

export const escreverIntervalos = (dias: number[]) => dias.map((d) => (Number.isInteger(d) ? String(d) : `${Math.round(d * 24 * 10) / 10}h`)).join(', ')
