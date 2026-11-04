// Rede da lista U2, Q11: Hill Climbing até n0 com h = distância em linha reta medida na figura.

const COLUNAS = [265, 367, 467, 569, 670]
const LINHAS = [407, 477, 546, 616]

export const NOS_HC: Record<string, [number, number]> = { n0: [467, 340] }
for (let l = 0; l < 4; l++) for (let c = 0; c < 5; c++) NOS_HC[`n${l * 5 + c + 1}`] = [COLUNAS[c], LINHAS[l]]
NOS_HC.n3 = [467, 382] // n3 fica mais alto, logo abaixo da estrela

/** [a, b, peso mostrado na figura] */
export const ARESTAS_HC: [string, string, number?][] = [
  ['n0', 'n1', 23], ['n0', 'n5', 23], ['n1', 'n2'], ['n2', 'n3', 12], ['n3', 'n4', 12], ['n4', 'n5'], ['n3', 'n8', 8],
  ['n1', 'n6', 5], ['n6', 'n11', 5], ['n11', 'n16', 5],
]
for (const c of [2, 4, 5]) for (let l = 0; l < 3; l++) ARESTAS_HC.push([`n${l * 5 + c}`, `n${(l + 1) * 5 + c}`])
ARESTAS_HC.push(['n8', 'n13'], ['n13', 'n18'])
for (let l = 1; l < 4; l++) for (let c = 1; c < 5; c++) ARESTAS_HC.push([`n${l * 5 + c}`, `n${l * 5 + c + 1}`, l === 3 ? 10 : undefined])

export const OBJETIVO_HC = 'n0'

/** h em décimos de pixel da figura (só a ordem importa). */
export const hHC = (n: string) => {
  const [x, y] = NOS_HC[n]
  const [gx, gy] = NOS_HC[OBJETIVO_HC]
  return Math.round(Math.hypot(x - gx, y - gy)) / 10
}

export const vizinhosHC = (n: string) =>
  ARESTAS_HC.filter(([a, b]) => a === n || b === n)
    .map(([a, b]) => (a === n ? b : a))
    .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))

export interface PassoHC {
  atual: string
  caminho: string[]
  vizinhos: { no: string; h: number }[]
  melhor?: string
  fim?: 'objetivo' | 'preso'
}

/** Hill Climbing clássico: vai para o melhor vizinho só se ele for melhor que o atual. */
export function subir(inicio: string): PassoHC[] {
  const passos: PassoHC[] = []
  let atual = inicio
  const caminho = [inicio]
  for (let k = 0; k < 30; k++) {
    if (atual === OBJETIVO_HC) {
      passos.push({ atual, caminho: [...caminho], vizinhos: [], fim: 'objetivo' })
      return passos
    }
    const viz = vizinhosHC(atual).map((no) => ({ no, h: hHC(no) }))
    const melhor = viz.reduce((m, v) => (v.h < m.h ? v : m))
    if (melhor.h >= hHC(atual)) {
      passos.push({ atual, caminho: [...caminho], vizinhos: viz, fim: 'preso' })
      return passos
    }
    passos.push({ atual, caminho: [...caminho], vizinhos: viz, melhor: melhor.no })
    atual = melhor.no
    caminho.push(atual)
  }
  return passos
}
