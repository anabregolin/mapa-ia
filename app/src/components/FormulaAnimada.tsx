import { AnimatePresence, motion } from 'framer-motion'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CALCULADORAS } from '../content/calculadoras'
import { TERMOS, type Parte } from '../content/termos'
import type { Calculadora, Formula } from '../content/tipos'

export function Tex({ latex, display = false }: { latex: string; display?: boolean }) {
  const html = useMemo(() => katex.renderToString(latex, { throwOnError: false, displayMode: display }), [latex, display])
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

/** Junta as partes marcando cada termo com \htmlData para achar no DOM depois. */
function latexComTermos(partes: Parte[]) {
  let i = 0
  return partes.map((p) => (typeof p === 'string' ? p : `\\htmlData{termo=${i++}}{${p[0]}}`)).join('')
}

/** Fórmula em que cada termo explica a si mesmo (mouse ou toque) e pode ser montada termo a termo. */
function FormulaTermos({ partes }: { partes: Parte[] }) {
  const termos = partes.filter((p): p is [string, string] => typeof p !== 'string')
  const html = useMemo(
    () => katex.renderToString(latexComTermos(partes), { displayMode: true, throwOnError: false, strict: 'ignore', trust: (c) => c.command === '\\htmlData' }),
    [partes],
  )
  const ref = useRef<HTMLDivElement>(null)
  const [ativo, setAtivo] = useState<number | null>(null)
  /** null = fórmula inteira; n = só os n primeiros termos */
  const [montados, setMontados] = useState<number | null>(null)
  const destaque = ativo ?? (montados ? montados - 1 : null)

  useEffect(() => {
    ref.current?.querySelectorAll<HTMLElement>('[data-termo]').forEach((el) => {
      const i = Number(el.dataset.termo)
      el.classList.toggle('termo-oculto', montados !== null && i >= montados)
      el.classList.toggle('termo-ativo', i === destaque)
    })
  }, [html, montados, destaque])

  const termoDe = (alvo: EventTarget) => {
    const el = (alvo as HTMLElement).closest<HTMLElement>('[data-termo]')
    return el ? Number(el.dataset.termo) : null
  }

  return (
    <div>
      <div
        ref={ref}
        className="formula-termos overflow-x-auto py-1 text-slate-100"
        onMouseOver={(e) => setAtivo(termoDe(e.target))}
        onMouseLeave={() => setAtivo(null)}
        onClick={(e) => setAtivo(termoDe(e.target))}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div className="min-h-[2.5rem] rounded-md bg-cyan-400/5 px-2 py-1.5 text-xs leading-snug text-slate-300">
        {destaque !== null && termos[destaque] ? (
          <motion.div key={destaque} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span className="mr-1 text-cyan-300">
              <Tex latex={termos[destaque][0]} />
            </span>
            {termos[destaque][1]}
          </motion.div>
        ) : (
          <span className="text-slate-500">Passe o mouse (ou toque) em cada parte da fórmula.</span>
        )}
      </div>
      <div className="mt-1.5 flex gap-1.5 text-xs">
        {montados === null ? (
          <button className="rounded-md bg-cyan-400/15 px-2 py-1 text-cyan-200 hover:bg-cyan-400/25" onClick={() => setMontados(1)}>
            montar termo a termo
          </button>
        ) : (
          <>
            <button className="rounded-md px-2 py-1 text-slate-300 hover:bg-tinta/10 disabled:opacity-30" onClick={() => setMontados(montados - 1)} disabled={montados <= 1}>
              ◀
            </button>
            {montados < termos.length ? (
              <button className="rounded-md bg-cyan-400/15 px-2 py-1 text-cyan-200 hover:bg-cyan-400/25" onClick={() => setMontados(montados + 1)}>
                próximo termo ({montados}/{termos.length})
              </button>
            ) : (
              <button className="rounded-md px-2 py-1 text-slate-300 hover:bg-tinta/10" onClick={() => setMontados(null)}>
                pronto ✓
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/** "Troque os valores": a conta e o resultado mudam enquanto você digita. */
function Calculo({ calc }: { calc: Calculadora }) {
  const [valores, setValores] = useState(() => Object.fromEntries(calc.entradas.map((e) => [e.id, String(Number(e.valor.toFixed(4)))])))
  const numeros = Object.fromEntries(Object.entries(valores).map(([k, v]) => [k, Number(v.replace(',', '.'))]))
  const invalido = Object.values(numeros).some((n) => !Number.isFinite(n))
  const r = invalido ? null : calc.calcular(numeros)

  return (
    <div className="mt-3 border-t border-tinta/10 pt-2">
      <div className="text-xs text-slate-500">Troque os valores</div>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {calc.entradas.map((e) => (
          <label key={e.id} className="flex items-center gap-1 rounded-md bg-tinta/5 px-2 py-1 text-xs text-slate-300">
            {e.rotulo}
            <input
              type="number"
              inputMode="decimal"
              value={valores[e.id]}
              min={e.min}
              max={e.max}
              step={e.passo ?? 'any'}
              onChange={(ev) => setValores((v) => ({ ...v, [e.id]: ev.target.value }))}
              className="w-16 rounded bg-slate-950 px-1 py-0.5 text-right text-slate-100 outline-none ring-1 ring-tinta/10 focus:ring-violet-400/60"
            />
          </label>
        ))}
      </div>
      {r ? (
        <motion.div key={r.resultado} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="mt-2 rounded-lg bg-violet-500/10 px-2 py-1.5">
          <div className="overflow-x-auto text-slate-300">
            <Tex latex={r.conta} display />
          </div>
          <div className="overflow-x-auto font-semibold text-violet-100">
            <Tex latex={r.resultado} display />
          </div>
          {r.nota && <div className="text-xs text-slate-400">{r.nota}</div>}
        </motion.div>
      ) : (
        <div className="mt-2 text-xs text-rose-300">preencha todos os campos com números</div>
      )}
    </div>
  )
}

/** Fórmula + exemplo resolvido, revelado um passo por vez, + calculadora quando existe. */
export function FormulaAnimada({ formula }: { formula: Formula }) {
  const passos = formula.exemplo?.passos ?? []
  const [mostrados, setMostrados] = useState(0)
  const fim = mostrados >= passos.length
  const calc = CALCULADORAS[formula.id]

  return (
    <div className="rounded-xl border border-tinta/10 bg-slate-900/70 p-3">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-violet-300">{formula.nome}</div>
      {TERMOS[formula.id] ? (
        <FormulaTermos partes={TERMOS[formula.id]} />
      ) : (
        <div className="overflow-x-auto py-1 text-slate-100">
          <Tex latex={formula.latex} display />
        </div>
      )}

      {formula.variaveis && (
        <ul className="mt-1 space-y-0.5 text-xs text-slate-400">
          {formula.variaveis.map((v) => (
            <li key={v.simbolo}>
              <Tex latex={v.simbolo} /> — {v.descricao}
            </li>
          ))}
        </ul>
      )}

      {formula.aviso && <div className="mt-2 rounded-md bg-amber-400/10 px-2 py-1 text-xs text-amber-300">⚠ {formula.aviso}</div>}

      {formula.exemplo && (
        <div className="mt-3 border-t border-tinta/10 pt-2">
          <div className="text-xs text-slate-300">
            <span className="text-slate-500">Exemplo:</span> {formula.exemplo.titulo}
          </div>
          <div className="mt-2 space-y-2">
            <AnimatePresence initial={false}>
              {passos.slice(0, mostrados).map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35 }}
                  className={`rounded-lg px-2 py-1.5 ${i === passos.length - 1 ? 'bg-emerald-400/10 ring-1 ring-emerald-400/30' : 'bg-tinta/5'}`}
                >
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">{p.rotulo}</div>
                  <div className="overflow-x-auto text-slate-100">
                    <Tex latex={p.latex} display />
                  </div>
                  {p.explicacao && <div className="text-xs text-slate-400">{p.explicacao}</div>}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {mostrados > 0 && (
              <button className="rounded-md px-2 py-1 text-xs text-slate-300 hover:bg-tinta/10" onClick={() => setMostrados((m) => m - 1)} aria-label="Passo anterior">
                ◀ voltar
              </button>
            )}
            {!fim && (
              <button className="rounded-md bg-violet-500/80 px-2.5 py-1 text-xs font-medium text-white hover:bg-violet-500" onClick={() => setMostrados((m) => m + 1)}>
                {mostrados === 0 ? 'Resolver passo a passo' : 'Próximo passo'} ({mostrados}/{passos.length})
              </button>
            )}
            {!fim && mostrados > 0 && (
              <button className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-tinta/10" onClick={() => setMostrados(passos.length)}>
                mostrar tudo
              </button>
            )}
            {mostrados > 0 && (
              <button className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-tinta/10" onClick={() => setMostrados(0)}>
                recomeçar
              </button>
            )}
          </div>
        </div>
      )}

      {calc && <Calculo calc={calc} />}
    </div>
  )
}
