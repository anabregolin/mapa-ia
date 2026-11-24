import { AnimatePresence, motion } from 'framer-motion'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CALCULADORAS } from '../content/calculadoras'
import { EM_PALAVRAS } from '../content/emPalavras'
import { aulasPara } from '../content/matematica'
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
        className="formula-termos campo-formula"
        onMouseOver={(e) => setAtivo(termoDe(e.target))}
        onMouseLeave={() => setAtivo(null)}
        onClick={(e) => setAtivo(termoDe(e.target))}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div className="mt-2 min-h-[3rem] rounded-xl bg-[var(--foco-claro)] px-3 py-2 text-[0.95em] leading-relaxed text-[var(--tinta)]">
        {destaque !== null && termos[destaque] ? (
          <motion.div key={destaque} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span className="mr-1.5 font-semibold text-[var(--foco)]">
              <Tex latex={termos[destaque][0]} />
            </span>
            {termos[destaque][1]}
          </motion.div>
        ) : (
          <span className="text-[var(--tinta-suave)]">Passe o mouse (ou toque) em cada parte da fórmula.</span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-sm">
        {montados === null ? (
          <button className="botao-suave" onClick={() => setMontados(1)}>
            montar termo a termo
          </button>
        ) : (
          <>
            <button className="botao-suave disabled:opacity-30" onClick={() => setMontados(montados - 1)} disabled={montados <= 1} aria-label="termo anterior">
              ◀
            </button>
            {montados < termos.length ? (
              <button className="botao-foco" onClick={() => setMontados(montados + 1)}>
                próximo termo ({montados}/{termos.length})
              </button>
            ) : (
              <button className="botao-suave" onClick={() => setMontados(null)}>
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
    <div className="mt-5 border-t border-[var(--linha)] pt-4">
      <div className="rotulo-formula">Troque os valores</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {calc.entradas.map((e) => (
          <label key={e.id} className="flex items-center gap-1.5 rounded-xl bg-[var(--papel-2)] px-2.5 py-1.5 text-sm text-[var(--tinta)]">
            {e.rotulo}
            <input
              type="number"
              inputMode="decimal"
              value={valores[e.id]}
              min={e.min}
              max={e.max}
              step={e.passo ?? 'any'}
              onChange={(ev) => setValores((v) => ({ ...v, [e.id]: ev.target.value }))}
              className="w-20 rounded-lg border border-[var(--linha)] bg-[var(--cartao)] px-1.5 py-0.5 text-right text-[var(--tinta-forte)] outline-none focus:border-[var(--foco)]"
            />
          </label>
        ))}
      </div>
      {r ? (
        <motion.div key={r.resultado} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="mt-3 rounded-xl bg-[var(--cartao)] px-3 py-2 ring-1 ring-[var(--linha)]">
          <div className="overflow-x-auto text-[var(--tinta)]">
            <Tex latex={r.conta} display />
          </div>
          <div className="overflow-x-auto font-semibold text-[var(--foco)]">
            <Tex latex={r.resultado} display />
          </div>
          {r.nota && <div className="text-sm text-[var(--tinta-suave)]">{r.nota}</div>}
        </motion.div>
      ) : (
        <div className="mt-2 text-sm text-[var(--alerta)]">preencha todos os campos com números</div>
      )}
    </div>
  )
}

/** "Me mostra a conta": matemática básica dos símbolos que aparecem nesta fórmula. */
function MostraConta({ formula }: { formula: Formula }) {
  const aulas = useMemo(() => aulasPara([formula.latex, ...(formula.exemplo?.passos.map((p) => p.latex) ?? [])]), [formula])
  const [aberto, setAberto] = useState(false)
  const [escolhida, setEscolhida] = useState(0)
  if (!aulas.length) return null
  const aula = aulas[Math.min(escolhida, aulas.length - 1)]

  return (
    <div className="mt-4">
      <button className="botao-suave" aria-expanded={aberto} onClick={() => setAberto((a) => !a)}>
        🧮 {aberto ? 'fechar a matemática básica' : 'me mostra a conta'}
      </button>
      {aberto && (
        <div className="mt-3 rounded-2xl border border-[var(--linha)] bg-[var(--cartao)] p-4">
          <p className="text-sm text-[var(--tinta-suave)]">O que cada símbolo desta fórmula quer dizer. Escolha um:</p>
          <div className="mt-2 flex flex-wrap gap-1.5" role="tablist">
            {aulas.map((a, i) => (
              <button
                key={a.id}
                role="tab"
                aria-selected={a === aula}
                onClick={() => setEscolhida(i)}
                className={`rounded-xl px-2.5 py-1 text-sm transition-colors ${a === aula ? 'bg-[var(--foco)] text-white' : 'bg-[var(--papel-2)] text-[var(--tinta)] hover:bg-[var(--linha)]'}`}
              >
                <Tex latex={a.simbolo} />
              </button>
            ))}
          </div>
          <div className="mt-4" role="tabpanel">
            <div className="font-semibold text-[var(--tinta-forte)]">{aula.titulo}</div>
            <p className="fonte-leitura mt-1">{aula.ideia}</p>
            <div className="mt-3 space-y-2">
              {aula.exemplo.map((e, i) => (
                <div key={i} className="rounded-xl bg-[var(--papel)] px-3 py-2">
                  <div className="overflow-x-auto text-[1.1em] text-[var(--tinta-forte)]">
                    <Tex latex={e.latex} display />
                  </div>
                  {e.nota && <div className="text-center text-sm text-[var(--tinta-suave)]">{e.nota}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Fórmula: primeiro em palavras, depois o símbolo num campo próprio, o exemplo passo a passo e a calculadora. */
export function FormulaAnimada({ formula }: { formula: Formula }) {
  const passos = formula.exemplo?.passos ?? []
  const [mostrados, setMostrados] = useState(0)
  const fim = mostrados >= passos.length
  const calc = CALCULADORAS[formula.id]
  const palavras = EM_PALAVRAS[formula.id]

  return (
    <section className="rounded-2xl border border-[var(--linha)] bg-[var(--papel)] p-4 sm:p-5" aria-label={formula.nome}>
      <h3 className="font-semibold text-[var(--tinta-forte)]">{formula.nome}</h3>
      {palavras && (
        <div className="mt-2">
          <div className="rotulo-formula">em palavras</div>
          <p className="fonte-leitura mt-1">{palavras}</p>
        </div>
      )}

      <div className="mt-4">
        <div className="rotulo-formula">em símbolos</div>
        <div className="mt-1">
          {TERMOS[formula.id] ? (
            <FormulaTermos partes={TERMOS[formula.id]} />
          ) : (
            <div className="campo-formula">
              <Tex latex={formula.latex} display />
            </div>
          )}
        </div>
      </div>

      {formula.variaveis && (
        <div className="mt-4">
          <div className="rotulo-formula">cada letra</div>
          <ul className="mt-1 space-y-1.5 text-[0.95em] text-[var(--tinta)]">
            {formula.variaveis.map((v) => (
              <li key={v.simbolo} className="flex gap-2">
                <span className="min-w-[2.5rem] shrink-0 text-center font-semibold text-[var(--foco)]">
                  <Tex latex={v.simbolo} />
                </span>
                <span>{v.descricao}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {formula.aviso && <div className="mt-4 rounded-xl bg-[var(--alerta-claro)] px-3 py-2 text-sm text-[var(--tinta-forte)]">⚠ {formula.aviso}</div>}

      <MostraConta formula={formula} />

      {formula.exemplo && (
        <div className="mt-5 border-t border-[var(--linha)] pt-4">
          <div className="rotulo-formula">exemplo</div>
          <p className="mt-1 text-[var(--tinta)]">{formula.exemplo.titulo}</p>
          <div className="mt-3 space-y-2.5">
            <AnimatePresence initial={false}>
              {passos.slice(0, mostrados).map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`rounded-xl px-3 py-2.5 ${i === passos.length - 1 ? 'bg-[var(--menta-claro)] ring-1 ring-[var(--menta)]' : 'bg-[var(--cartao)] ring-1 ring-[var(--linha)]'}`}
                >
                  <div className="rotulo-formula">
                    passo {i + 1} · {p.rotulo}
                  </div>
                  <div className="overflow-x-auto text-[1.1em] text-[var(--tinta-forte)]">
                    <Tex latex={p.latex} display />
                  </div>
                  {p.explicacao && <div className="text-[0.95em] text-[var(--tinta)]">{p.explicacao}</div>}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {mostrados > 0 && (
              <button className="botao-suave" onClick={() => setMostrados((m) => m - 1)} aria-label="Passo anterior">
                ◀ voltar
              </button>
            )}
            {!fim && (
              <button className="botao-foco" onClick={() => setMostrados((m) => m + 1)}>
                {mostrados === 0 ? 'Resolver passo a passo' : 'Próximo passo'} ({mostrados}/{passos.length})
              </button>
            )}
            {!fim && mostrados > 0 && (
              <button className="botao-suave" onClick={() => setMostrados(passos.length)}>
                mostrar tudo
              </button>
            )}
            {mostrados > 0 && (
              <button className="botao-suave" onClick={() => setMostrados(0)}>
                recomeçar
              </button>
            )}
          </div>
        </div>
      )}

      {calc && <Calculo calc={calc} />}
    </section>
  )
}
