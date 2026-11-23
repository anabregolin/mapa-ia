import { num } from './calculadoras'

/**
 * Treinos de cálculo: cada passo pede um número (ou uma escolha) e confere na hora.
 * A primeira versão usa os números da lista/prova (fonte); ao refazer, os números são sorteados.
 * Todas as respostas são calculadas pelo código a partir dos números, nunca digitadas à mão.
 */

const L = String.raw

export interface PassoCalculo {
  /** nome curto do passo, usado no "você costuma errar em…" */
  rotulo: string
  /** pergunta; aceita $latex$ e **negrito** */
  pergunta: string
  /** valor certo; com `opcoes`, é o índice da opção certa */
  resposta: number
  opcoes?: string[]
  /** casas decimais esperadas (padrão 3) */
  casas?: number
  /** a resposta é uma porcentagem (aceita "40", "40%" ou "0,4") */
  porcento?: boolean
  dica?: string
  /** a conta feita, em LaTeX (aparece depois de responder) */
  conta?: string
  explicacao?: string
}

export interface InstanciaCalculo {
  enunciado: string
  passos: PassoCalculo[]
  conclusao?: string
}

export interface Sorteio {
  inteiro: (min: number, max: number) => number
}

interface DefCalculo<P> {
  id: string
  titulo: string
  topicos: string[]
  /** de onde vêm os números originais */
  fonte: string
  original: P
  sortear: (s: Sorteio) => P
  montar: (p: P) => InstanciaCalculo
}

export interface Calculo {
  id: string
  titulo: string
  topicos: string[]
  fonte: string
  /** seed 0 = números do material */
  gerar: (seed: number) => InstanciaCalculo
}

/** gerador pseudoaleatório pequeno e determinístico (mulberry32) */
function criarSorteio(seed: number): Sorteio {
  let a = seed >>> 0
  const prox = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return { inteiro: (min, max) => min + Math.floor(prox() * (max - min + 1)) }
}

function def<P>(d: DefCalculo<P>): Calculo {
  return {
    id: d.id,
    titulo: d.titulo,
    topicos: d.topicos,
    fonte: d.fonte,
    gerar: (seed) => d.montar(seed === 0 ? d.original : d.sortear(criarSorteio(seed))),
  }
}

/** número com vírgula, para LaTeX */
const n = (x: number, casas = 3) => num(x, casas)
const fr = (a: number, b: number) => L`\tfrac{${a}}{${b}}`
const gini = (...c: number[]) => {
  const t = c.reduce((a, b) => a + b, 0)
  return t === 0 ? 0 : 1 - c.reduce((a, x) => a + (x / t) ** 2, 0)
}
const entropia = (...c: number[]) => {
  const t = c.reduce((a, b) => a + b, 0)
  return t === 0 ? 0 : -c.reduce((a, x) => (x === 0 ? a : a + (x / t) * Math.log2(x / t)), 0)
}
const contaGini = (a: number, b: number) => L`1 - \left(\left(${fr(a, a + b)}\right)^2 + \left(${fr(b, a + b)}\right)^2\right) \approx ${n(gini(a, b))}`
const contaEntropia = (a: number, b: number) => {
  const t = a + b
  if (a === 0 || b === 0) return L`\text{um grupo puro} \Rightarrow H = 0`
  return L`-\left(${fr(a, t)} \log_2 ${fr(a, t)} + ${fr(b, t)} \log_2 ${fr(b, t)}\right) \approx ${n(entropia(a, b))}`
}

/** repete o sorteio até a condição valer (evita empates e divisões por zero) */
function ate<P>(s: Sorteio, gerar: (s: Sorteio) => P, ok: (p: P) => boolean): P {
  for (let i = 0; i < 50; i++) {
    const p = gerar(s)
    if (ok(p)) return p
  }
  return gerar(s)
}

