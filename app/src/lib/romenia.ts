// Mapa da Romênia do AIMA (Russell & Norvig), o mesmo das aulas 3–5 e da P1.

export const CIDADES = {
  Arad: [91, 492],
  Bucharest: [400, 327],
  Craiova: [253, 288],
  Drobeta: [165, 299],
  Eforie: [562, 293],
  Fagaras: [305, 449],
  Giurgiu: [375, 270],
  Hirsova: [534, 350],
  Iasi: [473, 506],
  Lugoj: [165, 379],
  Mehadia: [168, 339],
  Neamt: [406, 537],
  Oradea: [131, 571],
  Pitesti: [320, 368],
  'Rimnicu Vilcea': [233, 410],
  Sibiu: [207, 457],
  Timisoara: [94, 410],
  Urziceni: [456, 350],
  Vaslui: [509, 444],
  Zerind: [108, 531],
} as const satisfies Record<string, readonly [number, number]>

export type Cidade = keyof typeof CIDADES
export const NOMES = (Object.keys(CIDADES) as Cidade[]).sort((a, b) => a.localeCompare(b))

export const ESTRADAS: [Cidade, Cidade, number][] = [
  ['Arad', 'Zerind', 75],
  ['Arad', 'Sibiu', 140],
  ['Arad', 'Timisoara', 118],
  ['Zerind', 'Oradea', 71],
  ['Oradea', 'Sibiu', 151],
  ['Timisoara', 'Lugoj', 111],
  ['Lugoj', 'Mehadia', 70],
  ['Mehadia', 'Drobeta', 75],
  ['Drobeta', 'Craiova', 120],
  ['Craiova', 'Rimnicu Vilcea', 146],
  ['Craiova', 'Pitesti', 138],
  ['Sibiu', 'Rimnicu Vilcea', 80],
  ['Sibiu', 'Fagaras', 99],
  ['Rimnicu Vilcea', 'Pitesti', 97],
  ['Fagaras', 'Bucharest', 211],
  ['Pitesti', 'Bucharest', 101],
  ['Bucharest', 'Giurgiu', 90],
  ['Bucharest', 'Urziceni', 85],
  ['Urziceni', 'Hirsova', 98],
  ['Hirsova', 'Eforie', 86],
  ['Urziceni', 'Vaslui', 142],
  ['Vaslui', 'Iasi', 92],
  ['Iasi', 'Neamt', 87],
]

/** Distância em linha reta até Bucharest (tabela do livro e dos slides). */
export const H_BUCHAREST: Record<Cidade, number> = {
  Arad: 366, Bucharest: 0, Craiova: 160, Drobeta: 242, Eforie: 161, Fagaras: 176, Giurgiu: 77, Hirsova: 151,
  Iasi: 226, Lugoj: 244, Mehadia: 241, Neamt: 234, Oradea: 380, Pitesti: 100, 'Rimnicu Vilcea': 193, Sibiu: 253,
  Timisoara: 329, Urziceni: 80, Vaslui: 199, Zerind: 374,
}

/** Vizinhos em ordem alfabética: a ordem de expansão que se usa nos exercícios. */
export const VIZINHOS: Record<Cidade, { cidade: Cidade; custo: number }[]> = Object.fromEntries(
  NOMES.map((c) => [
    c,
    ESTRADAS.filter(([a, b]) => a === c || b === c)
      .map(([a, b, custo]) => ({ cidade: a === c ? b : a, custo }))
      .sort((x, y) => x.cidade.localeCompare(y.cidade)),
  ]),
) as Record<Cidade, { cidade: Cidade; custo: number }[]>

export type Algoritmo = 'bfs' | 'dfs' | 'ucs' | 'gulosa' | 'astar'

export const ALGORITMOS: Record<Algoritmo, { nome: string; regra: string; precisaH: boolean }> = {
  bfs: { nome: 'Largura (BFS)', regra: 'fila FIFO; testa o objetivo ao gerar', precisaH: false },
  dfs: { nome: 'Profundidade (DFS)', regra: 'pilha LIFO; testa o objetivo ao gerar', precisaH: false },
  ucs: { nome: 'Custo uniforme', regra: 'menor g(n); testa o objetivo ao expandir', precisaH: false },
  gulosa: { nome: 'Gulosa', regra: 'menor h(n); testa o objetivo ao expandir', precisaH: true },
  astar: { nome: 'A*', regra: 'menor f = g + h; testa o objetivo ao expandir', precisaH: true },
}

