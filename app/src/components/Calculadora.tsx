import { useLayoutEffect, useRef, useState } from 'react'
import { calcular, formatar, useCalculadora } from '../lib/calculadora'
import { useFlutuante } from '../lib/flutuante'

type Tecla = { k: string; rotulo?: string; tipo?: 'num' | 'op' | 'fn' | 'acao' | 'igual'; titulo?: string }

const T = (k: string, tipo: Tecla['tipo'], rotulo?: string, titulo?: string): Tecla => ({ k, tipo, rotulo, titulo })

const TECLAS: Tecla[] = [
  T('sin', 'fn'), T('cos', 'fn'), T('tan', 'fn'), T('π', 'fn'), T('e', 'fn', undefined, 'número de Euler (2,718…)'),
  T('ln', 'fn'), T('log', 'fn', undefined, 'log na base 10'), T('log₂', 'fn'), T('x²', 'fn'), T('xʸ', 'fn', undefined, 'potência (^)'),
  T('√', 'fn'), T('(', 'fn'), T(')', 'fn'), T('1/x', 'fn', undefined, '1 dividido pela conta'), T('!', 'fn', 'n!', 'fatorial'),
  T('7', 'num'), T('8', 'num'), T('9', 'num'), T('÷', 'op'), T('⌫', 'acao', undefined, 'apagar'),
  T('4', 'num'), T('5', 'num'), T('6', 'num'), T('×', 'op'), T('C', 'acao', undefined, 'limpar'),
  T('1', 'num'), T('2', 'num'), T('3', 'num'), T('−', 'op'), T('Ans', 'fn', undefined, 'resultado anterior'),
  T('0', 'num'), T(',', 'num'), T('%', 'op'), T('+', 'op'), T('=', 'igual'),
]

const INSERE: Record<string, string> = { sin: 'sin(', cos: 'cos(', tan: 'tan(', ln: 'ln(', log: 'log(', 'log₂': 'log₂(', '√': '√(', 'x²': '^2', 'xʸ': '^', '!': '!' }

/** Botão que abre (ou fecha) a calculadora flutuante. */
export function BotaoCalculadora() {
  const aberta = useCalculadora((s) => s.aberta)
  const comprimida = useCalculadora((s) => s.comprimida)
  const abrir = useCalculadora((s) => s.abrir)
  const fechar = useCalculadora((s) => s.fechar)
  const ativa = aberta && !comprimida
  return (
    <button
      className="botao-suave"
      onClick={() => (ativa ? fechar() : abrir())}
      aria-pressed={ativa}
      title={ativa ? 'fechar a calculadora' : 'abrir a calculadora (dá para arrastar e comprimir)'}
      style={ativa ? { background: 'var(--foco-claro)', color: 'var(--foco)' } : undefined}
    >
      🧮 <span className="hidden sm:inline">calculadora</span>
    </button>
  )
}

/** Calculadora científica flutuante: arrasta pelo topo, comprime num botão, fecha no ×. Aparece em todas as telas até você fechar.
 *  semBotao: a tela já tem o 🧮 no rodapé, então comprimida ela some em vez de virar um botão flutuante. */