// ── U2 · Algoritmo genético ─────────────────────────────────────────
const roleta = def({
  id: 'c.roleta',
  titulo: 'Seleção por roleta',
  topicos: ['u2.ag.selecao'],
  fonte: 'Lista U2 · Q17',
  original: { f: [10, 20, 30, 40] },
  sortear: (s) => ({ f: [0, 0, 0, 0].map(() => s.inteiro(1, 12) * 5) }),
  montar: ({ f }) => {
    const [a, b, c, d] = f
    const soma = a + b + c + d
    const pD = (100 * d) / soma
    const pD2 = (100 * d) / (soma + d)
    return {
      enunciado: `População com fitness A = ${a}, B = ${b}, C = ${c} e D = ${d}. A seleção é por roleta: cada um ganha uma fatia proporcional ao seu fitness.`,
      passos: [
        { rotulo: 'soma dos fitness', pergunta: 'Qual é a soma dos fitness (o tamanho da roleta inteira)?', resposta: soma, casas: 0, conta: L`${a} + ${b} + ${c} + ${d} = ${soma}` },
        {
          rotulo: 'chance de um indivíduo',
          pergunta: 'Qual a chance de **D** ser sorteado numa rodada (em %)?',
          resposta: pD,
          casas: 1,
          porcento: true,
          dica: 'Fatia de D dividida pela roleta inteira.',
          conta: L`p_D = ${fr(d, soma)} \approx ${n(pD, 1)}\%`,
        },
        {
          rotulo: 'chance após novo indivíduo',
          pergunta: `Entra um indivíduo E com fitness ${d} (igual ao de D). Qual a nova chance de D (em %)?`,
          resposta: pD2,
          casas: 1,
          porcento: true,
          dica: 'A fatia de D é a mesma, mas a roleta cresceu.',
          conta: L`p_D = \frac{${d}}{${soma} + ${d}} \approx ${n(pD2, 1)}\%`,
          explicacao: 'O fitness de D não mudou, mas a soma aumentou: a fatia dele encolhe.',
        },
      ],
      conclusao: 'Roleta = fitness ÷ soma. Ela é probabilística: o melhor tem mais chance, não garantia.',
    }
  },
})

// ── U4 · Bayes ──────────────────────────────────────────────────────
const bayesContagem = def({
  id: 'c.bayes-contagem',
  titulo: 'Bayes contando e-mails',
  topicos: ['u4.bayes', 'u4.prob-basica'],
  fonte: 'Lista U4 · Q1',
  original: { s: 3, sp: 2, h: 3, hp: 1 },
  sortear: (r) => {
    const s = r.inteiro(3, 9)
    const h = r.inteiro(3, 9)
    return { s, sp: r.inteiro(1, s), h, hp: r.inteiro(0, h - 1) }
  },
  montar: ({ s, sp, h, hp }) => {
    const t = s + h
    return {
      enunciado: `Há ${t} e-mails: ${s} são spam (${sp} deles têm a palavra "promoção") e ${h} não são spam (${hp} deles têm "promoção"). Chega um e-mail com "promoção".`,
      passos: [
        { rotulo: 'priori', pergunta: 'Priori: quanto vale $P(\\text{spam})$?', resposta: s / t, conta: L`P(\text{spam}) = ${fr(s, t)} \approx ${n(s / t)}` },
        {
          rotulo: 'verossimilhança',
          pergunta: 'Verossimilhança: quanto vale $P(\\text{promo} \\mid \\text{spam})$?',
          resposta: sp / s,
          dica: 'Olhe só dentro dos spams.',
          conta: L`P(\text{promo} \mid \text{spam}) = ${fr(sp, s)} \approx ${n(sp / s)}`,
        },
        {
          rotulo: 'evidência',
          pergunta: 'Evidência: quanto vale $P(\\text{promo})$?',
          resposta: (sp + hp) / t,
          dica: 'Todos os e-mails com "promoção", spam ou não, dividido pelo total.',
          conta: L`P(\text{promo}) = \frac{${sp} + ${hp}}{${t}} \approx ${n((sp + hp) / t)}`,
        },
        {
          rotulo: 'posteriori',
          pergunta: 'Posteriori: quanto vale $P(\\text{spam} \\mid \\text{promo})$?',
          resposta: sp / (sp + hp),
          conta: L`\frac{P(\text{promo} \mid \text{spam}) \cdot P(\text{spam})}{P(\text{promo})} = \frac{${n(sp / s)} \cdot ${n(s / t)}}{${n((sp + hp) / t)}} \approx ${n(sp / (sp + hp))}`,
          explicacao: `Atalho para conferir: dos ${sp + hp} e-mails com "promoção", ${sp} são spam → ${sp}/${sp + hp}. Bayes chega no mesmo número.`,
        },
      ],
    }
  },
})

