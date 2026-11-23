import { topicoPorId } from '../content/topicos'
import type { Topico } from '../content/tipos'
import { DIA, diaMais } from './treino'

/** Um tópico entendido volta para uma olhada rápida depois destes dias (cada "lembro" sobe um degrau). */
export const INTERVALOS_TOPICO = [3, 7, 14, 30, 60]

export interface Revisita {
  /** quando entendeu ou revisitou pela última vez */
  em: number
  /** degrau em INTERVALOS_TOPICO */
  n: number
}

export const voltaEm = (r: Revisita) => diaMais(r.em, INTERVALOS_TOPICO[Math.min(r.n, INTERVALOS_TOPICO.length - 1)])
export const venceu = (r: Revisita | undefined, agora: number) => !!r && voltaEm(r) <= agora
/** dias desde a última vez (para a frase "faz N dias") */
export const diasDesde = (r: Revisita, agora: number) => Math.max(1, Math.round((diaMais(agora, 0) - diaMais(r.em, 0)) / DIA))

export function proximaRevisita(r: Revisita | undefined, lembrou: boolean, agora: number): Revisita {
  return { em: agora, n: lembrou ? (r ? r.n + 1 : 1) : 0 }
}

/** Tópicos entendidos cuja revisita já venceu. */
export function topicosQueVoltam(estudados: Record<string, true>, revisitas: Record<string, Revisita>, agora: number): Topico[] {
  return Object.keys(estudados)
    .filter((id) => venceu(revisitas[id], agora))
    .map((id) => topicoPorId.get(id))
    .filter((t): t is Topico => !!t)
}