export function Calculadora({ semBotao = false }: { semBotao?: boolean }) {
  const c = useCalculadora()
  const f = useFlutuante('posicao-calculadora', { lado: 'dir', x: 20, borda: 'baixo', y: 88 })
  const campo = useRef<HTMLInputElement>(null)
  /** onde o cursor deve ficar depois de uma tecla (só quando o campo está em foco) */
  const cursor = useRef<number | null>(null)
  /** apertou = numa conta incompleta: mostra o porquê (sem isso, conta pela metade só mostra "…") */
  const [insistiuEm, setInsistiuEm] = useState<string | null>(null)

  useLayoutEffect(() => {
    const el = campo.current
    if (el && cursor.current !== null && document.activeElement === el) el.setSelectionRange(cursor.current, cursor.current)
    cursor.current = null
  }, [c.expr])

  if (!c.aberta) return null

  // prévia ao vivo do resultado (ou do que falta)
  let previa = ''
  let erroAgora = ''
  try {
    if (c.expr.trim()) previa = formatar(calcular(c.expr, c))
  } catch (e) {
    erroAgora = (e as Error).message
  }
  if (/^[\d.,\s-]+$/.test(c.expr)) previa = ''

  const selecao = () => {
    const el = campo.current
    const fim = c.expr.length
    return el && document.activeElement === el ? [el.selectionStart ?? fim, el.selectionEnd ?? fim] : [fim, fim]
  }
  const inserir = (txt: string) => {
    const [a, b] = selecao()
    cursor.current = a + txt.length
    c.setExpr(c.expr.slice(0, a) + txt + c.expr.slice(b))
  }
  const apagar = () => {
    const [a, b] = selecao()
    if (a !== b) {
      cursor.current = a
      c.setExpr(c.expr.slice(0, a) + c.expr.slice(b))
    } else if (a > 0) {
      cursor.current = a - 1
      c.setExpr(c.expr.slice(0, a - 1) + c.expr.slice(a))
    }
  }
  const igual = () => {
    if (!c.expr.trim()) return
    try {
      const v = calcular(c.expr, c)
      const res = formatar(v)
      c.guardar({ expr: c.expr, res }, v)
      c.setExpr(res)
    } catch {
      setInsistiuEm(c.expr)
    }
  }
  const tecla = (t: Tecla) => {
    if (t.k === '=') return igual()
    if (t.k === 'C') return c.setExpr('')
    if (t.k === '⌫') return apagar()
    if (t.k === '1/x') return c.setExpr(c.expr.trim() ? `1/(${c.expr})` : '1/')
    if (t.k === 'Ans') return inserir('Ans')
    inserir(INSERE[t.k] ?? t.k)
  }

  if (c.comprimida) {
    if (semBotao) return null
    const ultimo = c.hist[c.hist.length - 1]
    return (
      <div ref={f.ref} className="fixed z-[35]" style={f.estilo}>
        <button
          {...f.alca}
          onClick={() => c.setComprimida(false)}
          className="flex items-center gap-2 rounded-full border border-[var(--linha)] bg-[var(--cartao)] px-3.5 py-2.5 text-sm font-medium text-[var(--tinta-forte)] shadow-[0_10px_30px_-12px_rgba(36,34,44,.35)]"
          title="abrir a calculadora (arraste para mudar de lugar)"
          aria-label="calculadora comprimida: abrir"
        >
          🧮 {ultimo ? <span className="max-w-[8rem] truncate tabular-nums">{ultimo.res}</span> : <span className="hidden sm:inline">calculadora</span>}
        </button>
      </div>
    )
  }

  return (
    <div
      ref={f.ref}
      className="fixed z-[35] w-[min(17.5rem,calc(100vw-1rem))] rounded-3xl border border-[var(--linha)] bg-[var(--cartao)] p-3 shadow-[0_18px_40px_-16px_rgba(36,34,44,.35)]"
      style={f.estilo}
      role="dialog"
      aria-label="calculadora"
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div {...f.alca} className="-mx-1 -mt-1 flex items-center gap-1 rounded-2xl px-1 py-1" style={{ ...f.alca.style }}>
        <span className="text-[var(--tinta-suave)]" aria-hidden>
          ⠿
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--tinta-suave)]">calculadora</span>
        <button
          className="ml-auto rounded-full px-2 py-0.5 text-[11px] text-[var(--tinta-suave)] hover:bg-[var(--papel-2)]"
          onClick={() => c.setGraus(!c.graus)}
          title="ângulos do sin, cos e tan: radianos ou graus"
        >
          {c.graus ? 'graus' : 'rad'}
        </button>
        <button className="grid h-7 w-7 place-items-center rounded-full text-[var(--tinta-suave)] hover:bg-[var(--papel-2)]" onClick={() => c.setComprimida(true)} title="comprimir" aria-label="comprimir">
          –
        </button>
        <button className="grid h-7 w-7 place-items-center rounded-full text-[var(--tinta-suave)] hover:bg-[var(--papel-2)]" onClick={c.fechar} title="fechar" aria-label="fechar a calculadora">
          ×
        </button>
      </div>

      {c.hist.length > 0 && (
        <div className="mt-1 max-h-20 overflow-y-auto text-right text-xs text-[var(--tinta-suave)]">
          {c.hist.slice(-4).map((h, i) => (
            <button key={i} className="block w-full truncate rounded px-1 text-right hover:bg-[var(--papel-2)]" onClick={() => inserir(h.res)} title="usar este resultado">
              {h.expr} = <span className="tabular-nums text-[var(--tinta)]">{h.res}</span>
            </button>
          ))}
        </div>
      )}

      <input
        ref={campo}
        value={c.expr}
        onChange={(e) => c.setExpr(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            igual()
          }
        }}
        placeholder="0"
        autoComplete="off"
        spellCheck={false}
        aria-label="conta"
        className="mt-1 w-full rounded-xl bg-[var(--papel)] px-3 py-2 text-right text-xl tabular-nums text-[var(--tinta-forte)] outline-none focus:ring-2 focus:ring-[var(--foco)]"
      />
      <div className="h-5 truncate px-1 text-right text-xs" aria-live="polite">
        {erroAgora && insistiuEm !== c.expr && /fim|fechar/.test(erroAgora) ? <span className="text-[var(--tinta-suave)]">…</span> : erroAgora ? <span className="text-[#c2410c]">{erroAgora}</span> : previa && <span className="text-[var(--tinta-suave)]">= {previa}</span>}
      </div>

      <div className="mt-1 grid grid-cols-5 gap-1">
        {TECLAS.map((t) => (
          <button
            key={t.k}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => tecla(t)}
            title={t.titulo}
            className={`h-9 rounded-xl text-sm transition active:scale-95 ${
              t.tipo === 'igual'
                ? 'bg-[var(--foco)] font-semibold text-white'
                : t.tipo === 'num'
                  ? 'bg-[var(--papel)] font-medium text-[var(--tinta-forte)] hover:bg-[var(--papel-2)]'
                  : t.tipo === 'op'
                    ? 'bg-[var(--foco-claro)] font-medium text-[var(--foco)]'
                    : t.tipo === 'acao'
                      ? 'bg-[var(--alerta-claro)] text-[var(--tinta-forte)]'
                      : 'bg-[var(--papel-2)] text-[var(--tinta)] hover:bg-[var(--linha)]'
            }`}
          >
            {t.rotulo ?? t.k}
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-[var(--tinta-suave)]">
        <span>Enter calcula · vírgula ou ponto</span>
        {c.hist.length > 0 && (
          <button className="hover:underline" onClick={c.limparHist}>
            limpar histórico
          </button>
        )}
      </div>
    </div>
  )
}