const bayesProb = def({
  id: 'c.bayes-prob',
  titulo: 'Bayes com probabilidade total',
  topicos: ['u4.bayes'],
  fonte: 'Lista U4 · Q4',
  original: { ps: 0.4, pa: 0.7, pn: 0.1 },
  sortear: (r) => ({ ps: r.inteiro(1, 6) / 10, pa: r.inteiro(5, 9) / 10, pn: r.inteiro(1, 3) / 10 }),
  montar: ({ ps, pa, pn }) => {
    const num1 = pa * ps
    const ev = num1 + pn * (1 - ps)
    return {
      enunciado: `$P(\\text{spam}) = ${n(ps, 2)}$. A palavra "promoção" aparece em ${n(pa * 100, 0)}% dos spams e em ${n(pn * 100, 0)}% dos e-mails normais. Qual a chance de um e-mail com "promoção" ser spam?`,
      passos: [
        {
          rotulo: 'numerador',
          pergunta: 'Numerador: quanto vale $P(\\text{promo} \\mid \\text{spam}) \\cdot P(\\text{spam})$?',
          resposta: num1,
          conta: L`${n(pa, 2)} \cdot ${n(ps, 2)} = ${n(num1)}`,
        },
        {
          rotulo: 'probabilidade total',
          pergunta: '$P(\\text{promo})$ não foi dada. Quanto vale, pela probabilidade total?',
          resposta: ev,
          dica: 'Some os dois jeitos de aparecer "promoção": vindo de spam e vindo de não spam. $P(\\neg\\text{spam}) = 1 - P(\\text{spam})$.',
          conta: L`${n(pa, 2)} \cdot ${n(ps, 2)} + ${n(pn, 2)} \cdot ${n(1 - ps, 2)} = ${n(ev)}`,
          explicacao: 'Esquecer a probabilidade total é o erro mais comum aqui.',
        },
        { rotulo: 'posteriori', pergunta: 'Quanto vale $P(\\text{spam} \\mid \\text{promo})$?', resposta: num1 / ev, conta: L`\frac{${n(num1)}}{${n(ev)}} \approx ${n(num1 / ev)}` },
      ],
      conclusao: `Ver "promoção" muda a chance de spam de ${n(ps * 100, 0)}% para cerca de ${n((100 * num1) / ev, 1)}%.`.replace(/\{,\}/g, ','),
    }
  },
})

// ── U4 · Naive Bayes ────────────────────────────────────────────────
interface ParNaive {
  n1: number
  n2: number
  c1: [number, number, number]
  c2: [number, number, number]
}
/** priori da classe × condicionais; com k > 0 aplica Laplace (+1 na contagem, +k no total) */
const pontuar = (n1: number, n2: number, c: number[], na: number, k = 0) => (na / (n1 + n2)) * c.reduce((a, x) => a * ((x + (k ? 1 : 0)) / (na + k)), 1)

const naiveTempo = def<ParNaive>({
  id: 'c.naive-tempo',
  titulo: 'Naive Bayes: vai chover?',
  topicos: ['u4.naive'],
  fonte: 'Lista U4 (Naive Bayes) · Q1',
  original: { n1: 4, n2: 4, c1: [4, 3, 3], c2: [1, 2, 1] },
  sortear: (r) =>
    ate(
      r,
      (s) => {
        const n1 = s.inteiro(3, 6)
        const n2 = s.inteiro(3, 6)
        return { n1, n2, c1: [s.inteiro(1, n1), s.inteiro(1, n1), s.inteiro(1, n1)], c2: [s.inteiro(1, n2), s.inteiro(1, n2), s.inteiro(1, n2)] } as ParNaive
      },
      (p) => Math.abs(pontuar(p.n1, p.n2, p.c1, p.n1) - pontuar(p.n1, p.n2, p.c2, p.n2)) > 0.002,
    ),
  montar: ({ n1, n2, c1, c2 }) => {
    const t = n1 + n2
    const sc = pontuar(n1, n2, c1, n1)
    const ss = pontuar(n1, n2, c2, n2)
    return {
      enunciado: `Em ${t} dias, ${n1} foram de Chuva e ${n2} de Sol. Nos dias de Chuva: Nuvens = Sim em ${c1[0]}, Umidade Alta em ${c1[1]}, Vento Forte em ${c1[2]}. Nos dias de Sol: ${c2[0]}, ${c2[1]} e ${c2[2]}. Amanhã terá Nuvens, Umidade Alta e Vento Forte.`,
      passos: [
        { rotulo: 'priori', pergunta: 'Priori: quanto vale $P(\\text{Chuva})$?', resposta: n1 / t, conta: L`${fr(n1, t)} \approx ${n(n1 / t)}` },
        {
          rotulo: 'condicional',
          pergunta: 'Quanto vale $P(\\text{Nuvens} \\mid \\text{Chuva})$?',
          resposta: c1[0] / n1,
          dica: 'Conte só dentro dos dias de Chuva.',
          conta: L`${fr(c1[0], n1)} \approx ${n(c1[0] / n1)}`,
        },
        {
          rotulo: 'pontuação da classe 1',
          pergunta: 'Pontuação de **Chuva**: priori × as três condicionais.',
          resposta: sc,
          conta: L`${fr(n1, t)} \cdot ${fr(c1[0], n1)} \cdot ${fr(c1[1], n1)} \cdot ${fr(c1[2], n1)} \approx ${n(sc)}`,
          explicacao: 'O "naive" é isso: multiplicar as condicionais como se os atributos fossem independentes dada a classe.',
        },
        {
          rotulo: 'pontuação da classe 2',
          pergunta: 'Pontuação de **Sol**.',
          resposta: ss,
          conta: L`${fr(n2, t)} \cdot ${fr(c2[0], n2)} \cdot ${fr(c2[1], n2)} \cdot ${fr(c2[2], n2)} \approx ${n(ss)}`,
        },
        {
          rotulo: 'decisão',
          pergunta: 'Qual classe o Naive Bayes escolhe?',
          opcoes: ['Chuva', 'Sol'],
          resposta: sc > ss ? 0 : 1,
          explicacao: 'Escolhe a maior pontuação (argmax). Não precisa dividir pela evidência: ela é igual para as duas classes.',
        },
      ],
    }
  },
})

