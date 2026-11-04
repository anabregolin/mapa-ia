import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { DEMOS, demosDoTopico, exerciciosDoTopico } from '../content/exercicios'
import { formulasDoTopico } from '../content/formulas'
import { grupoPorId, topicoPorId, unidadePorId } from '../content/topicos'
import { EXPLICACOES } from '../content/explicacoes'
import type { Demo, Exercicio, StatusExercicio } from '../content/tipos'
import { dependentesDe, parecidosDe, prereqsDe } from '../lib/grafo'
import { useMapa } from '../store/useMapa'
import { DEMOS_INTERNAS } from './demos'
import { FormulaAnimada, Tex } from './FormulaAnimada'
import { COR_NIVEL, NOME_NIVEL } from './NoMapa'
import { Texto } from './Texto'

const STATUS: Record<StatusExercicio, { texto: string; cor: string }> = {
  gabarito: { texto: 'gabarito oficial', cor: '#34d399' },
  conferido: { texto: 'conta conferida', cor: '#38bdf8' },
  resolver: { texto: 'a resolver', cor: '#94a3b8' },
  aberto: { texto: 'questão aberta', cor: '#a78bfa' },
  trabalho: { texto: 'trabalho', cor: '#fbbf24' },
}

function Chip({ id, cor }: { id: string; cor: string }) {
  const selecionar = useMapa((s) => s.selecionar)
  const setHover = useMapa((s) => s.setHover)
  const tp = topicoPorId.get(id)!
  return (
    <button
      onClick={() => selecionar(id)}
      onMouseEnter={() => setHover(id)}
      onMouseLeave={() => setHover(null)}
      className="rounded-full border px-2 py-0.5 text-xs text-slate-200 hover:bg-tinta/10"
      style={{ borderColor: cor }}
    >
      {tp.titulo}
    </button>
  )
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">{titulo}</h3>
      {children}
    </section>
  )
}

function ItemExercicio({ ex, abrirDemo }: { ex: Exercicio; abrirDemo: (id: string) => void }) {
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

const NIVEIS_CAMADA = [
  { chave: 'intuicao', titulo: 'Intuição' },
  { chave: 'definicao', titulo: 'Definição' },
  { chave: 'detalhe', titulo: 'Detalhe técnico' },
] as const

/** Explicação em camadas: começa pela intuição e aprofunda sob demanda. */
function CamadasTopico({ id }: { id: string }) {
  const c = EXPLICACOES[id]
  const [nivel, setNivel] = useState(1)
  if (!c) return null
  return (
    <div className="mt-4 space-y-2">
      {NIVEIS_CAMADA.slice(0, nivel).map((n, i) => (
        <motion.div key={n.chave} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="relative border-l-2 pl-3" style={{ borderColor: ['#38bdf8', '#a78bfa', '#f472b6'][i] }}>
          <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">{n.titulo}</div>
          <p className="text-[14px] leading-relaxed text-slate-200">
            <Texto>{c[n.chave]}</Texto>
          </p>
        </motion.div>
      ))}
      {nivel >= 2 && c.cuidado && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-md bg-amber-400/10 px-3 py-2 text-[13px] text-amber-200">
          ⚠ <span className="font-semibold">Cuidado:</span> <Texto>{c.cuidado}</Texto>
        </motion.div>
      )}
      <div className="flex gap-2 text-xs">
        {nivel < 3 && (
          <button className="rounded-md bg-tinta/10 px-2.5 py-1 text-slate-200 hover:bg-tinta/15" onClick={() => setNivel((n) => n + 1)}>
            mostrar mais ↓ <span className="text-slate-400">{NIVEIS_CAMADA[nivel].titulo.toLowerCase()}</span>
          </button>
        )}
        {nivel > 1 && (
          <button className="rounded-md px-2 py-1 text-slate-400 hover:bg-tinta/10" onClick={() => setNivel(1)}>
            recolher
          </button>
        )}
      </div>
    </div>
  )
}

