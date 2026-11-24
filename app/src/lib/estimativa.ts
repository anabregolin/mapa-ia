// Tempo esperado de estudo de um tópico, a partir do que existe nele.
// ATENÇÃO: as constantes abaixo são palpites razoáveis, não medidas. Não vêm de pesquisa nem do seu histórico.
// Servem para comparar tópicos entre si ("este é mais pesado que aquele") e planejar, não como meta.
// Quando houver tempo real suficiente em `tempo`, dá para recalibrar comparando com o que você levou.

import { CARTOES } from '../content/cartoes'
import { calculosDoTopico } from '../content/calculos'
import { exerciciosDoTopico } from '../content/exercicios'
import { EXPLICACOES } from '../content/explicacoes'
import { formulasDoTopico } from '../content/formulas'
import { topicoPorId } from '../content/topicos'

/** palavras por minuto estudando (não só lendo): texto técnico, com pausa para entender */
const PALAVRAS_POR_MIN = 120
/** quanto o nível pesa na leitura: básico, intermediário, avançado */
const PESO_NIVEL: Record<number, number> = { 1: 1, 2: 1.2, 3: 1.4 }
const MIN_FORMULA = 3
const MIN_CALCULO = 6
const MIN_EXERCICIO = 5
const MIN_CARTAO = 0.5
/** cada página de slide da aula que o tópico cita: muitas são só título ou figura, então pouco por página */
const MIN_SLIDE = 0.5

export interface Estimativa {
  /** total em minutos, arredondado para múltiplo de 5 (mínimo 5) */
  min: number
  /** de onde veio cada parte, em minutos, para mostrar a conta */
  partes: { leitura: number; slides: number; formulas: number; calculos: number; exercicios: number; cartoes: number }
}

const palavras = (s?: string) => (s ? s.split(/\s+/).filter(Boolean).length : 0)

/** páginas de slide citadas pelo tópico ("5-27" → 23). Fonte sem faixa (o arquivo todo) não entra: não dá para saber quanto dele é deste tópico. */
function paginasDeSlide(id: string) {
  return topicoPorId.get(id)!.fontes.reduce((soma, f) => {
    const [a, b] = (f.paginas ?? '').split('-').map(Number)
    return Number.isFinite(a) && a > 0 ? soma + (Number.isFinite(b) && b >= a ? b - a + 1 : 1) : soma
  }, 0)
}

const cache = new Map<string, Estimativa>()

export function estimarTopico(id: string): Estimativa {
  const pronto = cache.get(id)
  if (pronto) return pronto
  const tp = topicoPorId.get(id)!
  const c = EXPLICACOES[id]
  const n = c
    ? palavras(c.oQueE?.e) +
      palavras(c.oQueE?.serve) +
      palavras(c.oQueE?.onde.join(' ')) +
      palavras(c.oQueE?.aviso) +
      palavras(c.intuicao) +
      palavras(c.definicao) +
      palavras(c.detalhe) +
      palavras(c.cuidado)
    : palavras(tp.resumo)
  const partes = {
    leitura: (n / PALAVRAS_POR_MIN) * (PESO_NIVEL[tp.nivel] ?? 1),
    slides: paginasDeSlide(id) * MIN_SLIDE,
    formulas: formulasDoTopico(id).length * MIN_FORMULA,
    calculos: calculosDoTopico(id).length * MIN_CALCULO,
    exercicios: exerciciosDoTopico(id).length * MIN_EXERCICIO,
    cartoes: CARTOES.filter((x) => x.topico === id).length * MIN_CARTAO,
  }
  const soma = Object.values(partes).reduce((a, b) => a + b, 0)
  const e = { min: Math.max(5, Math.round(soma / 5) * 5), partes }
  cache.set(id, e)
  return e
}

export const estimarTopicos = (ids: string[]) => ids.reduce((s, id) => s + estimarTopico(id).min, 0)

/** "≈ 25 min", "≈ 1 h 10 min" */
export function formatarEstimativa(min: number) {
  if (min < 60) return `≈ ${min} min`
  const h = Math.floor(min / 60)
  const r = min % 60
  return r ? `≈ ${h} h ${r} min` : `≈ ${h} h`
}

/** as partes da conta, já formatadas, para listar em bullets: [nome, minutos] */
export function partesEstimativa(e: Estimativa): [string, string][] {
  const p = e.partes
  const min = (x: number) => (x < 1 ? 'menos de 1 min' : `${Math.round(x)} min`)
  const itens: [string, number][] = [
    ['texto', p.leitura],
    ['slides da aula', p.slides],
    ['fórmulas', p.formulas],
    ['cálculos', p.calculos],
    ['exercícios', p.exercicios],
    ['cartões', p.cartoes],
  ]
  return itens.filter(([, v]) => v > 0).map(([n, v]) => [n, min(v)])
}

/** a conta por extenso, para o title do chip */
export function explicarEstimativa(e: Estimativa) {
  const p = e.partes
  const min = (x: number) => (x < 1 ? 'menos de 1 min' : `${Math.round(x)} min`)
  const itens = [
    p.leitura && `texto ${min(p.leitura)}`,
    p.slides && `slides ${min(p.slides)}`,
    p.formulas && `fórmulas ${p.formulas} min`,
    p.calculos && `cálculos ${p.calculos} min`,
    p.exercicios && `exercícios ${p.exercicios} min`,
    p.cartoes && `cartões ${min(p.cartoes)}`,
  ].filter(Boolean)
  return `Tempo esperado (palpite, não medida): ${itens.join(' + ')}, arredondado de 5 em 5 (mínimo 5 min)`
}
