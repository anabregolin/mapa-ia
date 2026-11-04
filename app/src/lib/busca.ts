// Busca em grafo passo a passo (BFS, DFS, UCS, gulosa, A*) sobre os grafos das aulas e exercícios.

export interface GrafoBusca {
  id: string
  nome: string
  fonte: string
  /** coordenadas no SVG (y para baixo) */
  nos: Record<string, [number, number]>
  /** nome exibido, quando difere do id (ex.: dois nós "G") */
  rotulos?: Record<string, string>
  arestas: [string, string, number][]
  /** arestas só valem de cima para baixo (árvore de busca da lista) */
  dirigido?: boolean
  h: Record<string, number>
  objetivos: string[]
  origemPadrao: string
  viewBox: string
  descricaoH: string
}

const romeniaLivro: Record<string, [number, number]> = {
  Arad: [91, 492], Bucharest: [400, 327], Craiova: [253, 288], Drobeta: [165, 299], Eforie: [562, 293],
  Fagaras: [305, 449], Giurgiu: [375, 270], Hirsova: [534, 350], Iasi: [473, 506], Lugoj: [165, 379],
  Mehadia: [168, 339], Neamt: [406, 537], Oradea: [131, 571], Pitesti: [320, 368], 'Rimnicu Vilcea': [233, 410],
  Sibiu: [207, 457], Timisoara: [94, 410], Urziceni: [456, 350], Vaslui: [509, 444], Zerind: [108, 531],
}

export const ROMENIA: GrafoBusca = {
  id: 'romenia',
  nome: 'Romênia (aulas 3–5, P1)',
  fonte: 'AIMA / aulas-04-05',
  // as coordenadas do livro têm y para cima
  nos: Object.fromEntries(Object.entries(romeniaLivro).map(([c, [x, y]]) => [c, [x, 610 - y]])),
  arestas: [
    ['Arad', 'Zerind', 75], ['Arad', 'Sibiu', 140], ['Arad', 'Timisoara', 118], ['Zerind', 'Oradea', 71],
    ['Oradea', 'Sibiu', 151], ['Timisoara', 'Lugoj', 111], ['Lugoj', 'Mehadia', 70], ['Mehadia', 'Drobeta', 75],
    ['Drobeta', 'Craiova', 120], ['Craiova', 'Rimnicu Vilcea', 146], ['Craiova', 'Pitesti', 138],
    ['Sibiu', 'Rimnicu Vilcea', 80], ['Sibiu', 'Fagaras', 99], ['Rimnicu Vilcea', 'Pitesti', 97],
    ['Fagaras', 'Bucharest', 211], ['Pitesti', 'Bucharest', 101], ['Bucharest', 'Giurgiu', 90],
    ['Bucharest', 'Urziceni', 85], ['Urziceni', 'Hirsova', 98], ['Hirsova', 'Eforie', 86],
    ['Urziceni', 'Vaslui', 142], ['Vaslui', 'Iasi', 92], ['Iasi', 'Neamt', 87],
  ],
  h: {
    Arad: 366, Bucharest: 0, Craiova: 160, Drobeta: 242, Eforie: 161, Fagaras: 176, Giurgiu: 77, Hirsova: 151,
    Iasi: 226, Lugoj: 244, Mehadia: 241, Neamt: 234, Oradea: 380, Pitesti: 100, 'Rimnicu Vilcea': 193, Sibiu: 253,
    Timisoara: 329, Urziceni: 80, Vaslui: 199, Zerind: 374,
  },
  objetivos: ['Bucharest'],
  origemPadrao: 'Arad',
  viewBox: '40 20 580 380',
  descricaoH: 'h = linha reta até Bucharest',
}

