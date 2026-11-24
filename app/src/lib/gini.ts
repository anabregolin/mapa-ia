// Contas da demo de Gini e entropia. Dados: tabela de fraude no imposto da aula 24 (p. 16-17).

export interface Registro {
  id: number
  reembolso: 'Sim' | 'Não'
  civil: 'Solteiro' | 'Casado' | 'Divorciado'
  /** renda tributável em mil */
  renda: number
  fraude: boolean
}

export const FRAUDE: Registro[] = [
  { id: 1, reembolso: 'Sim', civil: 'Solteiro', renda: 125, fraude: false },
  { id: 2, reembolso: 'Não', civil: 'Casado', renda: 100, fraude: false },
  { id: 3, reembolso: 'Não', civil: 'Solteiro', renda: 70, fraude: false },
  { id: 4, reembolso: 'Sim', civil: 'Casado', renda: 120, fraude: false },
  { id: 5, reembolso: 'Não', civil: 'Divorciado', renda: 95, fraude: true },
  { id: 6, reembolso: 'Não', civil: 'Casado', renda: 60, fraude: false },
  { id: 7, reembolso: 'Sim', civil: 'Divorciado', renda: 220, fraude: false },
  { id: 8, reembolso: 'Não', civil: 'Solteiro', renda: 85, fraude: true },
  { id: 9, reembolso: 'Não', civil: 'Casado', renda: 75, fraude: false },
  { id: 10, reembolso: 'Não', civil: 'Solteiro', renda: 90, fraude: true },
]

export interface Contagem {
  sim: number
  nao: number
  n: number
}

export const contar = (rs: Registro[]): Contagem => {
  const sim = rs.filter((r) => r.fraude).length
  return { sim, nao: rs.length - sim, n: rs.length }
}

export const gini = ({ sim, nao, n }: Contagem) => (n ? 1 - (sim / n) ** 2 - (nao / n) ** 2 : 0)

export const entropia = ({ sim, nao, n }: Contagem) => {
  const termo = (k: number) => (k ? -(k / n) * Math.log2(k / n) : 0)
  return n ? termo(sim) + termo(nao) : 0
}

export interface Divisao {
  id: string
  /** "Recebeu reembolso?", "Renda ≤ 80 mil?" */
  pergunta: string
  ramos: { rotulo: string; registros: Registro[] }[]
}

/** Divisões possíveis num nó. Atributo que não separa nada (todos caem no mesmo ramo) fica de fora. */
export function divisoes(rs: Registro[]): Divisao[] {
  const lista: Divisao[] = [
    {
      id: 'reembolso',
      pergunta: 'Recebeu reembolso?',
      ramos: [
        { rotulo: 'Sim', registros: rs.filter((r) => r.reembolso === 'Sim') },
        { rotulo: 'Não', registros: rs.filter((r) => r.reembolso === 'Não') },
      ],
    },
    {
      id: 'civil-2',
      pergunta: 'Estado civil (2 grupos)',
      ramos: [
        { rotulo: 'Casado', registros: rs.filter((r) => r.civil === 'Casado') },
        { rotulo: 'Solteiro/Divorciado', registros: rs.filter((r) => r.civil !== 'Casado') },
      ],
    },
    {
      id: 'civil-3',
      pergunta: 'Estado civil (3 grupos)',
      ramos: (['Solteiro', 'Casado', 'Divorciado'] as const).map((c) => ({ rotulo: c, registros: rs.filter((r) => r.civil === c) })),
    },
  ]
  // renda: um corte no meio de cada par de valores vizinhos (como no slide, "≤ 80 mil")
  const valores = [...new Set(rs.map((r) => r.renda))].sort((a, b) => a - b)
  for (let i = 0; i < valores.length - 1; i++) {
    const corte = (valores[i] + valores[i + 1]) / 2
    const txt = String(corte).replace('.', ',')
    lista.push({
      id: `renda-${corte}`,
      pergunta: `Renda ≤ ${txt} mil?`,
      ramos: [
        { rotulo: `≤ ${txt}`, registros: rs.filter((r) => r.renda <= corte) },
        { rotulo: `> ${txt}`, registros: rs.filter((r) => r.renda > corte) },
      ],
    })
  }
  return lista
    .map((d) => ({ ...d, ramos: d.ramos.filter((r) => r.registros.length) }))
    .filter((d) => d.ramos.length > 1)
}

/** Média dos filhos pesada pelo tamanho: Σ (nᵢ/n)·medida(filho i) */
export const ponderada = (d: Divisao, medida: (c: Contagem) => number) => {
  const n = d.ramos.reduce((s, r) => s + r.registros.length, 0)
  return d.ramos.reduce((s, r) => s + (r.registros.length / n) * medida(contar(r.registros)), 0)
}

export const fmt = (x: number, casas = 3) => (Math.abs(x) < 1e-12 ? '0' : x.toFixed(casas).replace('.', ','))
