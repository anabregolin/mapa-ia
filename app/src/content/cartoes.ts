// Cartões de revisão gerados a partir das explicações e das fórmulas.
import { EXPLICACOES } from './explicacoes'
import { FORMULAS } from './formulas'
import { topicoPorId } from './topicos'
import type { UnidadeId, Variavel } from './tipos'

export type TipoCartao = 'conceito' | 'cuidado' | 'formula'

export interface Cartao {
  id: string
  tipo: TipoCartao
  topico: string
  unidade: UnidadeId
  etapa: number
  pergunta: string
  /** texto com $latex$ e **negrito** */
  resposta: string
  /** fórmula em destaque no verso */
  latex?: string
  variaveis?: Variavel[]
}

export const CARTOES: Cartao[] = [
  ...Object.entries(EXPLICACOES).flatMap(([id, c]) => {
    const tp = topicoPorId.get(id)!
    const base = { topico: id, unidade: tp.unidade, etapa: tp.etapa }
    const cartoes: Cartao[] = [{ ...base, id: `c:${id}`, tipo: 'conceito', pergunta: `O que é ${tp.titulo}?`, resposta: `${c.definicao}\n\n${c.intuicao}` }]
    if (c.cuidado) cartoes.push({ ...base, id: `p:${id}`, tipo: 'cuidado', pergunta: `${tp.titulo}: qual é a pegadinha?`, resposta: c.cuidado })
    return cartoes
  }),
  ...FORMULAS.map((f): Cartao => {
    const tp = topicoPorId.get(f.topicos[0])!
    return {
      id: `f:${f.id}`,
      tipo: 'formula',
      topico: tp.id,
      unidade: tp.unidade,
      etapa: tp.etapa,
      pergunta: `Escreva a fórmula: ${f.nome}`,
      resposta: f.aviso ?? '',
      latex: f.latex,
      variaveis: f.variaveis,
    }
  }),
]

/** Caixas de Leitner: em quantos dias o cartão volta depois de cada acerto. */
export const INTERVALO_DIAS = [0, 1, 3, 7, 15]
export const ULTIMA_CAIXA = INTERVALO_DIAS.length - 1

export type Nota = 'errei' | 'dificil' | 'acertei'

export interface ProgressoCartao {
  caixa: number
  /** timestamp em ms de quando o cartão volta */
  volta: number
}

export function responder(atual: ProgressoCartao | undefined, nota: Nota, agora: number): ProgressoCartao {
  const caixa = nota === 'errei' ? 0 : nota === 'dificil' ? Math.max(0, atual?.caixa ?? 0) : Math.min(ULTIMA_CAIXA, (atual?.caixa ?? -1) + 1)
  // errei e difícil voltam na mesma sessão (daqui a 1 e 10 minutos)
  const espera = nota === 'errei' ? 60_000 : nota === 'dificil' ? 10 * 60_000 : INTERVALO_DIAS[caixa] * 86_400_000 || 10 * 60_000
  return { caixa, volta: agora + espera }
}
