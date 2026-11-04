// Minimax e poda alfa-beta passo a passo sobre as árvores dos exercícios.

export interface NoJogo {
  id: string
  /** nome mostrado ao lado do nó (letras da lista); folhas mostram o valor */
  nome?: string
  tipo: 'MAX' | 'MIN' | 'FOLHA'
  valor?: number
  filhos?: NoJogo[]
}

export interface ArvoreJogo {
  id: string
  nome: string
  fonte: string
  raiz: NoJogo
  nota?: string
}

let seq = 0
const f = (valor: number): NoJogo => ({ id: `f${seq++}`, tipo: 'FOLHA', valor })
const max = (nome: string, ...filhos: NoJogo[]): NoJogo => ({ id: nome, nome, tipo: 'MAX', filhos })
const min = (nome: string, ...filhos: NoJogo[]): NoJogo => ({ id: nome, nome, tipo: 'MIN', filhos })

export const ARVORE_Q22: ArvoreJogo = {
  id: 'l2-q22',
  nome: 'Lista U2, Q22',
  fonte: 'lista-unidade-2-gabarito',
  raiz: max(
    'A',
    min('B', max('E', f(3), f(12)), max('F', f(5)), max('G', f(2), f(9))),
    min('C', max('H', f(6)), max('I', f(1), f(4)), max('J', f(8))),
    min('D', max('K', f(7), f(2)), max('L', f(10)), max('M', f(0), f(6), f(5))),
  ),
}

// mesma árvore da simulação do Moodle (e1-simulacao-poda-alfa-beta.html)
export const ARVORE_E1: ArvoreJogo = {
  id: 'e1',
  nome: 'E1, Q5 e Q6',
  fonte: 'e1-gabarito / simulação do Moodle',
  raiz: max(
    'raiz',
    min('min₁', max('a', min('a₁', f(1))), max('b', f(2), f(-5)), max('c', f(0), min('c₁', f(-6), f(0)), f(8))),
    min('min₂', max('d', f(-3), min('d₁', f(5), f(-2), f(9)), f(-1))),
  ),
}

export const ARVORES = [ARVORE_Q22, ARVORE_E1]

export type Evento =
  | { tipo: 'entra'; id: string; alfa: number; beta: number }
  | { tipo: 'folha'; id: string; valor: number }
  | { tipo: 'atualiza'; id: string; filho: string; valorFilho: number; melhor: number; alfa: number; beta: number }
  | { tipo: 'poda'; id: string; podados: string[]; diretos: string[]; alfa: number; beta: number }
  | { tipo: 'retorna'; id: string; valor: number }
  | { tipo: 'fim'; valor: number }

const ids = (n: NoJogo): string[] => [n.id, ...(n.filhos ?? []).flatMap(ids)]

/** Inverte só a ordem dos filhos da raiz (como no gabarito da Q22). */
export function inverterRaiz(r: NoJogo): NoJogo {
  return { ...r, filhos: [...(r.filhos ?? [])].reverse() }
}

export function executar(raiz: NoJogo, poda: boolean): Evento[] {
  const ev: Evento[] = []
  const visita = (n: NoJogo, alfa: number, beta: number): number => {
    if (n.tipo === 'FOLHA') {
      ev.push({ tipo: 'folha', id: n.id, valor: n.valor! })
      return n.valor!
    }
    ev.push({ tipo: 'entra', id: n.id, alfa, beta })
    let melhor = n.tipo === 'MAX' ? -Infinity : Infinity
    const filhos = n.filhos!
    for (let i = 0; i < filhos.length; i++) {
      const v = visita(filhos[i], alfa, beta)
      if (n.tipo === 'MAX') {
        melhor = Math.max(melhor, v)
        if (poda) alfa = Math.max(alfa, melhor)
      } else {
        melhor = Math.min(melhor, v)
        if (poda) beta = Math.min(beta, melhor)
      }
      ev.push({ tipo: 'atualiza', id: n.id, filho: filhos[i].id, valorFilho: v, melhor, alfa, beta })
      if (poda && beta <= alfa) {
        const resto = filhos.slice(i + 1)
        if (resto.length) ev.push({ tipo: 'poda', id: n.id, podados: resto.flatMap(ids), diretos: resto.map((c) => c.id), alfa, beta })
        break
      }
    }
    ev.push({ tipo: 'retorna', id: n.id, valor: melhor })
    return melhor
  }
  const v = visita(raiz, -Infinity, Infinity)
  ev.push({ tipo: 'fim', valor: v })
  return ev
}

