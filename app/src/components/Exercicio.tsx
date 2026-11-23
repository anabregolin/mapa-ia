import { AnimatePresence, motion } from 'framer-motion'
import { Suspense, useEffect, useState } from 'react'
import type { Demo, Exercicio, StatusExercicio } from '../content/tipos'
import { useMapa } from '../store/useMapa'
import { DEMOS_INTERNAS } from './demos'
import { Tex } from './FormulaAnimada'
import { Texto } from './Texto'

const STATUS: Record<StatusExercicio, { texto: string; cor: string }> = {
  gabarito: { texto: 'gabarito oficial', cor: '#34d399' },
  conferido: { texto: 'conta conferida', cor: '#38bdf8' },
  resolver: { texto: 'a resolver', cor: '#94a3b8' },
  aberto: { texto: 'questão aberta', cor: '#a78bfa' },
  trabalho: { texto: 'trabalho', cor: '#fbbf24' },
}

export function ItemExercicio({ ex, abrirDemo }: { ex: Exercicio; abrirDemo: (id: string) => void }) {
  const progresso = useMapa((s) => s.exercicios[ex.id])
  const marcar = useMapa((s) => s.marcarExercicio)
  const [aberto, setAberto] = useState(false)
  const [dica, setDica] = useState(false)
  const [passos, setPassos] = useState(0)
  const [resposta, setResposta] = useState(false)
  const st = STATUS[ex.status]
  const total = ex.passos?.length ?? 0
  const temConteudo = !!(ex.enunciado || ex.dica || total || ex.resposta || ex.demo)

  return (
    <li className={`rounded-lg px-3 py-2 text-sm ${progresso === 'feito' ? 'bg-emerald-400/5 ring-1 ring-emerald-400/20' : progresso === 'duvida' ? 'bg-amber-400/5 ring-1 ring-amber-400/20' : 'bg-tinta/5'}`}>
      <button className="flex w-full items-start justify-between gap-2 text-left disabled:cursor-default" onClick={() => setAberto((a) => !a)} disabled={!temConteudo}>
        <div>
          {progresso === 'feito' && <span className="mr-1 text-emerald-400">✓</span>}
          {progresso === 'duvida' && <span className="mr-1 text-amber-400">?</span>}
          <span className="text-slate-400">{ex.fonte} · </span>
          <span className="text-slate-200">{ex.questao}</span>
          {ex.figura && !ex.demo && <span className="ml-1 text-xs text-slate-500" title="depende de uma figura do PDF">🖼️</span>}
        </div>
        <span className="flex shrink-0 items-center gap-1.5">
          <span className="rounded-full px-1.5 py-0.5 text-[10px]" style={{ color: st.cor, background: `${st.cor}1a` }}>
            {st.texto}
          </span>
          {temConteudo && <span className={`text-xs text-slate-500 transition-transform ${aberto ? 'rotate-90' : ''}`}>▸</span>}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {aberto && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-2 space-y-2 border-t border-tinta/10 pt-2">
              {ex.enunciado && (
                <p className="text-[13px] leading-relaxed text-slate-300">
                  <Texto>{ex.enunciado}</Texto>
                </p>
              )}

              {dica && ex.dica && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-md bg-sky-400/10 px-2 py-1.5 text-[13px] text-sky-200">
                  💡 <Texto>{ex.dica}</Texto>
                </motion.div>
              )}

              {ex.passos?.slice(0, passos).map((ps, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded-md bg-tinta/5 px-2 py-1.5 text-[13px] text-slate-200">
                  <span className="mr-1 text-[10px] text-slate-500">{i + 1}.</span>
                  <Texto>{ps.texto}</Texto>
                  {ps.latex && (
                    <div className="overflow-x-auto">
                      <Tex latex={ps.latex} display />
                    </div>
                  )}
                </motion.div>
              ))}

              {resposta && ex.resposta && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-md bg-emerald-400/10 px-2 py-1.5 text-[13px] text-emerald-200 ring-1 ring-emerald-400/30">
                  <Texto>{ex.resposta}</Texto>
                </motion.div>
              )}

              <div className="flex flex-wrap gap-1.5 text-xs">
                {ex.demo && (
                  <button className="rounded-md bg-violet-500/15 px-2 py-1 text-violet-200 hover:bg-violet-500/25" onClick={() => abrirDemo(ex.demo!)}>
                    ▶ figura animada
                  </button>
                )}
                {ex.dica && !dica && (
                  <button className="rounded-md bg-sky-400/15 px-2 py-1 text-sky-200 hover:bg-sky-400/25" onClick={() => setDica(true)}>
                    dica
                  </button>
                )}
                {passos < total && (
                  <button className="rounded-md bg-violet-500/80 px-2 py-1 font-medium text-white hover:bg-violet-500" onClick={() => setPassos((n) => n + 1)}>
                    {passos === 0 ? 'primeiro passo' : 'próximo passo'} ({passos}/{total})
                  </button>
                )}
                {passos > 0 && (
                  <button className="rounded-md px-2 py-1 text-slate-300 hover:bg-tinta/10" onClick={() => setPassos((n) => n - 1)}>
                    ◀ voltar
                  </button>
                )}
                {(passos < total || (ex.resposta && !resposta)) && (
                  <button
                    className="rounded-md px-2 py-1 text-slate-300 hover:bg-tinta/10"
                    onClick={() => {
                      setPassos(total)
                      setResposta(true)
                    }}
                  >
                    {total ? 'resolução completa' : 'ver resposta'}
                  </button>
                )}
                <span className="ml-auto flex gap-1">
                  <button
                    className={`rounded-md px-2 py-1 ${progresso === 'feito' ? 'bg-emerald-400 text-slate-900' : 'text-emerald-300 hover:bg-emerald-400/10'}`}
                    onClick={() => marcar(ex.id, 'feito')}
                  >
                    ✓ feito
                  </button>
                  <button
                    className={`rounded-md px-2 py-1 ${progresso === 'duvida' ? 'bg-amber-400 text-slate-900' : 'text-amber-300 hover:bg-amber-400/10'}`}
                    onClick={() => marcar(ex.id, 'duvida')}
                  >
                    ? dúvida
                  </button>
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

/** Demo em tela cheia (Esc fecha). */
export function DemoModal({ demo, fechar }: { demo: Demo | null; fechar: () => void }) {
  useEffect(() => {
    if (!demo) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && fechar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [demo, fechar])
  return (
    <AnimatePresence>
      {demo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col bg-[var(--papel)]/95 p-4 backdrop-blur"
          onClick={fechar}
        >
          <div className="mb-2 flex items-center justify-between text-[var(--tinta-forte)]">
            <span className="font-semibold">{demo.titulo}</span>
            <button className="botao-suave" onClick={fechar}>
              fechar ✕
            </button>
          </div>
          <div className="min-h-0 flex-1" onClick={(e) => e.stopPropagation()}>
            {demo.componente ? (
              <Suspense fallback={<div className="p-6 text-sm text-[var(--tinta-suave)]">carregando…</div>}>{DEMOS_INTERNAS[demo.url]?.()}</Suspense>
            ) : (
              <iframe src={`${import.meta.env.BASE_URL}${demo.url}`} title={demo.titulo} sandbox="allow-scripts" className="h-full w-full rounded-2xl border border-[var(--linha)] bg-white" />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