const laplace = def<ParNaive>({
  id: 'c.laplace',
  titulo: 'Naive Bayes com Laplace',
  topicos: ['u4.naive', 'u4.laplace'],
  fonte: 'Lista U4 (Naive Bayes) · Q2',
  original: { n1: 4, n2: 4, c1: [3, 0, 3], c2: [1, 3, 1] },
  sortear: (r) => {
    const n1 = r.inteiro(3, 6)
    const n2 = r.inteiro(3, 6)
    return { n1, n2, c1: [r.inteiro(1, n1), 0, r.inteiro(1, n1)], c2: [r.inteiro(1, n2), r.inteiro(1, n2), r.inteiro(1, n2)] }
  },
  montar: ({ n1, n2, c1, c2 }) => {
    const t = n1 + n2
    const sd = pontuar(n1, n2, c1, n1)
    const ss = pontuar(n1, n2, c2, n2)
    const ld = pontuar(n1, n2, c1, n1, 2)
    const ls = pontuar(n1, n2, c2, n2, 2)
    const lap = (c: number[], na: number) => c.map((x) => fr(x + 1, na + 2)).join(L` \cdot `)
    const vencedor = Math.abs(ld - ls) < 1e-9 ? 2 : ld > ls ? 0 : 1
    return {
      enunciado: `${t} pacientes: ${n1} Doentes e ${n2} Saudáveis. Entre os Doentes: Febre em ${c1[0]}, Tosse = Não em ${c1[1]}, Dor de cabeça em ${c1[2]}. Entre os Saudáveis: ${c2[0]}, ${c2[1]} e ${c2[2]}. Novo paciente: Febre, sem Tosse, com Dor de cabeça.`,
      passos: [
        {
          rotulo: 'pontuação com zero',
          pergunta: 'Sem suavização: pontuação de **Doente**?',
          resposta: sd,
          casas: 4,
          conta: L`${fr(n1, t)} \cdot ${fr(c1[0], n1)} \cdot ${fr(0, n1)} \cdot ${fr(c1[2], n1)} = 0`,
          explicacao: 'Nenhum doente sem tosse → um fator zero zera tudo, não importa o resto.',
        },
        {
          rotulo: 'pontuação sem suavização',
          pergunta: 'Sem suavização: pontuação de **Saudável**?',
          resposta: ss,
          casas: 4,
          conta: L`${fr(n2, t)} \cdot ${fr(c2[0], n2)} \cdot ${fr(c2[1], n2)} \cdot ${fr(c2[2], n2)} \approx ${n(ss, 4)}`,
        },
        {
          rotulo: 'condicional com Laplace',
          pergunta: 'Com Laplace ($k = 2$, cada atributo é Sim/Não): quanto vale $P(\\text{Tosse = Não} \\mid \\text{Doente})$?',
          resposta: 1 / (n1 + 2),
          casas: 4,
          dica: 'Some 1 na contagem e $k$ no total da classe.',
          conta: L`\frac{0 + 1}{${n1} + 2} = ${fr(1, n1 + 2)} \approx ${n(1 / (n1 + 2), 4)}`,
        },
        {
          rotulo: 'pontuação com Laplace (1)',
          pergunta: 'Com Laplace: pontuação de **Doente**?',
          resposta: ld,
          casas: 4,
          conta: L`${fr(n1, t)} \cdot ${lap(c1, n1)} \approx ${n(ld, 4)}`,
          explicacao: 'A priori não leva Laplace, só as condicionais.',
        },
        {
          rotulo: 'pontuação com Laplace (2)',
          pergunta: 'Com Laplace: pontuação de **Saudável**?',
          resposta: ls,
          casas: 4,
          conta: L`${fr(n2, t)} \cdot ${lap(c2, n2)} \approx ${n(ls, 4)}`,
        },
        {
          rotulo: 'decisão com Laplace',
          pergunta: 'Com Laplace, qual o resultado?',
          opcoes: ['Doente', 'Saudável', 'Empate'],
          resposta: vencedor,
        },
      ],
      conclusao: 'Laplace não serve para mudar o vencedor: serve para nenhuma classe ser eliminada por um único zero.',
    }
  },
})