export function Painel() {
  const { selecionado, estudados, selecionar, alternarEstudado } = useMapa()
  const [demo, setDemo] = useState<Demo | null>(null)
  const tp = selecionado ? topicoPorId.get(selecionado) : undefined

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (demo) setDemo(null)
      else selecionar(null)
    }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [demo, selecionar])

  return (
    <>
      <AnimatePresence>
        {tp && (
          <motion.aside
            key="painel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="absolute bottom-[92px] right-0 top-0 z-30 w-full overflow-y-auto border-l border-tinta/10 bg-slate-950 p-5 shadow-[-20px_0_40px_rgba(0,0,0,.5)] sm:w-[440px]"
          >
            <motion.div key={tp.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-medium" style={{ color: unidadePorId.get(tp.unidade)!.cor }}>
                    {tp.unidade.toUpperCase()} · {unidadePorId.get(tp.unidade)!.titulo} › {grupoPorId.get(tp.grupo)!.titulo}
                  </div>
                  <h2 className="mt-1 text-2xl font-bold text-white">{tp.titulo}</h2>
                </div>
                <button onClick={() => selecionar(null)} className="rounded-md px-2 py-1 text-slate-400 hover:bg-tinta/10" aria-label="Fechar">
                  ✕
                </button>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full px-2 py-0.5" style={{ color: COR_NIVEL[tp.nivel], background: `${COR_NIVEL[tp.nivel]}1a` }}>
                  nível {NOME_NIVEL[tp.nivel]}
                </span>
                {tp.semSlide && <span className="rounded-full bg-sky-400/10 px-2 py-0.5 text-sky-300">conteúdo complementar (sem slide)</span>}
                {tp.naoVisto && <span className="rounded-full bg-slate-400/10 px-2 py-0.5 text-slate-300">não visto em aula</span>}
                <button
                  onClick={() => alternarEstudado(tp.id)}
                  className={`ml-auto rounded-full px-2.5 py-0.5 ${estudados[tp.id] ? 'bg-emerald-400 text-slate-900' : 'border border-tinta/20 text-slate-300 hover:bg-tinta/10'}`}
                >
                  {estudados[tp.id] ? '✓ estudado' : 'marcar como estudado'}
                </button>
              </div>

              <p className="mt-4 text-[15px] leading-relaxed text-slate-300">{tp.resumo}</p>

              <CamadasTopico id={tp.id} />

              {(prereqsDe.get(tp.id)!.length > 0 || dependentesDe.get(tp.id)!.length > 0) && (
                <Secao titulo="Ligações">
                  {prereqsDe.get(tp.id)!.length > 0 && (
                    <div className="mb-2">
                      <div className="mb-1 text-xs text-cyan-300">precisa de</div>
                      <div className="flex flex-wrap gap-1.5">{prereqsDe.get(tp.id)!.map((id) => <Chip key={id} id={id} cor="#22d3ee66" />)}</div>
                    </div>
                  )}
                  {dependentesDe.get(tp.id)!.length > 0 && (
                    <div>
                      <div className="mb-1 text-xs text-orange-300">leva a</div>
                      <div className="flex flex-wrap gap-1.5">{dependentesDe.get(tp.id)!.map((id) => <Chip key={id} id={id} cor="#fb923c66" />)}</div>
                    </div>
                  )}
                </Secao>
              )}

              {parecidosDe(tp.id).length > 0 && (
                <Secao titulo="Parecido com">
                  <ul className="space-y-1.5">
                    {parecidosDe(tp.id).map((c) => {
                      const outro = c.de === tp.id ? c.para : c.de
                      return (
                        <li key={outro} className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                          <Chip id={outro} cor="#f472b666" />
                          <span className="text-xs text-pink-200/80">{c.nota}</span>
                        </li>
                      )
                    })}
                  </ul>
                </Secao>
              )}

              {formulasDoTopico(tp.id).length > 0 && (
                <Secao titulo="Fórmulas">
                  <div className="space-y-3">
                    {formulasDoTopico(tp.id).map((f) => (
                      <FormulaAnimada key={`${tp.id}:${f.id}`} formula={f} />
                    ))}
                  </div>
                </Secao>
              )}

              {demosDoTopico(tp.id).length > 0 && (
                <Secao titulo="Demos">
                  <div className="flex flex-wrap gap-2">
                    {demosDoTopico(tp.id).map((d) =>
                      d.externa ? (
                        <a key={d.id} href={d.url} target="_blank" rel="noreferrer" className="rounded-lg bg-tinta/5 px-3 py-1.5 text-sm text-slate-200 hover:bg-tinta/10">
                          {d.titulo} ↗
                        </a>
                      ) : (
                        <button key={d.id} onClick={() => setDemo(d)} className="rounded-lg bg-violet-500/15 px-3 py-1.5 text-sm text-violet-200 hover:bg-violet-500/25">
                          ▶ {d.titulo}
                        </button>
                      ),
                    )}
                  </div>
                </Secao>
              )}

              {exerciciosDoTopico(tp.id).length > 0 && (
                <Secao titulo="Exercícios">
                  <ul className="space-y-1.5">
                    {exerciciosDoTopico(tp.id).map((ex) => (
                      <ItemExercicio key={ex.id} ex={ex} abrirDemo={(id) => setDemo(DEMOS.find((d) => d.id === id) ?? null)} />
                    ))}
                  </ul>
                </Secao>
              )}

              {tp.fontes.length > 0 && (
                <Secao titulo="Fonte">
                  <ul className="text-xs text-slate-400">
                    {tp.fontes.map((f) => (
                      <li key={f.arquivo + f.paginas}>
                        {f.arquivo}
                        {f.paginas && <span className="text-slate-500"> · p. {f.paginas}</span>}
                      </li>
                    ))}
                  </ul>
                </Secao>
              )}
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {demo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 p-4 backdrop-blur"
            onClick={() => setDemo(null)}
          >
            <div className="mb-2 flex items-center justify-between text-slate-200">
              <span className="font-semibold">{demo.titulo}</span>
              <button className="rounded-md px-3 py-1 hover:bg-tinta/10" onClick={() => setDemo(null)}>
                fechar ✕
              </button>
            </div>
            {demo.componente ? (
              <div className="min-h-0 flex-1">{DEMOS_INTERNAS[demo.url]?.()}</div>
            ) : (
              <iframe
                src={`${import.meta.env.BASE_URL}${demo.url}`}
                title={demo.titulo}
                sandbox="allow-scripts"
                className="flex-1 rounded-xl border border-tinta/10 bg-white"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
