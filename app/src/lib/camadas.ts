// Quantas camadas um tópico tem, sem montar o conteúdo. Serve para o "% visto" da trilha.
// Precisa seguir as mesmas regras de montarCamadas (Topico.tsx): mudou lá, muda aqui.
import { CARTOES } from '../content/cartoes'
import { calculosDoTopico } from '../content/calculos'
import { demosDoTopico, exerciciosDoTopico } from '../content/exercicios'
import { EXPLICACOES } from '../content/explicacoes'
import { formulasDoTopico } from '../content/formulas'

const cache = new Map<string, number>()

export function contarCamadas(id: string): number {
  const pronto = cache.get(id)
  if (pronto !== undefined) return pronto
  const c = EXPLICACOES[id]
  // com explicação: pensa assim, com o nome certo, mergulho (+ pegadinha) … e a cola no fim; sem: só o resumo
  let n = c ? 3 + (c.cuidado ? 1 : 0) + 1 : 1
  if (formulasDoTopico(id).length) n++
  if (exerciciosDoTopico(id).length || demosDoTopico(id).length || calculosDoTopico(id).length) n++
  if (CARTOES.some((k) => k.topico === id)) n++
  cache.set(id, n)
  return n
}

/** 0 a 100: até que camada você já abriu (a mais funda conta, mesmo que tenha pulado alguma). */
export function percentVisto(id: string, profundidade: number | undefined): number {
  if (profundidade === undefined) return 0
  return Math.min(100, Math.round(((profundidade + 1) / contarCamadas(id)) * 100))
}
