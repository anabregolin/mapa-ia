// Posições 3D da galáxia: o sol "IA" no centro, unidades como planetas num anel,
// grupos como luas em volta de cada planeta e tópicos como um aglomerado de estrelas em volta da lua.
import { ETAPAS, GRUPOS, TOPICOS, UNIDADES } from '../content/topicos'
import type { UnidadeId } from '../content/tipos'

export type V3 = [number, number, number]

export const RAIO_UNIDADES = 34

const soma = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const escala = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k]
export const normal = (a: V3): V3 => {
  const n = Math.hypot(...a) || 1
  return escala(a, 1 / n)
}
export const distancia = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

/** Pontos bem espalhados numa esfera (espiral de Fibonacci). */
function esfera(n: number, raio: number, giro: number): V3[] {
  const ouro = Math.PI * (3 - Math.sqrt(5))
  return Array.from({ length: n }, (_, i) => {
    const y = n === 1 ? 0 : 1 - (i / (n - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const a = i * ouro + giro
    return [Math.cos(a) * r * raio, y * raio * 0.75, Math.sin(a) * r * raio] as V3
  })
}

export const POS_UNIDADE = new Map<UnidadeId, V3>(
  UNIDADES.map((u, i) => {
    const a = (i / UNIDADES.length) * Math.PI * 2 - Math.PI / 2
    return [u.id, [Math.cos(a) * RAIO_UNIDADES, Math.sin(i * 1.7) * 5, Math.sin(a) * RAIO_UNIDADES]]
  }),
)

/** Luas: num anel inclinado em volta do planeta, viradas para fora do centro. */
export const POS_GRUPO = new Map<string, V3>()
for (const u of UNIDADES) {
  const centro = POS_UNIDADE.get(u.id)!
  const grupos = GRUPOS.filter((g) => g.unidade === u.id)
  const raio = 8 + grupos.length * 0.8
  const base = Math.atan2(centro[2], centro[0])
  grupos.forEach((g, i) => {
    // abre um leque do lado de fora do anel de planetas
    const a = base + (grupos.length === 1 ? 0 : (i / (grupos.length - 1) - 0.5) * Math.PI * 1.1)
    POS_GRUPO.set(g.id, soma(centro, [Math.cos(a) * raio, (i % 2 ? 1 : -1) * 2.2, Math.sin(a) * raio]))
  })
}

export const POS_TOPICO = new Map<string, V3>()
for (const g of GRUPOS) {
  const centro = POS_GRUPO.get(g.id)!
  const tps = TOPICOS.filter((t) => t.grupo === g.id)
  const raio = 2.4 + Math.sqrt(tps.length) * 0.75
  esfera(tps.length, raio, g.etapa).forEach((p, i) => POS_TOPICO.set(tps[i].id, soma(centro, p)))
}

/** Grupo em foco para uma etapa da barra (avaliação: o grupo da aula anterior). */
export function grupoDaEtapa(pos: number): string | null {
  const etapa = ETAPAS.find((e) => e.pos === pos)
  if (!etapa || pos === 0) return null
  const g = GRUPOS.find((x) => x.etapa === pos) ?? [...GRUPOS].reverse().find((x) => x.etapa < pos)
  return g?.id ?? null
}

export type Foco = { nivel: 'galaxia' } | { nivel: 'unidade'; id: UnidadeId } | { nivel: 'grupo'; id: string }

/** Para onde a câmera olha e de onde, em cada nível. */
export function enquadrar(foco: Foco, topico?: string | null): { alvo: V3; camera: V3 } {
  if (topico && POS_TOPICO.has(topico)) {
    const t = POS_TOPICO.get(topico)!
    const g = POS_GRUPO.get(TOPICOS.find((x) => x.id === topico)!.grupo)!
    // de lado em relação à lua, para ela não ficar bem atrás do tópico
    const fora = normal([t[0] - g[0], 0, t[2] - g[2]])
    const lado: V3 = [-fora[2], 0, fora[0]]
    const dir = normal(soma(soma(escala(fora, 0.7), escala(lado, 0.7)), [0, 0.6, 0]))
    return { alvo: t, camera: soma(t, escala(dir, 9)) }
  }
  if (foco.nivel === 'grupo') {
    const g = POS_GRUPO.get(foco.id)!
    const u = POS_UNIDADE.get(GRUPOS.find((x) => x.id === foco.id)!.unidade)!
    // de lado e de cima, para o planeta não tapar a lua
    const fora = normal([g[0] - u[0], 0, g[2] - u[2]])
    const lado: V3 = [-fora[2], 0, fora[0]]
    const dir = normal(soma(soma(escala(fora, 0.55), escala(lado, 0.6)), [0, 0.75, 0]))
    return { alvo: g, camera: soma(g, escala(dir, 12.5)) }
  }
  if (foco.nivel === 'unidade') {
    // olha para o meio do planeta com as luas dele, de cima e de fora do anel
    const u = POS_UNIDADE.get(foco.id)!
    const luas = GRUPOS.filter((g) => g.unidade === foco.id).map((g) => POS_GRUPO.get(g.id)!)
    const meio = escala([u, ...luas].reduce(soma), 1 / (luas.length + 1))
    const fora = normal([u[0], 0, u[2]])
    return { alvo: meio, camera: soma(meio, soma(escala(fora, 25), [0, 22, 0])) }
  }
  return { alvo: [0, 0, 0], camera: [0, 48, 72] }
}
