// O desenvolvimento livre de um treino de cálculo: linhas feitas de caixas (números que você escreve),
// operações e estruturas (fração, raiz, potência). O site não calcula nada daqui: só guarda e desenha.
import type { PassoCalculo } from '../content/calculos'

export type Op = '+' | '−' | '×' | '÷' | '=' | '≈' | '(' | ')' | 'log₂' | 'ln' | 'Σ'

export type Peca =
  | { id: string; t: 'num'; v: string }
  | { id: string; t: 'op'; v: Op }
  /** fração: a em cima, b embaixo */
  | { id: string; t: 'frac'; a: Peca[]; b: Peca[] }
  | { id: string; t: 'raiz'; a: Peca[] }
  /** expoente, escrito pequeno e para cima depois da peça anterior */
  | { id: string; t: 'pot'; a: Peca[] }

export interface Linha {
  id: string
  a: Peca[]
}

/** Uma aba do desenvolvimento: uma folha de contas com nome. */
export interface Folha {
  id: string
  nome: string
  linhas: Linha[]
}

export interface Desenvolvimento {
  /** números do treino (0 = os do material) */
  seed: number
  /** as abas; as respostas finais são as mesmas para todas */
  folhas?: Folha[]
  /** aba aberta */
  aba?: string
  /** formato antigo (antes das abas): vira a primeira aba */
  linhas?: Linha[]
  /** resposta final de cada passo, como você escreveu (nos passos de escolha, o índice da opção) */
  respostas: string[]
  /** resultado da última conferência; null = mudou depois de conferir */
  conferido?: (boolean | null)[]
  /** a primeira conferência já entrou no histórico do treino */
  registrado?: boolean
  em: number
}

/** Onde uma lista de peças mora: numa linha (lado 'a') ou dentro de uma estrutura. */
export interface Lugar {
  dono: string
  lado: 'a' | 'b'
}

export const novoIdPeca = () => Math.random().toString(36).slice(2, 9)
export const caixa = (v = ''): Peca => ({ id: novoIdPeca(), t: 'num', v })
export const novaLinha = (): Linha => ({ id: novoIdPeca(), a: [caixa()] })

export const novaFolha = (nome: string): Folha => ({ id: novoIdPeca(), nome, linhas: [novaLinha()] })

export function novoDesenvolvimento(seed: number, passos: number): Desenvolvimento {
  const f = novaFolha('aba 1')
  return { seed, folhas: [f], aba: f.id, respostas: Array(passos).fill(''), em: Date.now() }
}

/** As abas do desenvolvimento (um rascunho do formato antigo vira uma aba só). */
export function folhasDe(d: Desenvolvimento): Folha[] {
  if (d.folhas?.length) return d.folhas
  return [{ id: 'aba-1', nome: 'aba 1', linhas: d.linhas?.length ? d.linhas : [{ id: 'linha-1', a: [{ id: 'caixa-1', t: 'num', v: '' }] }] }]
}

/** Nome livre para uma aba nova: "aba 2", "aba 3"… */
export function proximoNome(folhas: Folha[]) {
  let n = folhas.length + 1
  while (folhas.some((f) => f.nome === `aba ${n}`)) n++
  return `aba ${n}`
}

/** Copia uma aba com ids novos (para as duas não andarem juntas). */
export function copiarFolha(f: Folha, nome: string): Folha {
  const nova = (lista: Peca[]): Peca[] =>
    lista.map((p) => (p.t === 'frac' ? { ...p, id: novoIdPeca(), a: nova(p.a), b: nova(p.b) } : p.t === 'raiz' || p.t === 'pot' ? { ...p, id: novoIdPeca(), a: nova(p.a) } : { ...p, id: novoIdPeca() }))
  return { id: novoIdPeca(), nome, linhas: f.linhas.map((l) => ({ id: novoIdPeca(), a: nova(l.a) })) }
}

const algo = (lista: Peca[]): boolean => lista.some((p) => (p.t === 'num' ? p.v.trim() !== '' : p.t === 'op' ? true : p.t === 'frac' ? algo(p.a) || algo(p.b) : algo(p.a)))

/** A aba tem alguma coisa escrita? */
export const folhaComConteudo = (f: Folha) => f.linhas.some((l) => algo(l.a))

type Muda = (lista: Peca[]) => Peca[]