// ── U5 · Distâncias ─────────────────────────────────────────────────
const minkowski = def({
  id: 'c.minkowski',
  titulo: 'Distâncias: Manhattan, Euclidiana, Minkowski',
  topicos: ['u5.distancias'],
  fonte: 'Lista U5 · Q1',
  original: { x1: 2, y1: 3, x2: 5, y2: 7 },
  sortear: (r) => ate(r, (s) => ({ x1: s.inteiro(0, 9), y1: s.inteiro(0, 9), x2: s.inteiro(0, 9), y2: s.inteiro(0, 9) }), (p) => p.x1 !== p.x2 && p.y1 !== p.y2),
  montar: ({ x1, y1, x2, y2 }) => {
    const dx = Math.abs(x2 - x1)
    const dy = Math.abs(y2 - y1)
    const d2 = Math.hypot(dx, dy)
    const d3 = (dx ** 3 + dy ** 3) ** (1 / 3)
    return {
      enunciado: `Pontos A(${x1}, ${y1}) e B(${x2}, ${y2}). Calcule a distância de Minkowski para valores diferentes de $p$.`,
      passos: [
        {
          rotulo: 'Manhattan',
          pergunta: '$p = 1$ (Manhattan)?',
          resposta: dx + dy,
          casas: 0,
          dica: 'Some as diferenças absolutas de cada coordenada.',
          conta: L`|${x2} - ${x1}| + |${y2} - ${y1}| = ${dx} + ${dy} = ${dx + dy}`,
        },
        { rotulo: 'Euclidiana', pergunta: '$p = 2$ (Euclidiana)?', resposta: d2, conta: L`\sqrt{${dx}^2 + ${dy}^2} = \sqrt{${dx ** 2 + dy ** 2}} \approx ${n(d2)}` },
        {
          rotulo: 'Minkowski p = 3',
          pergunta: '$p = 3$?',
          resposta: d3,
          dica: 'Eleve cada diferença ao cubo, some e tire a raiz cúbica.',
          conta: L`\left(${dx}^3 + ${dy}^3\right)^{1/3} = ${dx ** 3 + dy ** 3}^{1/3} \approx ${n(d3)}`,
        },
        {
          rotulo: 'p → ∞',
          pergunta: '$p \\to \\infty$?',
          resposta: Math.max(dx, dy),
          casas: 0,
          conta: L`\max(${dx}, ${dy}) = ${Math.max(dx, dy)}`,
          explicacao: 'Quanto maior o $p$, mais a maior diferença domina. No limite, sobra só ela.',
        },
      ],
    }
  },
})