export interface EstadoArvore {
  valores: Record<string, number>
  /** melhor valor parcial dos nós ainda abertos */
  parciais: Record<string, number>
  abertos: Set<string>
  visitados: Set<string>
  podados: Set<string>
  /** alfa/beta mais recentes de cada nó */
  ab: Record<string, [number, number]>
  atual?: string
}

/** Estado acumulado depois dos primeiros n eventos. */
export function estadoApos(ev: Evento[], n: number): EstadoArvore {
  const s: EstadoArvore = { valores: {}, parciais: {}, abertos: new Set(), visitados: new Set(), podados: new Set(), ab: {} }
  for (const e of ev.slice(0, n)) {
    if (e.tipo === 'fim') continue
    s.atual = e.id
    if (e.tipo === 'folha') {
      s.valores[e.id] = e.valor
      s.visitados.add(e.id)
    } else if (e.tipo === 'entra') {
      s.abertos.add(e.id)
      s.visitados.add(e.id)
      s.ab[e.id] = [e.alfa, e.beta]
    } else if (e.tipo === 'atualiza') {
      s.parciais[e.id] = e.melhor
      s.ab[e.id] = [e.alfa, e.beta]
    } else if (e.tipo === 'poda') e.podados.forEach((x) => s.podados.add(x))
    else if (e.tipo === 'retorna') {
      s.abertos.delete(e.id)
      s.valores[e.id] = e.valor
    }
  }
  return s
}

export const fmtInf = (x: number) => (x === Infinity ? '+∞' : x === -Infinity ? '−∞' : String(x).replace('-', '−'))

export function descrever(e: Evento, nome: (id: string) => string): string {
  switch (e.tipo) {
    case 'entra':
      return `Entra em ${nome(e.id)} com α = ${fmtInf(e.alfa)}, β = ${fmtInf(e.beta)}.`
    case 'folha':
      return `Folha: valor ${fmtInf(e.valor)}.`
    case 'atualiza':
      return `${nome(e.id)} recebe ${fmtInf(e.valorFilho)} de ${nome(e.filho)}; melhor até agora ${fmtInf(e.melhor)} (α = ${fmtInf(e.alfa)}, β = ${fmtInf(e.beta)}).`
    case 'poda':
      return `Poda em ${nome(e.id)}: β ≤ α (${fmtInf(e.beta)} ≤ ${fmtInf(e.alfa)}), os outros filhos não mudam a decisão.`
    case 'retorna':
      return `${nome(e.id)} devolve ${fmtInf(e.valor)} para o pai.`
    case 'fim':
      return `Fim: valor da raiz = ${fmtInf(e.valor)}.`
  }
}

/** Posições: folhas em colunas iguais, pais no meio dos filhos. */
export function posicoes(raiz: NoJogo) {
  const pos: Record<string, { x: number; y: number }> = {}
  let col = 0
  let prof = 0
  const anda = (n: NoJogo, d: number): number => {
    prof = Math.max(prof, d)
    if (!n.filhos?.length) {
      pos[n.id] = { x: col++, y: d }
      return pos[n.id].x
    }
    const xs = n.filhos.map((c) => anda(c, d + 1))
    pos[n.id] = { x: (xs[0] + xs[xs.length - 1]) / 2, y: d }
    return pos[n.id].x
  }
  anda(raiz, 0)
  return { pos, colunas: col, niveis: prof + 1 }
}

export const todosNos = (r: NoJogo): NoJogo[] => [r, ...(r.filhos ?? []).flatMap(todosNos)]