function dentro(lista: Peca[], l: Lugar, f: Muda): Peca[] {
  return lista.map((p) => {
    if (p.t === 'frac') {
      return {
        ...p,
        a: p.id === l.dono && l.lado === 'a' ? f(p.a) : dentro(p.a, l, f),
        b: p.id === l.dono && l.lado === 'b' ? f(p.b) : dentro(p.b, l, f),
      }
    }
    if (p.t === 'raiz' || p.t === 'pot') return { ...p, a: p.id === l.dono ? f(p.a) : dentro(p.a, l, f) }
    return p
  })
}

/** Muda a lista de peças de um lugar (linha ou espaço de uma estrutura). */
export const editarLugar = (linhas: Linha[], l: Lugar, f: Muda): Linha[] =>
  linhas.map((ln) => (ln.id === l.dono ? { ...ln, a: f(ln.a) } : { ...ln, a: dentro(ln.a, l, f) }))

/** Põe as peças logo depois de `depois` (null = no começo). */
export const inserir = (linhas: Linha[], l: Lugar, depois: string | null, novas: Peca[]) =>
  editarLugar(linhas, l, (lista) => {
    const i = depois === null ? 0 : lista.findIndex((p) => p.id === depois) + 1
    return [...lista.slice(0, i), ...novas, ...lista.slice(i)]
  })

function semPeca(lista: Peca[], id: string): Peca[] {
  return lista
    .filter((p) => p.id !== id)
    .map((p) => {
      if (p.t === 'frac') return { ...p, a: semPeca(p.a, id), b: semPeca(p.b, id) }
      if (p.t === 'raiz' || p.t === 'pot') return { ...p, a: semPeca(p.a, id) }
      return p
    })
}

export const removerPeca = (linhas: Linha[], id: string) => linhas.map((ln) => ({ ...ln, a: semPeca(ln.a, id) }))

function comValor(lista: Peca[], id: string, v: string): Peca[] {
  return lista.map((p) => {
    if (p.id === id && p.t === 'num') return { ...p, v }
    if (p.t === 'frac') return { ...p, a: comValor(p.a, id, v), b: comValor(p.b, id, v) }
    if (p.t === 'raiz' || p.t === 'pot') return { ...p, a: comValor(p.a, id, v) }
    return p
  })
}

export const mudarValor = (linhas: Linha[], id: string, v: string) => linhas.map((ln) => ({ ...ln, a: comValor(ln.a, id, v) }))

/** Em que lugar está a peça e qual peça vem antes dela (null = é a primeira). */
export function ondeEsta(linhas: Linha[], id: string): { lugar: Lugar; antes: string | null } | null {
  const procurar = (lista: Peca[], lugar: Lugar): { lugar: Lugar; antes: string | null } | null => {
    for (let i = 0; i < lista.length; i++) {
      const p = lista[i]
      if (p.id === id) return { lugar, antes: i > 0 ? lista[i - 1].id : null }
      const r =
        p.t === 'frac'
          ? (procurar(p.a, { dono: p.id, lado: 'a' }) ?? procurar(p.b, { dono: p.id, lado: 'b' }))
          : p.t === 'raiz' || p.t === 'pot'
            ? procurar(p.a, { dono: p.id, lado: 'a' })
            : null
      if (r) return r
    }
    return null
  }
  for (const ln of linhas) {
    const r = procurar(ln.a, { dono: ln.id, lado: 'a' })
    if (r) return r
  }
  return null
}

/** Quantas peças tem tudo (para saber se há algo escrito). */
export function temConteudo(d: Desenvolvimento | undefined) {
  if (!d) return false
  return folhasDe(d).some(folhaComConteudo) || d.respostas.some((r) => r.trim() !== '')
}

/** A resposta esperada de um passo, escrita como no material. */
export function esperado(p: PassoCalculo) {
  if (p.opcoes) return p.opcoes[p.resposta]
  const casas = p.casas ?? 3
  const v = p.resposta.toLocaleString('pt-BR', { maximumFractionDigits: casas })
  return p.porcento ? `${v}%` : v
}

/** As peças de um lugar (null se o lugar não existe mais). */
export function listaDe(linhas: Linha[], l: Lugar): Peca[] | null {
  let achou: Peca[] | null = null
  editarLugar(linhas, l, (lista) => ((achou = lista), lista))
  return achou
}
