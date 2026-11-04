import { AnimatePresence, motion } from 'framer-motion'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { useMemo, useState } from 'react'
import { CALCULADORAS } from '../content/calculadoras'
import type { Calculadora, Formula } from '../content/tipos'

export function Tex({ latex, display = false }: { latex: string; display?: boolean }) {
  const html = useMemo(() => katex.renderToString(latex, { throwOnError: false, displayMode: display }), [latex, display])
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

/** "Troque os valores": a conta e o resultado mudam enquanto você digita. */
function Calculo({ calc }: { calc: Calculadora }) {
  const [valores, setValores] = useState(() => Object.fromEntries(calc.entradas.map((e) => [e.id, String(Number(e.valor.toFixed(4)))])))
  const numeros = Object.fromEntries(Object.entries(valores).map(([k, v]) => [k, Number(v.replace(',', '.'))]))
  const invalido = Object.values(numeros).some((n) => !Number.isFinite(n))
  const r = invalido ? null : calc.calcular(numeros)

  return (
    <div className="mt-3 border-t border-white/10 pt-2">
      <div className="text-xs text-slate-500">Troque os valores</div>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {calc.entradas.map((e) => (
          <label key={e.id} className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs text-slate-300">
            {e.rotulo}
            <input
              type="number"
              inputMode="decimal"
              value={valores[e.id]}
              min={e.min}
              max={e.max}
              step={e.passo ?? 'any'}
              onChange={(ev) => setValores((v) => ({ ...v, [e.id]: ev.target.value }))}
              className="w-16 rounded bg-slate-950 px-1 py-0.5 text-right text-slate-100 outline-none ring-1 ring-white/10 focus:ring-violet-400/60"
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
    <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-violet-300">{formula.nome}</div>
      <div className="overflow-x-auto py-1 text-slate-100">
        <Tex latex={formula.latex} display />
      </div>

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
        <div className="mt-3 border-t border-white/10 pt-2">
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
                  className={`rounded-lg px-2 py-1.5 ${i === passos.length - 1 ? 'bg-emerald-400/10 ring-1 ring-emerald-400/30' : 'bg-white/5'}`}
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
              <button className="rounded-md px-2 py-1 text-xs text-slate-300 hover:bg-white/10" onClick={() => setMostrados((m) => m - 1)} aria-label="Passo anterior">
                ◀ voltar
              </button>
            )}
            {!fim && (
              <button className="rounded-md bg-violet-500/80 px-2.5 py-1 text-xs font-medium text-white hover:bg-violet-500" onClick={() => setMostrados((m) => m + 1)}>
                {mostrados === 0 ? 'Resolver passo a passo' : 'Próximo passo'} ({mostrados}/{passos.length})
              </button>
            )}
            {!fim && mostrados > 0 && (
              <button className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-white/10" onClick={() => setMostrados(passos.length)}>
                mostrar tudo
              </button>
            )}
            {mostrados > 0 && (
              <button className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-white/10" onClick={() => setMostrados(0)}>
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
