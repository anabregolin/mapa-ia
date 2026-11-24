// Cartões de revisão gerados a partir das explicações e das fórmulas.
import { CONEXOES } from './conexoes'
import { EXPLICACOES } from './explicacoes'
import { FORMULAS } from './formulas'
import { topicoPorId } from './topicos'
import type { UnidadeId, Variavel } from './tipos'

export type TipoCartao = 'conceito' | 'lacuna' | 'detalhe' | 'cuidado' | 'ligacao' | 'formula'

export const NOME_TIPO: Record<TipoCartao, { um: string; varios: string }> = {
  conceito: { um: 'conceito', varios: 'conceitos' },
  lacuna: { um: 'complete', varios: 'complete a frase' },
  detalhe: { um: 'por dentro', varios: 'por dentro' },
  cuidado: { um: 'pegadinha', varios: 'pegadinhas' },
  ligacao: { um: 'ligação', varios: 'ligações' },
  formula: { um: 'fórmula', varios: 'fórmulas' },
}

const LACUNA = '______'

/** Separa em frases sem quebrar $…$ (versão curta da de Texto.tsx). */
function frases(texto: string): string[] {
  const guardados: string[] = []
  const protegido = texto.replace(/\$[^$]+\$/g, (m) => `\u0000${guardados.push(m) - 1}\u0000`)
  return protegido
    .split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý"(*0-9])/)
    .map((f) => f.replace(/\u0000(\d+)\u0000/g, (_, i) => guardados[Number(i)]).trim())
    .filter(Boolean)
}

/**
 * Cartão "complete a frase": pega a primeira frase com um termo em **negrito** e esconde o termo.
 * Pula termos curtos demais, termos com fórmula e frases onde o termo aparece de novo (entregaria a resposta).
 */
function lacuna(texto: string): { pergunta: string; termo: string; frase: string } | null {
  for (const f of frases(texto)) {
    for (const m of f.matchAll(/\*\*([^*]+)\*\*/g)) {
      const termo = m[1]
      if (termo.length < 4 || termo.includes('$')) continue
      const resto = f.replace(m[0], '')
      if (resto.toLowerCase().includes(termo.toLowerCase())) continue
      // as outras marcações de negrito continuam, só some a escolhida
      return { pergunta: f.replace(m[0], LACUNA), termo, frase: f }
    }
  }
  return null
}

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

/** "O que é X?", sem repetir quando o título do tópico já é uma pergunta ("O que é aprendizado de máquina", "Por que probabilidade?"). */
function perguntaConceito(titulo: string) {
  if (/^(o que|por que|como|qual|quais|quando|para que)\b/i.test(titulo) || titulo.trim().endsWith('?')) return titulo.trim().endsWith('?') ? titulo.trim() : `${titulo.trim()}?`
  return `O que é ${titulo}?`
}

export const CARTOES: Cartao[] = [
  ...Object.entries(EXPLICACOES).flatMap(([id, c]) => {
    const tp = topicoPorId.get(id)!
    const base = { topico: id, unidade: tp.unidade, etapa: tp.etapa }
    const cartoes: Cartao[] = [{ ...base, id: `c:${id}`, tipo: 'conceito', pergunta: perguntaConceito(tp.titulo), resposta: `${c.definicao}\n\n${c.intuicao}` }]
    const l1 = lacuna(c.definicao)
    if (l1) cartoes.push({ ...base, id: `l:${id}`, tipo: 'lacuna', pergunta: `Complete (${tp.titulo}): ${l1.pergunta}`, resposta: `**${l1.termo}**\n\n${l1.frase}` })
    const l2 = lacuna(c.detalhe)
    if (l2 && l2.termo !== l1?.termo) cartoes.push({ ...base, id: `l2:${id}`, tipo: 'lacuna', pergunta: `Complete (${tp.titulo}): ${l2.pergunta}`, resposta: `**${l2.termo}**\n\n${l2.frase}` })
    cartoes.push({ ...base, id: `d:${id}`, tipo: 'detalhe', pergunta: `${tp.titulo}: como funciona por dentro? Explique com suas palavras.`, resposta: c.detalhe })
    if (c.cuidado) cartoes.push({ ...base, id: `p:${id}`, tipo: 'cuidado', pergunta: `${tp.titulo}: qual é a pegadinha?`, resposta: c.cuidado })
    return cartoes
  }),
  // "parecido com": qual é a ligação entre os dois (fica no tópico que vem depois na trilha)
  ...CONEXOES.filter((c) => c.tipo === 'parecido' && c.nota).flatMap((c): Cartao[] => {
    const a = topicoPorId.get(c.de)
    const b = topicoPorId.get(c.para)
    if (!a || !b) return []
    const depois = a.etapa >= b.etapa ? a : b
    return [{ id: `x:${c.de}|${c.para}`, tipo: 'ligacao', topico: depois.id, unidade: depois.unidade, etapa: depois.etapa, pergunta: `O que ${a.titulo} tem a ver com ${b.titulo}?`, resposta: c.nota! }]
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