const binarios = def({
  id: 'c.smc-jaccard',
  titulo: 'SMC e Jaccard em vetores binários',
  topicos: ['u5.binarios'],
  fonte: 'Lista U5 · Q2',
  original: { a: [1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0], b: [0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1] },
  sortear: (r) =>
    ate(
      r,
      (s) => {
        const t = s.inteiro(8, 12)
        return { a: Array.from({ length: t }, () => s.inteiro(0, 1)), b: Array.from({ length: t }, () => s.inteiro(0, 1)) }
      },
      (p) => p.a.some((x, i) => x === 1 && p.b[i] === 1) && p.a.some((x, i) => x !== p.b[i]),
    ),
  montar: ({ a, b }) => {
    let m11 = 0,
      m00 = 0,
      m10 = 0,
      m01 = 0
    a.forEach((x, i) => {
      if (x && b[i]) m11++
      else if (!x && !b[i]) m00++
      else if (x) m10++
      else m01++
    })
    const t = a.length
    const smc = (m11 + m00) / t
    const jac = m11 / (m11 + m10 + m01)
    return {
      enunciado: `x¹ = [${a.join(' ')}]\nx² = [${b.join(' ')}]`,
      passos: [
        { rotulo: 'contar m11', pergunta: '$m_{11}$: em quantas posições os dois são 1?', resposta: m11, casas: 0, conta: L`m_{11} = ${m11}` },
        { rotulo: 'contar m00', pergunta: '$m_{00}$: em quantas posições os dois são 0?', resposta: m00, casas: 0, conta: L`m_{00} = ${m00}` },
        {
          rotulo: 'contar discordâncias',
          pergunta: '$m_{10} + m_{01}$: em quantas posições eles discordam?',
          resposta: m10 + m01,
          casas: 0,
          conta: L`m_{10} + m_{01} = ${m10} + ${m01} = ${m10 + m01}`,
        },
        { rotulo: 'SMC', pergunta: 'Similaridade **SMC**?', resposta: smc, dica: 'Concordâncias (1-1 e 0-0) sobre o total.', conta: L`\frac{${m11} + ${m00}}{${t}} \approx ${n(smc)}` },
        {
          rotulo: 'Jaccard',
          pergunta: 'Similaridade de **Jaccard**?',
          resposta: jac,
          dica: 'Jaccard ignora o 0-0.',
          conta: L`\frac{${m11}}{${m11} + ${m10} + ${m01}} \approx ${n(jac)}`,
          explicacao: 'Use Jaccard quando o 0 significa "ausência" (ex.: não comprou), porque dois zeros não dizem que os dois são parecidos.',
        },
        { rotulo: 'dissimilaridade', pergunta: 'Dissimilaridade de Jaccard?', resposta: 1 - jac, conta: L`1 - ${n(jac)} = ${n(1 - jac)}` },
      ],
    }
  },
})

// ── U5 · Árvores de decisão ─────────────────────────────────────────
const giniDivisao = def({
  id: 'c.gini-divisao',
  titulo: 'Gini de uma divisão',
  topicos: ['u5.gini'],
  fonte: 'Lista U5 · Q9',
  original: { f1: [8, 2], f2: [2, 4] },
  sortear: (r) => ({ f1: [r.inteiro(1, 10), r.inteiro(0, 6)], f2: [r.inteiro(0, 6), r.inteiro(1, 10)] }),
  montar: ({ f1, f2 }) => {
    const pai = [f1[0] + f2[0], f1[1] + f2[1]]
    const t = pai[0] + pai[1]
    const t1 = f1[0] + f1[1]
    const t2 = f2[0] + f2[1]
    const gp = gini(pai[0], pai[1])
    const g1 = gini(f1[0], f1[1])
    const g2 = gini(f2[0], f2[1])
    const pond = (t1 / t) * g1 + (t2 / t) * g2
    return {
      enunciado: `Nó pai com ${pai[0]} Sim e ${pai[1]} Não. Uma divisão gera o filho 1 com (${f1[0]} Sim, ${f1[1]} Não) e o filho 2 com (${f2[0]} Sim, ${f2[1]} Não).`,
      passos: [
        { rotulo: 'Gini do pai', pergunta: 'Gini do **pai**?', resposta: gp, dica: '$1 - \\sum p_i^2$', conta: contaGini(pai[0], pai[1]) },
        { rotulo: 'Gini de um filho', pergunta: 'Gini do **filho 1**?', resposta: g1, conta: contaGini(f1[0], f1[1]) },
        { rotulo: 'Gini de um filho', pergunta: 'Gini do **filho 2**?', resposta: g2, conta: contaGini(f2[0], f2[1]) },
        {
          rotulo: 'média ponderada',
          pergunta: 'Gini da **divisão** (média ponderada dos filhos)?',
          resposta: pond,
          dica: 'Peso de cada filho = quantos exemplos ele tem ÷ total do pai.',
          conta: L`${fr(t1, t)} \cdot ${n(g1)} + ${fr(t2, t)} \cdot ${n(g2)} \approx ${n(pond)}`,
          explicacao: 'Erro comum: fazer a média simples. O filho maior pesa mais.',
        },
        { rotulo: 'redução', pergunta: 'Quanto o Gini **caiu** em relação ao pai?', resposta: gp - pond, conta: L`${n(gp)} - ${n(pond)} \approx ${n(gp - pond)}` },
      ],
      conclusao: 'Quanto maior a queda, melhor a divisão. A árvore testa todas as divisões e fica com a de menor Gini ponderado.',
    }
  },
})

