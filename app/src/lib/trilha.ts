import { ETAPAS, GRUPOS, TOPICOS, UNIDADES } from '../content/topicos'
import type { Topico, UnidadeId } from '../content/tipos'
import { prereqsDe } from './grafo'

/**
 * A trilha: ordem de estudo do básico ao avançado.
 * Segue a ordem das aulas (grupo por grupo) e, dentro de cada grupo,
 * garante que um tópico só aparece depois dos tópicos de que ele precisa.
 */

const indiceOriginal = new Map(TOPICOS.map((t, i) => [t.id, i]))

function ordenarGrupo(tps: Topico[]): Topico[] {
  const ids = new Set(tps.map((t) => t.id))
  const feitos = new Set<string>()
  const saida: Topico[] = []
  const restantes = [...tps]
  while (restantes.length) {
    // o primeiro (na ordem do material) cujos pré-requisitos do mesmo grupo já saíram;
    // ciclo não deveria existir, mas se existir, segue a ordem original
    const i = Math.max(
      0,
      restantes.findIndex((t) => prereqsDe.get(t.id)!.every((p) => !ids.has(p) || feitos.has(p))),
    )
    const [t] = restantes.splice(i, 1)
    feitos.add(t.id)
    saida.push(t)
  }
  return saida
}

export interface Modulo {
  id: string
  titulo: string
  unidade: UnidadeId
  etapa: number
  aulas: string
  topicos: Topico[]
}

export interface Marco {
  tipo: 'avaliacao'
  titulo: string
  etapa: number
}

export const MODULOS: Modulo[] = [...GRUPOS]
  .sort((a, b) => a.etapa - b.etapa)
  .map((g) => ({
    id: g.id,
    titulo: g.titulo,
    unidade: g.unidade,
    etapa: g.etapa,
    aulas: ETAPAS.find((e) => e.pos === g.etapa)?.aulas ?? '',
    topicos: ordenarGrupo(TOPICOS.filter((t) => t.grupo === g.id).sort((a, b) => indiceOriginal.get(a.id)! - indiceOriginal.get(b.id)!)),
  }))

/** Módulos e avaliações intercalados na ordem do semestre. */
export const LINHA: (Modulo | Marco)[] = [
  ...MODULOS,
  ...ETAPAS.filter((e) => e.avaliacao).map((e): Marco => ({ tipo: 'avaliacao', titulo: e.titulo, etapa: e.pos })),
].sort((a, b) => a.etapa - b.etapa || ('tipo' in a ? 1 : -1))

/** Ordem linear de todos os tópicos (os "não vistos em aula" ficam no fim de cada módulo). */
export const ORDEM: Topico[] = MODULOS.flatMap((m) => [...m.topicos.filter((t) => !t.naoVisto), ...m.topicos.filter((t) => t.naoVisto)])
const posicao = new Map(ORDEM.map((t, i) => [t.id, i]))

export function vizinhosNaTrilha(id: string, extras: boolean) {
  const lista = extras ? ORDEM : ORDEM.filter((t) => !t.naoVisto || t.id === id)
  const i = lista.findIndex((t) => t.id === id)
  return { anterior: lista[i - 1] ?? null, proximo: lista[i + 1] ?? null }
}

export const posicaoNaTrilha = (id: string) => posicao.get(id) ?? 0

export const unidade = (id: UnidadeId) => UNIDADES.find((u) => u.id === id)!

/** Quantas camadas o tópico tem (resumo, intuição, definição, detalhe, cuidado, fórmulas, prática). */
export const NOME_PROFUNDIDADE = ['superfície', 'raso', 'meio', 'fundo', 'bem fundo'] as const

export const NOME_NIVEL = { 1: 'base', 2: 'aprofunda', 3: 'avançado' } as const
