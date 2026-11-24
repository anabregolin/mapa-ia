// Calculadora científica: lê a expressão por conta própria (sem eval) e guarda o histórico neste aparelho.
// Fica fora do 'mapa-ia': não vai para a cópia nem para a nuvem.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Tok = { t: 'n'; v: number } | { t: 'id'; v: string } | { t: 'op'; v: string }

const OPS: Record<string, string> = { '+': '+', '-': '-', '−': '-', '–': '-', '*': '*', '×': '*', '·': '*', '/': '/', '÷': '/', '^': '^', '(': '(', ')': ')', '!': '!', '%': '%' }

function tokens(s: string): Tok[] {
  const out: Tok[] = []
  let i = 0
  while (i < s.length) {
    const c = s[i]
    if (/\s/.test(c)) {
      i++
    } else if (/[0-9.,]/.test(c)) {
      let j = i
      while (j < s.length && /[0-9.,]/.test(s[j])) j++
      const txt = s.slice(i, j).replace(/,/g, '.')
      if ((txt.match(/\./g) ?? []).length > 1 || txt === '.') throw new Error(`não entendi o número "${s.slice(i, j)}"`)
      out.push({ t: 'n', v: Number(txt) })
      i = j
    } else if (c === 'π' || c === '√') {
      out.push({ t: 'id', v: c })
      i++
    } else if (/[a-zA-Z]/.test(c)) {
      let j = i
      while (j < s.length && /[a-zA-Z]/.test(s[j])) j++
      let nome = s.slice(i, j).toLowerCase()
      // log₂ ou log2 colado
      if (nome === 'log' && (s[j] === '₂' || (s[j] === '2' && !/[0-9.,]/.test(s[j + 1] ?? '')))) {
        nome = 'log2'
        j++
      }
      out.push({ t: 'id', v: nome })
      i = j
    } else if (OPS[c]) {
      out.push({ t: 'op', v: OPS[c] })
      i++
    } else {
      throw new Error(`não conheço "${c}"`)
    }
  }
  return out
}

const fatorial = (n: number) => {
  if (n < 0 || n > 170 || !Number.isInteger(n)) throw new Error('fatorial só de inteiro de 0 a 170')
  let r = 1
  for (let k = 2; k <= n; k++) r *= k
  return r
}

/** Calcula a expressão. Lança Error com uma frase curta quando não dá. */
export function calcular(expr: string, opcoes: { ans: number; graus: boolean }): number {
  const toks = tokens(expr)
  if (!toks.length) throw new Error('vazio')
  const ang = (x: number) => (opcoes.graus ? (x * Math.PI) / 180 : x)
  const FUNCOES: Record<string, (x: number) => number> = {
    '√': Math.sqrt,
    sqrt: Math.sqrt,
    raiz: Math.sqrt,
    ln: Math.log,
    log: Math.log10,
    log2: Math.log2,
    exp: Math.exp,
    abs: Math.abs,
    sin: (x) => Math.sin(ang(x)),
    sen: (x) => Math.sin(ang(x)),
    cos: (x) => Math.cos(ang(x)),
    tan: (x) => Math.tan(ang(x)),
    tg: (x) => Math.tan(ang(x)),
  }
  const CONSTANTES: Record<string, number> = { 'π': Math.PI, pi: Math.PI, e: Math.E, ans: opcoes.ans }

  let i = 0
  const eh = (v: string) => toks[i]?.t === 'op' && toks[i].v === v
  const comecaFator = () => {
    const t = toks[i]
    return !!t && (t.t === 'n' || t.t === 'id' || (t.t === 'op' && t.v === '('))
  }

  const expressao = (): number => {
    let v = termo()
    while (eh('+') || eh('-')) {
      const o = (toks[i++] as { v: string }).v
      const r = termo()
      v = o === '+' ? v + r : v - r
    }
    return v
  }
  const termo = (): number => {
    let v = unario()
    for (;;) {
      if (eh('*') || eh('/')) {
        const o = (toks[i++] as { v: string }).v
        const r = unario()
        v = o === '*' ? v * r : v / r
      } else if (comecaFator()) {
        v *= unario() // multiplicação implícita: 2π, 3(4), (1)(2)
      } else return v
    }
  }
  const unario = (): number => {
    if (eh('-')) return i++, -unario()
    if (eh('+')) return i++, unario()
    return potencia()
  }
  const potencia = (): number => {
    const b = posfixo()
    if (eh('^')) {
      i++
      return b ** unario()
    }
    return b
  }
  const posfixo = (): number => {
    let v = primario()
    for (;;) {
      if (eh('!')) i++, (v = fatorial(v))
      else if (eh('%')) i++, (v = v / 100)
      else return v
    }
  }
  const primario = (): number => {
    const t = toks[i]
    if (!t) throw new Error('falta um número no fim')
    if (t.t === 'n') return i++, t.v
    if (t.t === 'op' && t.v === '(') {
      i++
      const v = expressao()
      if (eh(')')) i++
      else if (i < toks.length) throw new Error('falta fechar um parêntese')
      return v
    }
    if (t.t === 'id') {
      i++
      if (t.v in CONSTANTES) return CONSTANTES[t.v]
      const f = FUNCOES[t.v]
      if (f) return f(eh('-') ? unario() : posfixo())
      throw new Error(`não conheço "${t.v}"`)
    }
    throw new Error(`"${t.v}" fora do lugar`)
  }

  const v = expressao()
  if (i < toks.length) throw new Error(`"${(toks[i] as { v: string | number }).v}" fora do lugar`)
  if (!Number.isFinite(v)) throw new Error(Number.isNaN(v) ? 'não existe (raiz ou log de negativo?)' : 'infinito (divisão por zero?)')
  return v
}

/** Número com vírgula, sem separador de milhar (para dar para colar de volta na conta). */
export function formatar(x: number) {
  if (Object.is(x, -0)) x = 0
  const a = Math.abs(x)
  if (a !== 0 && (a >= 1e12 || a < 1e-9)) return x.toExponential(6).replace('.', ',')
  return Number(x.toPrecision(12)).toLocaleString('pt-BR', { maximumFractionDigits: 10, useGrouping: false })
}

export interface Conta {
  expr: string
  res: string
}

interface EstadoCalculadora {
  aberta: boolean
  comprimida: boolean
  expr: string
  hist: Conta[]
  ans: number
  graus: boolean
  abrir: () => void
  fechar: () => void
  setComprimida: (c: boolean) => void
  setExpr: (e: string) => void
  guardar: (c: Conta, valor: number) => void
  limparHist: () => void
  setGraus: (g: boolean) => void
}

export const useCalculadora = create<EstadoCalculadora>()(
  persist(
    (set) => ({
      aberta: false,
      comprimida: false,
      expr: '',
      hist: [],
      ans: 0,
      graus: false,
      abrir: () => set({ aberta: true, comprimida: false }),
      fechar: () => set({ aberta: false }),
      setComprimida: (comprimida) => set({ comprimida }),
      setExpr: (expr) => set({ expr }),
      guardar: (c, ans) => set((s) => ({ hist: [...s.hist, c].slice(-20), ans })),
      limparHist: () => set({ hist: [] }),
      setGraus: (graus) => set({ graus }),
    }),
    { name: 'calculadora-mapa' },
  ),
)