export interface NoBusca {
  cidade: Cidade
  g: number
  h: number
  f: number
  caminho: Cidade[]
}

export interface Quadro {
  /** nó expandido neste passo (null no quadro inicial) */
  expandido: NoBusca | null
  fronteira: NoBusca[]
  explorados: Cidade[]
  gerados: NoBusca[]
  solucao?: NoBusca
  falhou?: boolean
  mensagem: string
}

const prioridade = (alg: Algoritmo, n: NoBusca) => (alg === 'ucs' ? n.g : alg === 'gulosa' ? n.h : n.f)

/**
 * Busca em grafo passo a passo. Cada quadro é o estado depois de expandir um nó.
 * Destino fixo em Bucharest para a heurística valer (é a única tabela de h da aula).
 */
export function simular(alg: Algoritmo, origem: Cidade, destino: Cidade = 'Bucharest'): Quadro[] {
  const h = (c: Cidade) => (destino === 'Bucharest' ? H_BUCHAREST[c] : 0)
  const no = (cidade: Cidade, g: number, caminho: Cidade[]): NoBusca => ({ cidade, g, h: h(cidade), f: g + h(cidade), caminho })

  const inicio = no(origem, 0, [origem])
  const quadros: Quadro[] = []
  let fronteira: NoBusca[] = [inicio]
  const explorados: Cidade[] = []
  const testaAoGerar = alg === 'bfs' || alg === 'dfs'

  quadros.push({ expandido: null, fronteira: [...fronteira], explorados: [], gerados: [], mensagem: `Fronteira começa com ${origem}.` })
  if (origem === destino) {
    quadros.push({ expandido: inicio, fronteira: [], explorados: [], gerados: [], solucao: inicio, mensagem: 'A origem já é o destino.' })
    return quadros
  }

  for (let passo = 0; passo < 200 && fronteira.length; passo++) {
    // escolhe o próximo nó conforme a estratégia
    let atual: NoBusca
    if (alg === 'bfs') atual = fronteira.shift()!
    else if (alg === 'dfs') atual = fronteira.pop()!
    else {
      let melhor = 0
      fronteira.forEach((n, i) => {
        if (prioridade(alg, n) < prioridade(alg, fronteira[melhor])) melhor = i
      })
      atual = fronteira.splice(melhor, 1)[0]
    }

    if (!testaAoGerar && atual.cidade === destino) {
      quadros.push({ expandido: atual, fronteira: [...fronteira], explorados: [...explorados], gerados: [], solucao: atual, mensagem: `${destino} saiu da fronteira: solução com custo ${atual.g}.` })
      return quadros
    }

    explorados.push(atual.cidade)
    const gerados: NoBusca[] = []
    const vizinhos = alg === 'dfs' ? [...VIZINHOS[atual.cidade]].reverse() : VIZINHOS[atual.cidade]
    for (const { cidade, custo } of vizinhos) {
      if (explorados.includes(cidade)) continue
      const novo = no(cidade, atual.g + custo, [...atual.caminho, cidade])
      const i = fronteira.findIndex((n) => n.cidade === cidade)
      if (i >= 0) {
        // UCS/A*/gulosa trocam por um caminho mais barato até a mesma cidade; BFS/DFS ignoram repetidos
        if (!testaAoGerar && novo.g < fronteira[i].g) {
          fronteira[i] = novo
          gerados.push(novo)
        }
        continue
      }
      gerados.push(novo)
      if (testaAoGerar && cidade === destino) {
        quadros.push({ expandido: atual, fronteira: [...fronteira], explorados: [...explorados], gerados, solucao: novo, mensagem: `${destino} foi gerado ao expandir ${atual.cidade}: solução com ${novo.caminho.length - 1} passos e ${novo.g} km.` })
        return quadros
      }
      fronteira.push(novo)
    }
    const nomes = gerados.map((n) => n.cidade).join(', ') || 'nada novo'
    quadros.push({ expandido: atual, fronteira: [...fronteira], explorados: [...explorados], gerados, mensagem: `Expande ${atual.cidade} → gera ${nomes}.` })
  }

  quadros.push({ expandido: null, fronteira: [], explorados: [...explorados], gerados: [], falhou: true, mensagem: 'Fronteira vazia: sem solução.' })
  return quadros
}
