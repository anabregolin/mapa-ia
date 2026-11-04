import type { Calculadora } from './tipos'

const L = String.raw

/** Número em formato brasileiro, pronto para LaTeX (vírgula sem espaço extra). */
export function num(n: number, casas = 3): string {
  if (!Number.isFinite(n)) return n > 0 ? L`\infty` : '-\\infty'
  if (Math.abs(n) >= 1e7 || (Math.abs(n) > 0 && Math.abs(n) < 1e-4)) {
    const [m, e] = n.toExponential(2).split('e')
    return L`${m.replace('.', '{,}')} \times 10^{${Number(e)}}`
  }
  const arred = Number(n.toFixed(casas))
  const [int, dec] = String(arred).split('.')
  const milhar = int.replace(/\B(?=(\d{3})+(?!\d))/g, '\\,')
  return dec ? `${milhar}{,}${dec}` : milhar
}

const fat = (n: number) => {
  let r = 1
  for (let i = 2; i <= n; i++) r *= i
  return r
}

const gini = (...c: number[]) => {
  const t = c.reduce((a, b) => a + b, 0)
  return t === 0 ? 0 : 1 - c.reduce((a, x) => a + (x / t) ** 2, 0)
}
const entropia = (...c: number[]) => {
  const t = c.reduce((a, b) => a + b, 0)
  return t === 0 ? 0 : -c.reduce((a, x) => (x === 0 ? a : a + (x / t) * Math.log2(x / t)), 0)
}
const dist = (v: Record<string, number>, p: number) => {
  const dx = Math.abs(v.x1 - v.x2)
  const dy = Math.abs(v.y1 - v.y2)
  return { dx, dy, d: p === Infinity ? Math.max(dx, dy) : (dx ** p + dy ** p) ** (1 / p) }
}
const pontos = [
  { id: 'x1', rotulo: 'A.x', valor: 1 },
  { id: 'y1', rotulo: 'A.y', valor: 2 },
  { id: 'x2', rotulo: 'B.x', valor: 4 },
  { id: 'y2', rotulo: 'B.y', valor: 6 },
]
const prob = (id: string, rotulo: string, valor: number) => ({ id, rotulo, valor, min: 0, max: 1, passo: 0.01 })
const cont = (id: string, rotulo: string, valor: number) => ({ id, rotulo, valor, min: 0, passo: 1 })

