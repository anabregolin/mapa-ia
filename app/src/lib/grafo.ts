import { CONEXOES } from '../content/conexoes'
import { TOPICOS, topicoPorId } from '../content/topicos'
import type { Conexao } from '../content/tipos'

// Valida as conexões na carga: um id errado quebraria o mapa sem aviso.
for (const c of CONEXOES) {
  for (const id of [c.de, c.para]) {
    if (!topicoPorId.has(id)) throw new Error(`conexão com tópico inexistente: ${id}`)
  }
}

const PREREQ = CONEXOES.filter((c) => c.tipo === 'prereq')
export const PARECIDOS = CONEXOES.filter((c) => c.tipo === 'parecido')

/** id → pré-requisitos diretos */
export const prereqsDe = new Map<string, string[]>()
/** id → dependentes diretos */
export const dependentesDe = new Map<string, string[]>()
for (const tp of TOPICOS) {
  prereqsDe.set(tp.id, [])
  dependentesDe.set(tp.id, [])
}
for (const c of PREREQ) {
  prereqsDe.get(c.para)!.push(c.de)
  dependentesDe.get(c.de)!.push(c.para)
}

function fecho(inicio: string, vizinhos: Map<string, string[]>): Set<string> {
  const vistos = new Set<string>()
  const pilha = [...(vizinhos.get(inicio) ?? [])]
  while (pilha.length) {
    const id = pilha.pop()!
    if (vistos.has(id)) continue
    vistos.add(id)
    pilha.push(...(vizinhos.get(id) ?? []))
  }
  return vistos
}

export const ancestrais = (id: string) => fecho(id, prereqsDe)
export const descendentes = (id: string) => fecho(id, dependentesDe)

export const parecidosDe = (id: string): Conexao[] => PARECIDOS.filter((c) => c.de === id || c.para === id)

/**
 * Pai na árvore do mapa: o primeiro pré-requisito do mesmo grupo.
 * Sem pré-requisito no grupo, o tópico fica pendurado no próprio grupo.
 * Como os pré-requisitos formam um DAG, isso sempre dá uma árvore.
 */
export function paiNaArvore(id: string): string | null {
  const tp = topicoPorId.get(id)!
  const pai = prereqsDe.get(id)!.find((p) => topicoPorId.get(p)!.grupo === tp.grupo)
  return pai ?? null
}

export const PREREQS = PREREQ
