import { hierarchy, tree } from 'd3-hierarchy'
import { GRUPOS, TOPICOS, UNIDADES } from '../content/topicos'
import type { UnidadeId } from '../content/tipos'
import { paiNaArvore } from './grafo'

export type TipoNo = 'raiz' | 'unidade' | 'grupo' | 'topico'

export interface NoLayout {
  id: string
  tipo: TipoNo
  /** centro do nó */
  x: number
  y: number
  /** 1 = metade direita do mapa, −1 = esquerda */
  lado: 1 | -1
  etapa: number
  unidade?: UnidadeId
  pai?: string
}

export const TAMANHO: Record<TipoNo, { w: number; h: number }> = {
  raiz: { w: 240, h: 72 },
  unidade: { w: 220, h: 52 },
  grupo: { w: 200, h: 36 },
  topico: { w: 190, h: 40 },
}

const LINHA = 50 // espaço vertical entre irmãos
const COLUNA = 245 // espaço horizontal entre níveis
const PRIMEIRA_COLUNA = 320 // da raiz até as unidades

interface Arv {
  id: string
  tipo: TipoNo
  filhos: Arv[]
}

const idUnidade = (u: UnidadeId) => `un:${u}`
const idGrupo = (g: string) => `gr:${g}`

function montarArvore(): Map<UnidadeId, Arv> {
  const filhosDe = new Map<string, Arv[]>()
  const add = (pai: string, filho: Arv) => {
    if (!filhosDe.has(pai)) filhosDe.set(pai, [])
    filhosDe.get(pai)!.push(filho)
  }
  const nos = new Map<string, Arv>()
  const no = (id: string, tipo: TipoNo): Arv => {
    if (!nos.has(id)) nos.set(id, { id, tipo, filhos: [] })
    return nos.get(id)!
  }

  for (const tp of TOPICOS) {
    add(paiNaArvore(tp.id) ?? idGrupo(tp.grupo), no(tp.id, 'topico'))
  }
  for (const g of GRUPOS) add(idUnidade(g.unidade), no(idGrupo(g.id), 'grupo'))
  for (const [pai, filhos] of filhosDe) no(pai, pai.startsWith('gr:') ? 'grupo' : pai.startsWith('un:') ? 'unidade' : 'topico').filhos = filhos

  return new Map(UNIDADES.map((u) => [u.id, no(idUnidade(u.id), 'unidade')]))
}

const LADOS: { lado: 1 | -1; unidades: UnidadeId[] }[] = [
  { lado: 1, unidades: ['u1', 'u2'] },
  { lado: -1, unidades: ['u3', 'u4', 'u5'] },
]

export function calcularLayout(): Map<string, NoLayout> {
  const unidades = montarArvore()
  const etapaTopico = new Map(TOPICOS.map((t) => [t.id, t]))
  const resultado = new Map<string, NoLayout>()
  resultado.set('raiz', { id: 'raiz', tipo: 'raiz', x: 0, y: 0, lado: 1, etapa: 0 })

  for (const { lado, unidades: us } of LADOS) {
    const raizLado: Arv = { id: 'raiz', tipo: 'raiz', filhos: us.map((u) => unidades.get(u)!) }
    const h = hierarchy(raizLado, (d) => d.filhos)
    tree<Arv>()
      .nodeSize([LINHA, COLUNA])
      .separation((a, b) => (a.parent === b.parent ? 1 : 1.3))(h)

    // etapa de unidade/grupo = a menor etapa dos tópicos abaixo
    h.eachAfter((n) => {
      if (n.data.tipo === 'topico') return
      const filhos = n.children ?? []
      ;(n as unknown as { etapa: number }).etapa = Math.min(
        ...filhos.map((f) => (f.data.tipo === 'topico' ? etapaTopico.get(f.data.id)!.etapa : (f as unknown as { etapa: number }).etapa)),
      )
    })

    h.each((n) => {
      if (n.depth === 0) return
      const horizontal = PRIMEIRA_COLUNA + (n.depth - 1) * COLUNA
      const tp = etapaTopico.get(n.data.id)
      const unidade = tp?.unidade ?? (n.data.tipo === 'unidade' ? (n.data.id.slice(3) as UnidadeId) : undefined)
      resultado.set(n.data.id, {
        id: n.data.id,
        tipo: n.data.tipo,
        x: lado * horizontal,
        y: n.x ?? 0,
        lado,
        etapa: tp ? tp.etapa : (n as unknown as { etapa: number }).etapa,
        unidade: unidade ?? (GRUPOS.find((g) => idGrupo(g.id) === n.data.id)?.unidade),
        pai: n.parent?.data.id,
      })
    })
  }
  return resultado
}

export { idGrupo, idUnidade }
