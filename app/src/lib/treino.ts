import { CALCULOS, type Calculo, type PassoCalculo } from '../content/calculos'

/** Uma resolução completa de um treino de cálculo. */
export interface TentativaCalculo {
  em: number
  /** 0 = números do material */
  seed: number
  acertos: number
  total: number
  /** rótulos dos passos errados (ou revelados sem responder) */
  errados: string[]
}

export interface ProgressoCalculo {
  tentativas: TentativaCalculo[]
  /** quantas vezes seguidas acertou tudo */
  sequencia: number
  /** quando o treino volta para "hoje" */
  voltarEm: number
}

export const DIA = 24 * 60 * 60 * 1000
/** acertou tudo → volta em 1, 3, 7, 14, 30 dias; errou algo → volta amanhã */
export const INTERVALOS = [1, 3, 7, 14, 30]

/** Meia-noite local de hoje + N dias: assim "amanhã" é amanhã, não daqui a 24h. */
export const diaMais = (agora: number, dias: number) => {
  const d = new Date(agora)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + dias)
  return d.getTime()
}

export function agendar(antes: ProgressoCalculo | undefined, t: TentativaCalculo): ProgressoCalculo {
  const perfeito = t.acertos === t.total
  const sequencia = perfeito ? (antes?.sequencia ?? 0) + 1 : 0
  const dias = perfeito ? INTERVALOS[Math.min(sequencia - 1, INTERVALOS.length - 1)] : 1
  return {
    tentativas: [...(antes?.tentativas ?? []), t].slice(-30),
    sequencia,
    voltarEm: diaMais(t.em, dias),
  }
}

export type SituacaoCalculo = 'novo' | 'refazer' | 'revisar' | 'em-dia'

export function situacao(p: ProgressoCalculo | undefined, agora: number): SituacaoCalculo {
  if (!p || !p.tentativas.length) return 'novo'
  const ultima = p.tentativas[p.tentativas.length - 1]
  if (ultima.acertos < ultima.total) return 'refazer'
  return p.voltarEm <= agora ? 'revisar' : 'em-dia'
}

/** Quantos dias até voltar (0 = hoje). */
export const diasAte = (p: ProgressoCalculo, agora: number) => Math.max(0, Math.round((p.voltarEm - diaMais(agora, 0)) / DIA))

/** Os passos em que você mais erra neste treino (pelo histórico). */
export function pontosFracos(p: ProgressoCalculo | undefined, max = 2): string[] {
  if (!p) return []
  const cont = new Map<string, number>()
  for (const t of p.tentativas) for (const r of t.errados) cont.set(r, (cont.get(r) ?? 0) + 1)
  return [...cont.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([r]) => r)
}

/** Treinos que pedem atenção hoje: primeiro os errados, depois as revisões vencidas. */
export function paraHoje(calculos: Record<string, ProgressoCalculo>, agora: number): Calculo[] {
  const peso = { refazer: 0, revisar: 1 } as Record<SituacaoCalculo, number>
  return CALCULOS.filter((c) => {
    const s = situacao(calculos[c.id], agora)
    return s === 'refazer' || s === 'revisar'
  }).sort((a, b) => peso[situacao(calculos[a.id], agora)] - peso[situacao(calculos[b.id], agora)])
}

/** Lê "0,367", "0.367", "2/3", "40%", "1.234,5". Devolve null se não der para entender. */
export function lerNumero(texto: string): { valor: number; porcento: boolean } | null {
  let t = texto.trim().replace(/\s/g, '')
  if (!t) return null
  const porcento = t.endsWith('%')
  if (porcento) t = t.slice(0, -1)
  const fracao = t.match(/^(-?[\d.,]+)\/([\d.,]+)$/)
  const paraNum = (s: string) => {
    // "1.234,5" → 1234.5 ; "0,5" → 0.5 ; "0.5" → 0.5
    const limpo = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s
    return /^-?\d*\.?\d+$/.test(limpo) ? Number(limpo) : NaN
  }
  const valor = fracao ? paraNum(fracao[1]) / paraNum(fracao[2]) : paraNum(t)
  return Number.isFinite(valor) ? { valor, porcento } : null
}

/**
 * Confere uma resposta numérica. Aceita arredondar ou truncar na última casa pedida
 * (ex.: 0,467 para 0,4688) e erro relativo de até 0,5%.
 */
export function conferir(passo: PassoCalculo, texto: string): boolean | null {
  const lido = lerNumero(texto)
  if (!lido) return null
  let v = lido.valor
  const certo = passo.resposta
  if (passo.porcento && !lido.porcento && Math.abs(v) <= 1 && certo > 1) v *= 100
  if (!passo.porcento && lido.porcento) v /= 100
  const casas = passo.casas ?? 3
  const tol = casas === 0 ? 0.5 : 10 ** -casas
  return Math.abs(v - certo) <= tol + 1e-12 || (certo !== 0 && Math.abs(v - certo) / Math.abs(certo) <= 0.005)
}