export const RIO_GRANDE_DO_SUL: GrafoBusca = {
  id: 'rs',
  nome: 'Rio Grande do Sul (E1)',
  fonte: 'e1-gabarito',
  nos: {
    Erechim: [603, 85], 'Passo Fundo': [595, 155], Vacaria: [758, 184], Ijuí: [432, 170], 'São Borja': [209, 206],
    Santiago: [331, 270], Uruguaiana: [92, 342], Alegrete: [231, 342], 'Santa Maria': [447, 333], Lajeado: [640, 299],
    'Caxias do Sul': [730, 266], Torres: [884, 287], 'Porto Alegre': [738, 378], Camaquã: [675, 483],
    "Sant'Ana do Livramento": [262, 485], Bagé: [417, 536], Pelotas: [603, 590],
  },
  arestas: [
    ['Erechim', 'Passo Fundo', 82], ['Erechim', 'Vacaria', 209], ['Passo Fundo', 'Vacaria', 175],
    ['Passo Fundo', 'Ijuí', 171], ['Passo Fundo', 'Lajeado', 180], ['Vacaria', 'Caxias do Sul', 113],
    ['Vacaria', 'Torres', 218], ['Caxias do Sul', 'Porto Alegre', 123], ['Lajeado', 'Porto Alegre', 116],
    ['Torres', 'Porto Alegre', 193], ['Santa Maria', 'Porto Alegre', 301], ['Ijuí', 'São Borja', 247],
    ['Ijuí', 'Santiago', 166], ['Ijuí', 'Santa Maria', 175], ['São Borja', 'Uruguaiana', 180],
    ['Uruguaiana', 'Alegrete', 144], ['Santiago', 'Alegrete', 142], ['Alegrete', 'Santa Maria', 223],
    ['Santa Maria', "Sant'Ana do Livramento", 242], ['Santa Maria', 'Pelotas', 295],
    ["Sant'Ana do Livramento", 'Bagé', 161], ['Bagé', 'Pelotas', 189], ['Pelotas', 'Camaquã', 135],
    ['Camaquã', 'Porto Alegre', 130],
  ],
  h: {
    'Porto Alegre': 0, Lajeado: 96, 'Caxias do Sul': 96, Camaquã: 107, Torres: 163, Vacaria: 172, Pelotas: 220,
    'Passo Fundo': 229, 'Santa Maria': 253, Erechim: 286, Bagé: 312, Ijuí: 320, Santiago: 365,
    "Sant'Ana do Livramento": 424, Alegrete: 442, 'São Borja': 488, Uruguaiana: 567,
  },
  objetivos: ['Porto Alegre'],
  origemPadrao: 'Erechim',
  viewBox: '40 50 920 580',
  descricaoH: 'h = distância euclidiana até Porto Alegre (tabela do E1)',
}

export const GRAFO_SG: GrafoBusca = {
  id: 'sg',
  nome: 'Grafo S → G (lista U2, Q8)',
  fonte: 'lista-unidade-2',
  nos: { S: [448, 515], A: [333, 602], B: [448, 602], C: [546, 602], D: [291, 685], E: [376, 685], F: [448, 685], H: [546, 685], G: [448, 767], G2: [546, 767] },
  rotulos: { G2: 'G' },
  arestas: [
    ['S', 'A', 2], ['S', 'B', 1], ['S', 'C', 4], ['A', 'D', 2], ['A', 'E', 5], ['B', 'F', 6],
    ['C', 'H', 2], ['D', 'G', 5], ['E', 'G', 2], ['F', 'G', 1], ['H', 'G2', 3],
  ],
  dirigido: true,
  h: { S: 6, A: 4, B: 3, C: 5, D: 6, E: 1, F: 0.5, H: 2, G: 0, G2: 0 },
  objetivos: ['G', 'G2'],
  origemPadrao: 'S',
  viewBox: '250 485 360 320',
  descricaoH: 'h dada no enunciado (os dois G são objetivos)',
}

export const GRAFOS_BUSCA = [ROMENIA, RIO_GRANDE_DO_SUL, GRAFO_SG]

export type Algoritmo = 'bfs' | 'dfs' | 'ucs' | 'gulosa' | 'astar'

export const ALGORITMOS: Record<Algoritmo, { nome: string; regra: string; precisaH: boolean }> = {
  bfs: { nome: 'Largura (BFS)', regra: 'fila FIFO; testa o objetivo ao gerar', precisaH: false },
  dfs: { nome: 'Profundidade (DFS)', regra: 'pilha LIFO; testa o objetivo ao gerar', precisaH: false },
  ucs: { nome: 'Custo uniforme', regra: 'menor g(n); testa o objetivo ao expandir', precisaH: false },
  gulosa: { nome: 'Gulosa', regra: 'menor h(n); testa o objetivo ao expandir', precisaH: true },
  astar: { nome: 'A*', regra: 'menor f = g + h; testa o objetivo ao expandir', precisaH: true },
}

