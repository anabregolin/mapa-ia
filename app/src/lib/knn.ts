// Dados da lista 5, Q3 (gráfico com duas classes) e o KNN usado na demo.

export type Ponto = { x: number; y: number; classe: 1 | 2 }

const de = (classe: 1 | 2, ps: [number, number][]): Ponto[] => ps.map(([x, y]) => ({ x, y, classe }))

export const PONTOS_Q3: Ponto[] = [
  ...de(1, [[1, 3], [1, 1], [2, 3], [2, 5], [3, 3], [3, 2], [4, 4], [4, 1], [6, 3], [8, 1], [9, 1]]),
  ...de(2, [[5, 9], [5, 7], [6, 2], [7, 9], [7, 7], [7, 6], [8, 9], [8, 7], [9, 8], [9, 6], [9, 4]]),
]

export const NOVO_Q3 = { x: 5, y: 2 }

export type Metrica = 'euclidiana' | 'manhattan'

export const distancia = (m: Metrica, a: { x: number; y: number }, b: { x: number; y: number }) =>
  m === 'euclidiana' ? Math.hypot(a.x - b.x, a.y - b.y) : Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

export function knn(pontos: Ponto[], novo: { x: number; y: number }, k: number, m: Metrica) {
  const ordenados = pontos.map((p) => ({ ...p, d: distancia(m, p, novo) })).sort((a, b) => a.d - b.d || a.classe - b.classe)
  const vizinhos = ordenados.slice(0, k)
  const votos = { 1: 0, 2: 0 }
  vizinhos.forEach((v) => votos[v.classe]++)
  const classe: 1 | 2 | null = votos[1] === votos[2] ? null : votos[1] > votos[2] ? 1 : 2
  // empate na fronteira: o k-ésimo e o (k+1)-ésimo estão à mesma distância
  const empateDistancia = ordenados.length > k && Math.abs(ordenados[k].d - ordenados[k - 1].d) < 1e-9
  return { ordenados, vizinhos, votos, classe, empateDistancia, raio: vizinhos.at(-1)?.d ?? 0 }
}
