// Marca-texto: trechos do conteúdo de um tópico marcados com uma cor.
// Cada cor tem um objetivo que você define (vira a "tag" da marca).
// A marca guarda o próprio trecho e um pedaço do texto em volta (contexto), para:
//  1) achar o trecho de novo quando o tópico for reaberto;
//  2) mostrar de onde ele veio quando você retomar, mesmo fora do tópico.
// A pintura usa a CSS Custom Highlight API (não mexe no HTML do texto). Em navegador sem
// suporte, as marcas continuam salvas e listadas, só não aparecem pintadas no texto.

export type IdCor = 'amarelo' | 'rosa' | 'verde' | 'azul' | 'lilas'

export interface CorMarca {
  id: IdCor
  objetivo: string
}

export interface Marca {
  id: string
  topico: string
  /** chave da camada onde está o trecho (intuicao, definicao, detalhe…) */
  camada: string
  texto: string
  antes: string
  depois: string
  cor: IdCor
  /** o que você escreveu sobre o trecho */
  nota: string
  em: number
  /**
   * etiquetas além da cor: texto livre ("revisar sábado"), uma trilha/aba ("aba:p2")
   * ou outro tópico relacionado ("t:u5.gini"). Marcas antigas não têm o campo.
   */
  tags?: string[]
  /** sai da lista de anotações (o grifo continua no texto); dá para desarquivar */
  arquivada?: boolean
}

export type TipoTag = 'livre' | 'aba' | 'topico'
export const tipoTag = (t: string): TipoTag => (t.startsWith('aba:') ? 'aba' : t.startsWith('t:') ? 'topico' : 'livre')
/** compara tags livres sem ligar para maiúsculas e acentos */
export const normalTag = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

export const TINTA: Record<IdCor, { fundo: string; forte: string; nome: string }> = {
  amarelo: { fundo: '#fde68a', forte: '#b45309', nome: 'amarelo' },
  rosa: { fundo: '#fbcfe8', forte: '#be185d', nome: 'rosa' },
  verde: { fundo: '#bbf7d0', forte: '#15803d', nome: 'verde' },
  azul: { fundo: '#bfdbfe', forte: '#1d4ed8', nome: 'azul' },
  lilas: { fundo: '#ddd6fe', forte: '#6d28d9', nome: 'lilás' },
}

export const CORES_PADRAO: CorMarca[] = [
  { id: 'amarelo', objetivo: 'cai na prova' },
  { id: 'rosa', objetivo: 'não entendi' },
  { id: 'verde', objetivo: 'exemplo bom' },
  { id: 'azul', objetivo: 'liga com outro tópico' },
  { id: 'lilas', objetivo: 'decorar' },
]

const CONTEXTO = 70

/* ───────────── texto ↔ posição ───────────── */

/** nós de texto que contam: pula a cópia MathML escondida do KaTeX e o que não é para marcar */
function nosDeTexto(raiz: Element): Text[] {
  const nos: Text[] = []
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest('.katex-mathml, [data-nao-marcar], button, textarea, input') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  })
  for (let n = w.nextNode(); n; n = w.nextNode()) nos.push(n as Text)
  return nos
}

export interface Mapa {
  texto: string
  /** ini = onde o nó começa no texto; tam = quantos caracteres ele conta (sem os hifens invisíveis) */
  nos: { no: Text; ini: number; tam: number }[]
}

// A hifenização (lib/hifenizar) põe hifens invisíveis (U+00AD) dentro das palavras. Eles não contam:
// o texto da camada é o mesmo com ou sem eles, e as marcas antigas continuam achando o trecho.
const HIFEN = '\u00AD'

/** offset no nó (contando hifens) → posição sem hifens */
const semHifens = (no: Text, off: number) => {
  let n = 0
  for (let i = 0; i < off && i < no.data.length; i++) if (no.data[i] !== HIFEN) n++
  return n
}

/** posição sem hifens → offset no nó (contando hifens) */
const comHifens = (no: Text, i: number) => {
  if (!no.data.includes(HIFEN)) return i
  let n = 0
  for (let k = 0; k < no.data.length; k++) {
    if (no.data[k] === HIFEN) continue
    if (n === i) return k
    n++
  }
  return no.data.length
}

export function mapear(raiz: Element): Mapa {
  let texto = ''
  const nos = nosDeTexto(raiz).map((no) => {
    const ini = texto.length
    // espaço que não quebra (o da seta grudada) conta como espaço comum: mesmo tamanho, marcas antigas continuam achando o trecho
    const limpo = no.data.replace(/\u00a0/g, ' ').replaceAll(HIFEN, '')
    texto += limpo
    return { no, ini, tam: limpo.length }
  })
  return { texto, nos }
}

/** posição (no, offset) do DOM → índice no texto da camada */
export function indiceDe(m: Mapa, no: Node, off: number): number {
  const ponto = document.createRange()
  ponto.setStart(no, off)
  for (const { no: t, ini, tam } of m.nos) {
    if (t === no) return ini + semHifens(t, off)
    // o fim deste nó já passou do ponto? então o ponto está antes ou dentro dele
    const c = ponto.comparePoint(t, t.length)
    if (c === 0) return ini + tam
    if (c > 0) return ini
  }
  return m.texto.length
}

/** índice no texto → Range no DOM */
export function rangeDe(m: Mapa, a: number, b: number): Range | null {
  const achar = (i: number, fim: boolean) => {
    for (const { no, ini, tam } of m.nos) {
      const f = ini + tam
      if (i < f || (fim && i === f)) return { no, off: comHifens(no, i - ini) }
    }
    return null
  }
  const ini = achar(a, false)
  const fim = achar(b, true)
  if (!ini || !fim) return null
  const r = document.createRange()
  r.setStart(ini.no, ini.off)
  r.setEnd(fim.no, fim.off)
  return r
}

export function recortar(m: Mapa, a: number, b: number) {
  return { texto: m.texto.slice(a, b), antes: m.texto.slice(Math.max(0, a - CONTEXTO), a), depois: m.texto.slice(b, b + CONTEXTO) }
}

/** acha a marca no texto; se o trecho aparece mais de uma vez, fica com o que tem o contexto mais parecido */
export function localizar(texto: string, marca: Pick<Marca, 'texto' | 'antes' | 'depois'>): [number, number] | null {
  if (!marca.texto) return null
  let melhor: [number, number] | null = null
  let nota = -1
  for (let i = texto.indexOf(marca.texto); i >= 0; i = texto.indexOf(marca.texto, i + 1)) {
    let s = 0
    while (s < marca.antes.length && texto[i - 1 - s] === marca.antes[marca.antes.length - 1 - s]) s++
    const f = i + marca.texto.length
    let p = 0
    while (p < marca.depois.length && texto[f + p] === marca.depois[p]) p++
    if (s + p > nota) {
      nota = s + p
      melhor = [i, f]
    }
  }
  return melhor
}

export const temPintura = () => typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight !== 'undefined'

/** limpa espaços repetidos para mostrar o trecho fora do tópico */
export const limpo = (s: string) => s.replace(/\s+/g, ' ')