const giniAB = def({
  id: 'c.gini-ab',
  titulo: 'Gini: qual divisão é melhor?',
  topicos: ['u5.gini'],
  fonte: 'P2 · Q6',
  original: { a1: [9, 2], b1: [8, 1], pai: [13, 8] },
  sortear: (r) =>
    ate(
      r,
      (s) => {
        const pai = [s.inteiro(8, 15), s.inteiro(6, 12)]
        return { pai, a1: [s.inteiro(1, pai[0] - 1), s.inteiro(0, pai[1] - 1)], b1: [s.inteiro(1, pai[0] - 1), s.inteiro(0, pai[1] - 1)] }
      },
      ({ pai, a1, b1 }) => {
        const p = (f: number[]) => {
          const g = [pai[0] - f[0], pai[1] - f[1]]
          return ((f[0] + f[1]) * gini(f[0], f[1]) + (g[0] + g[1]) * gini(g[0], g[1])) / (pai[0] + pai[1])
        }
        return Math.abs(p(a1) - p(b1)) > 0.01
      },
    ),
  montar: ({ pai, a1, b1 }) => {
    const t = pai[0] + pai[1]
    const a2 = [pai[0] - a1[0], pai[1] - a1[1]]
    const b2 = [pai[0] - b1[0], pai[1] - b1[1]]
    const pond = (f: number[], g: number[]) => ((f[0] + f[1]) / t) * gini(f[0], f[1]) + ((g[0] + g[1]) / t) * gini(g[0], g[1])
    const contaPond = (f: number[], g: number[]) =>
      L`${fr(f[0] + f[1], t)} \cdot ${n(gini(f[0], f[1]))} + ${fr(g[0] + g[1], t)} \cdot ${n(gini(g[0], g[1]))} \approx ${n(pond(f, g))}`
    const pa = pond(a1, a2)
    const pb = pond(b1, b2)
    return {
      enunciado: `Nó pai com ${pai[0]} exemplos da classe 1 e ${pai[1]} da classe 2. Divisão A: filhos (${a1.join(', ')}) e (${a2.join(', ')}). Divisão B: filhos (${b1.join(', ')}) e (${b2.join(', ')}).`,
      passos: [
        { rotulo: 'Gini do pai', pergunta: 'Gini do **pai**?', resposta: gini(pai[0], pai[1]), casas: 3, conta: contaGini(pai[0], pai[1]) },
        { rotulo: 'média ponderada', pergunta: 'Gini ponderado da **divisão A**?', resposta: pa, dica: 'Gini de cada filho, depois média ponderada pelo tamanho.', conta: contaPond(a1, a2) },
        { rotulo: 'média ponderada', pergunta: 'Gini ponderado da **divisão B**?', resposta: pb, conta: contaPond(b1, b2) },
        { rotulo: 'escolher a divisão', pergunta: 'Qual divisão é melhor?', opcoes: ['A', 'B'], resposta: pa < pb ? 0 : 1, explicacao: 'Melhor = menor Gini ponderado = maior queda em relação ao pai.' },
      ],
    }
  },
})