export const CALCULADORAS: Record<string, Calculadora> = {
  'f.estados': {
    entradas: [{ id: 'n', rotulo: 'n (variáveis)', valor: 3, min: 0, max: 60, passo: 1 }],
    calcular: ({ n }) => ({ conta: L`2^{${n}}`, resultado: num(2 ** n) }),
  },
  'f.complex': {
    entradas: [
      { id: 'b', rotulo: 'b', valor: 35, min: 1, passo: 1 },
      { id: 'm', rotulo: 'm', valor: 40, min: 1, passo: 1 },
    ],
    calcular: ({ b, m }) => ({
      conta: L`b^m = ${b}^{${m}} \qquad b^{m/2} = ${b}^{${num(m / 2, 1)}}`,
      resultado: L`${num(b ** m)} \;\text{vs.}\; ${num(b ** (m / 2))}`,
      nota: 'minimax × alfa-beta no melhor caso',
    }),
  },
  'f.tsp': {
    entradas: [{ id: 'n', rotulo: 'n (cidades)', valor: 10, min: 3, max: 25, passo: 1 }],
    calcular: ({ n }) => ({ conta: L`\frac{(${n}-1)!}{2} = \frac{${num(fat(n - 1))}}{2}`, resultado: L`${num(fat(n - 1) / 2)} \text{ rotas}` }),
  },
  'f.consistente': {
    entradas: [
      { id: 'h', rotulo: 'h(n)', valor: 5, min: 0 },
      { id: 'c', rotulo: "c(n,a,n')", valor: 2, min: 0 },
      { id: 'h2', rotulo: "h(n')", valor: 4, min: 0 },
    ],
    calcular: ({ h, c, h2 }) => ({
      conta: L`${num(h)} \le ${num(c)} + ${num(h2)} = ${num(c + h2)}`,
      resultado: h <= c + h2 ? L`\text{consistente } \checkmark` : L`\text{não consistente } \times`,
    }),
  },
  'f.astar': {
    entradas: [
      { id: 'g', rotulo: 'g(n)', valor: 220, min: 0 },
      { id: 'h', rotulo: 'h(n)', valor: 193, min: 0 },
    ],
    calcular: ({ g, h }) => ({ conta: L`f = ${num(g)} + ${num(h)}`, resultado: L`f = ${num(g + h)}` }),
  },
  'f.wastar': {
    entradas: [
      { id: 'g', rotulo: 'g(n)', valor: 220, min: 0 },
      { id: 'h', rotulo: 'h(n)', valor: 193, min: 0 },
      { id: 'w', rotulo: 'w', valor: 2, min: 0, passo: 0.1 },
    ],
    calcular: ({ g, h, w }) => ({
      conta: L`f = ${num(g)} + ${num(w)} \cdot ${num(h)}`,
      resultado: L`f = ${num(g + w * h)}`,
      nota: w === 0 ? 'w = 0: custo uniforme' : w === 1 ? 'w = 1: A*' : w > 1 ? 'w > 1: mais guloso' : 'w < 1: mais perto do custo uniforme',
    }),
  },
  'f.sa': {
    entradas: [
      { id: 'dE', rotulo: 'ΔE', valor: -10, passo: 1 },
      { id: 'T', rotulo: 'T', valor: 10, min: 0.01, passo: 1 },
    ],
    calcular: ({ dE, T }) =>
      dE > 0
        ? { conta: L`\Delta E = ${num(dE)} > 0`, resultado: L`\text{aceita sempre}`, nota: 'vizinho melhor' }
        : { conta: L`P = e^{${num(dE)} / ${num(T)}} = e^{${num(dE / T)}}`, resultado: L`P \approx ${num(Math.exp(dE / T), 4)}`, nota: `aceita o vizinho pior em ${num(Math.exp(dE / T) * 100, 1).replace('{,}', ',')}% das vezes` },
  },
  'f.roleta': {
    entradas: [cont('a', 'fitness A', 10), cont('b', 'fitness B', 20), cont('c', 'fitness C', 30), cont('d', 'fitness D', 40)],
    calcular: ({ a, b, c, d }) => {
      const t = a + b + c + d || 1
      const pc = (x: number) => num((x / t) * 100, 1) + L`\%`
      return { conta: L`\Sigma = ${num(a + b + c + d)}`, resultado: L`A\;${pc(a)},\; B\;${pc(b)},\; C\;${pc(c)},\; D\;${pc(d)}` }
    },
  },
  'f.fitness-eq': {
    entradas: [cont('x', 'x', 4), cont('y', 'y', 7), cont('w', 'w', 10), cont('z', 'z', 5)],
    calcular: ({ x, y, w, z }) => {
      const r = 5 * x + y ** 2 + w + z ** 3
      const erro = Math.abs(185 - r)
      return {
        conta: L`5\cdot${x} + ${y}^2 + ${w} + ${z}^3 = ${r}, \quad \text{erro} = |185 - ${r}| = ${erro}`,
        resultado: L`\text{fitness} = \frac{1}{1 + ${erro}} = ${num(1 / (1 + erro))}`,
        nota: erro === 0 ? 'solução exata!' : undefined,
      }
    },
  },
  'f.alfabeta': {
    entradas: [
      { id: 'a', rotulo: 'α', valor: 5 },
      { id: 'b', rotulo: 'β', valor: 3 },
    ],
    calcular: ({ a, b }) => ({ conta: L`\alpha = ${num(a)},\; \beta = ${num(b)}`, resultado: a >= b ? L`\alpha \ge \beta \Rightarrow \text{poda}` : L`\alpha < \beta \Rightarrow \text{continua}` }),
  },
  'f.prob': {
    entradas: [prob('p', 'P(X)', 1 / 6)],
    calcular: ({ p }) => ({ conta: L`1 - ${num(p)}`, resultado: L`P(\neg X) = ${num(1 - p)}` }),
  },
  'f.conjunta': {
    entradas: [prob('a', 'P(A)', 1 / 6), prob('b', 'P(B)', 1 / 6)],
    calcular: ({ a, b }) => ({ conta: L`${num(a)} \cdot ${num(b)}`, resultado: L`P(A \cap B) = ${num(a * b, 4)}` }),
  },
  'f.produto': {
    entradas: [prob('ba', 'P(B|A)', 1 / 13), prob('a', 'P(A)', 0.25)],
    calcular: ({ ba, a }) => ({ conta: L`${num(ba)} \cdot ${num(a)}`, resultado: L`P(A \cap B) = ${num(ba * a, 4)}` }),
  },
  'f.bayes': {
    entradas: [prob('eh', 'P(E|H)', 0.7), prob('h', 'P(H)', 0.4), prob('enh', 'P(E|¬H)', 0.1)],
    calcular: ({ eh, h, enh }) => {
      const pe = eh * h + enh * (1 - h)
      return {
        conta: L`P(E) = ${num(eh)}\cdot${num(h)} + ${num(enh)}\cdot${num(1 - h)} = ${num(pe, 4)}`,
        resultado: L`P(H \mid E) = \frac{${num(eh * h, 4)}}{${num(pe, 4)}} = ${num(pe ? (eh * h) / pe : 0, 4)}`,
        nota: 'P(E) pela probabilidade total. Valores iniciais: lista U4, Q4',
      }
    },
  },
  'f.laplace': {
    entradas: [cont('x', 'contagem(xᵢ, c)', 0), cont('c', 'contagem(c)', 5), { id: 'k', rotulo: 'k (valores)', valor: 9, min: 1, passo: 1 }],
    calcular: ({ x, c, k }) => ({
      conta: L`\frac{${x} + 1}{${c} + ${k}} \quad \text{(sem Laplace: } \tfrac{${x}}{${c}}\text{)}`,
      resultado: L`${num((x + 1) / (c + k), 4)}`,
    }),
  },
  'f.euclid': {
    entradas: pontos,
    calcular: (v) => {
      const { dx, dy, d } = dist(v, 2)
      return { conta: L`\sqrt{${dx}^2 + ${dy}^2} = \sqrt{${dx ** 2 + dy ** 2}}`, resultado: L`d = ${num(d)}` }
    },
  },
  'f.manhattan': {
    entradas: pontos,
    calcular: (v) => {
      const { dx, dy, d } = dist(v, 1)
      return { conta: L`${dx} + ${dy}`, resultado: L`d = ${num(d)}` }
    },
  },
  'f.minkowski': {
    entradas: [...pontos, { id: 'p', rotulo: 'p', valor: 3, min: 1, max: 20, passo: 1 }],
    calcular: (v) => {
      const { dx, dy, d } = dist(v, v.p)
      const inf = dist(v, Infinity).d
      return {
        conta: L`\left(${dx}^{${v.p}} + ${dy}^{${v.p}}\right)^{1/${v.p}}`,
        resultado: L`d = ${num(d)}`,
        nota: `com p → ∞ daria ${inf} (a maior diferença)`,
      }
    },
  },
  'f.smc': {
    entradas: [cont('m11', 'm₁₁', 0), cont('m00', 'm₀₀', 7), cont('m10', 'm₁₀', 1), cont('m01', 'm₀₁', 2)],
    calcular: ({ m11, m00, m10, m01 }) => {
      const t = m11 + m00 + m10 + m01 || 1
      return { conta: L`\frac{${m11} + ${m00}}{${t}}`, resultado: L`SMC = ${num((m11 + m00) / t)}` }
    },
  },
  'f.jaccard': {
    entradas: [cont('m11', 'm₁₁', 0), cont('m10', 'm₁₀', 1), cont('m01', 'm₀₁', 2)],
    calcular: ({ m11, m10, m01 }) => {
      const t = m11 + m10 + m01
      return { conta: L`\frac{${m11}}{${m01} + ${m10} + ${m11}}`, resultado: L`J = ${num(t ? m11 / t : 0)}` }
    },
  },
  'f.gini': {
    entradas: [cont('a', 'classe 1', 3), cont('b', 'classe 2', 3)],
    calcular: ({ a, b }) => {
      const t = a + b || 1
      return { conta: L`1 - \left(\left(\tfrac{${a}}{${t}}\right)^2 + \left(\tfrac{${b}}{${t}}\right)^2\right)`, resultado: L`\text{Gini} = ${num(gini(a, b))}` }
    },
  },
  'f.gini-split': {
    entradas: [cont('a1', 'N1 classe 1', 5), cont('a2', 'N1 classe 2', 2), cont('b1', 'N2 classe 1', 1), cont('b2', 'N2 classe 2', 4)],
    calcular: ({ a1, a2, b1, b2 }) => {
      const n1 = a1 + a2
      const n2 = b1 + b2
      const n = n1 + n2 || 1
      const split = (n1 / n) * gini(a1, a2) + (n2 / n) * gini(b1, b2)
      const pai = gini(a1 + b1, a2 + b2)
      return {
        conta: L`\tfrac{${n1}}{${n}} \cdot ${num(gini(a1, a2))} + \tfrac{${n2}}{${n}} \cdot ${num(gini(b1, b2))}`,
        resultado: L`\text{Gini}_{split} = ${num(split)} \quad (\text{pai} = ${num(pai)})`,
        nota: split < pai ? 'a divisão reduz a impureza' : 'a divisão não melhora',
      }
    },
  },
  'f.entropia': {
    entradas: [cont('a', 'classe 1', 1), cont('b', 'classe 2', 3)],
    calcular: ({ a, b }) => {
      const t = a + b || 1
      return { conta: L`-\left(\tfrac{${a}}{${t}}\log_2\tfrac{${a}}{${t}} + \tfrac{${b}}{${t}}\log_2\tfrac{${b}}{${t}}\right)`, resultado: L`E = ${num(entropia(a, b))}` }
    },
  },
  'f.ganho': {
    entradas: [cont('a1', 'A classe 1', 6), cont('a2', 'A classe 2', 2), cont('b1', 'B classe 1', 2), cont('b2', 'B classe 2', 6)],
    calcular: ({ a1, a2, b1, b2 }) => {
      const n1 = a1 + a2
      const n2 = b1 + b2
      const n = n1 + n2 || 1
      const pai = entropia(a1 + b1, a2 + b2)
      const filhos = (n1 / n) * entropia(a1, a2) + (n2 / n) * entropia(b1, b2)
      return {
        conta: L`${num(pai)} - \left(\tfrac{${n1}}{${n}} \cdot ${num(entropia(a1, a2))} + \tfrac{${n2}}{${n}} \cdot ${num(entropia(b1, b2))}\right)`,
        resultado: L`\text{Ganho} = ${num(pai - filhos)}`,
        nota: 'valores iniciais: lista U5, Q11',
      }
    },
  },
  'f.regressao': {
    entradas: [
      { id: 'b0', rotulo: 'β₀', valor: 2 },
      { id: 'b1', rotulo: 'β₁', valor: 3 },
      { id: 'x', rotulo: 'x', valor: 4 },
    ],
    calcular: ({ b0, b1, x }) => ({ conta: L`${num(b0)} + ${num(b1)} \cdot ${num(x)}`, resultado: L`f(x) = ${num(b0 + b1 * x)}` }),
  },
  'f.metricas': {
    entradas: [cont('vp', 'VP', 80), cont('fn', 'FN', 20), cont('fp', 'FP', 30), cont('vn', 'VN', 170)],
    calcular: ({ vp, fn, fp, vn }) => {
      const d = (a: number, b: number) => (b ? a / b : 0)
      const sens = d(vp, vp + fn)
      const prec = d(vp, vp + fp)
      const f1 = d(2 * prec * sens, prec + sens)
      return {
        conta: L`\text{acc} = ${num(d(vp + vn, vp + fn + fp + vn))},\; \text{sens} = ${num(sens)},\; \text{esp} = ${num(d(vn, vn + fp))}`,
        resultado: L`\text{prec} = ${num(prec)},\; F_1 = ${num(f1)}`,
      }
    },
  },
}