export interface NoBusca {
  no: string
  g: number
  h: number
  f: number
  caminho: string[]
}

export interface Quadro {
  expandido: NoBusca | null
  fronteira: NoBusca[]
  explorados: string[]
  gerados: NoBusca[]
  solucao?: NoBusca
  falhou?: boolean
  mensagem: string
}

export const rotulo = (g: GrafoBusca, id: string) => g.rotulos?.[id] ?? id

/** Vizinhos em ordem alfabética (a ordem usada nos exercícios). */
export function vizinhos(g: GrafoBusca, id: string) {
  return g.arestas
    .filter(([a, b]) => a === id || (!g.dirigido && b === id))
    .map(([a, b, custo]) => ({ no: a === id ? b : a, custo }))
    .sort((x, y) => x.no.localeCompare(y.no))
}

const prioridade = (alg: Algoritmo, n: NoBusca) => (alg === 'ucs' ? n.g : alg === 'gulosa' ? n.h : n.f)

/** Busca em grafo. Cada quadro é o estado depois de expandir um nó. */
export function simular(grafo: GrafoBusca, alg: Algoritmo, origem: string): Quadro[] {
  const objetivo = (id: string) => grafo.objetivos.includes(id)
  const caminhoTxt = (n: NoBusca) => n.caminho.map((c) => rotulo(grafo, c)).join(' → ')
  const novo = (no: string, g: number, caminho: string[]): NoBusca => ({ no, g, h: grafo.h[no] ?? 0, f: g + (grafo.h[no] ?? 0), caminho })
  const r = (x: number) => Math.round(x * 100) / 100

  const inicio = novo(origem, 0, [origem])
  const quadros: Quadro[] = [{ expandido: null, fronteira: [inicio], explorados: [], gerados: [], mensagem: `Fronteira começa com ${rotulo(grafo, origem)}.` }]
  if (objetivo(origem)) {
    quadros.push({ expandido: inicio, fronteira: [], explorados: [], gerados: [], solucao: inicio, mensagem: 'A origem já é um objetivo.' })
    return quadros
  }

  const fronteira: NoBusca[] = [inicio]
  const explorados: string[] = []
  const testaAoGerar = alg === 'bfs' || alg === 'dfs'

  for (let passo = 0; passo < 300 && fronteira.length; passo++) {
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

    if (!testaAoGerar && objetivo(atual.no)) {
      quadros.push({ expandido: atual, fronteira: [...fronteira], explorados: [...explorados], gerados: [], solucao: atual, mensagem: `${rotulo(grafo, atual.no)} saiu da fronteira: solução com custo ${r(atual.g)}.` })
      return quadros
    }

    explorados.push(atual.no)
    const gerados: NoBusca[] = []
    const viz = vizinhos(grafo, atual.no)
    for (const { no, custo } of alg === 'dfs' ? [...viz].reverse() : viz) {
      if (explorados.includes(no)) continue
      const n = novo(no, atual.g + custo, [...atual.caminho, no])
      const i = fronteira.findIndex((x) => x.no === no)
      if (i >= 0) {
        // UCS/A*/gulosa trocam por um caminho mais barato até o mesmo nó; BFS/DFS ignoram repetidos
        if (!testaAoGerar && n.g < fronteira[i].g) {
          fronteira[i] = n
          gerados.push(n)
        }
        continue
      }
      gerados.push(n)
      if (testaAoGerar && objetivo(no)) {
        quadros.push({ expandido: atual, fronteira: [...fronteira], explorados: [...explorados], gerados, solucao: n, mensagem: `${rotulo(grafo, no)} foi gerado ao expandir ${rotulo(grafo, atual.no)}: ${caminhoTxt(n)}, ${n.caminho.length - 1} passos, custo ${r(n.g)}.` })
        return quadros
      }
      fronteira.push(n)
    }
    const nomes = gerados.map((n) => rotulo(grafo, n.no)).join(', ') || 'nada novo'
    quadros.push({ expandido: atual, fronteira: [...fronteira], explorados: [...explorados], gerados, mensagem: `Expande ${rotulo(grafo, atual.no)} → gera ${nomes}.` })
  }

  quadros.push({ expandido: null, fronteira: [], explorados: [...explorados], gerados: [], falhou: true, mensagem: 'Fronteira vazia: sem solução.' })
  return quadros
}