const entropiaGanho = def({
  id: 'c.entropia-ganho',
  titulo: 'Entropia e ganho de informação',
  topicos: ['u5.entropia'],
  fonte: 'Lista U5 · Q10–Q11',
  original: { f1: [6, 2], f2: [2, 6] },
  sortear: (r) => ({ f1: [r.inteiro(1, 9), r.inteiro(0, 5)], f2: [r.inteiro(0, 5), r.inteiro(1, 9)] }),
  montar: ({ f1, f2 }) => {
    const pai = [f1[0] + f2[0], f1[1] + f2[1]]
    const t = pai[0] + pai[1]
    const t1 = f1[0] + f1[1]
    const t2 = f2[0] + f2[1]
    const hp = entropia(pai[0], pai[1])
    const h1 = entropia(f1[0], f1[1])
    const h2 = entropia(f2[0], f2[1])
    const ganho = hp - ((t1 / t) * h1 + (t2 / t) * h2)
    return {
      enunciado: `Nó pai com ${pai[0]} positivos e ${pai[1]} negativos. A divisão gera (${f1[0]}+, ${f1[1]}−) e (${f2[0]}+, ${f2[1]}−).`,
      passos: [
        { rotulo: 'entropia do pai', pergunta: 'Entropia do **pai**?', resposta: hp, dica: '$H = -\\sum p_i \\log_2 p_i$. Meio a meio dá 1.', conta: contaEntropia(pai[0], pai[1]) },
        { rotulo: 'entropia de um filho', pergunta: 'Entropia do **filho 1**?', resposta: h1, conta: contaEntropia(f1[0], f1[1]) },
        { rotulo: 'entropia de um filho', pergunta: 'Entropia do **filho 2**?', resposta: h2, conta: contaEntropia(f2[0], f2[1]) },
        {
          rotulo: 'ganho de informação',
          pergunta: '**Ganho** de informação da divisão?',
          resposta: ganho,
          dica: 'Entropia do pai menos a média ponderada dos filhos.',
          conta: L`${n(hp)} - \left(${fr(t1, t)} \cdot ${n(h1)} + ${fr(t2, t)} \cdot ${n(h2)}\right) \approx ${n(ganho)}`,
        },
      ],
      conclusao: 'Entropia mede bagunça (0 = puro, 1 = meio a meio com 2 classes). Ganho = quanto a divisão arrumou.',
    }
  },
})

// ── U5 · Métricas ───────────────────────────────────────────────────
const matriz = def({
  id: 'c.matriz',
  titulo: 'Métricas da matriz de confusão',
  topicos: ['u5.metricas'],
  fonte: 'Lista U5 · Q17',
  original: { vp: 80, fn: 20, fp: 30, vn: 170 },
  sortear: (r) => ({ vp: r.inteiro(20, 90), fn: r.inteiro(5, 40), fp: r.inteiro(5, 40), vn: r.inteiro(50, 200) }),
  montar: ({ vp, fn, fp, vn }) => {
    const t = vp + fn + fp + vn
    const acc = (vp + vn) / t
    const sens = vp / (vp + fn)
    const esp = vn / (vn + fp)
    const prec = vp / (vp + fp)
    const f1 = (2 * prec * sens) / (prec + sens)
    return {
      enunciado: `Dos positivos reais, ${vp} foram previstos positivos e ${fn} negativos. Dos negativos reais, ${fp} foram previstos positivos e ${vn} negativos.`,
      passos: [
        { rotulo: 'acurácia', pergunta: '**Acurácia**?', resposta: acc, dica: 'Acertos (VP + VN) sobre o total.', conta: L`\frac{${vp} + ${vn}}{${t}} \approx ${n(acc)}` },
        { rotulo: 'sensibilidade', pergunta: '**Sensibilidade** (recall)?', resposta: sens, dica: 'Dos positivos reais, quantos achei?', conta: L`\frac{VP}{VP + FN} = \frac{${vp}}{${vp + fn}} \approx ${n(sens)}` },
        { rotulo: 'especificidade', pergunta: '**Especificidade**?', resposta: esp, dica: 'Dos negativos reais, quantos acertei?', conta: L`\frac{VN}{VN + FP} = \frac{${vn}}{${vn + fp}} \approx ${n(esp)}` },
        {
          rotulo: 'precisão',
          pergunta: '**Precisão**?',
          resposta: prec,
          dica: 'Dos que eu disse que eram positivos, quantos eram mesmo?',
          conta: L`\frac{VP}{VP + FP} = \frac{${vp}}{${vp + fp}} \approx ${n(prec)}`,
          explicacao: 'Sensibilidade olha a linha do real positivo; precisão olha a coluna do previsto positivo.',
        },
        { rotulo: 'F1', pergunta: '**F1**?', resposta: f1, dica: 'Média harmônica de precisão e sensibilidade.', conta: L`2 \cdot \frac{${n(prec)} \cdot ${n(sens)}}{${n(prec)} + ${n(sens)}} \approx ${n(f1)}` },
      ],
    }
  },
})

export const CALCULOS: Calculo[] = [roleta, bayesContagem, bayesProb, naiveTempo, laplace, minkowski, binarios, giniDivisao, giniAB, entropiaGanho, matriz]

export const calculoPorId = new Map(CALCULOS.map((c) => [c.id, c]))
export const calculosDoTopico = (id: string) => CALCULOS.filter((c) => c.topicos.includes(id))
