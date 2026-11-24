import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ATIVIDADES_PADRAO, PARADO, bipar, duracao, faltam, proxima, relogio, sortear, type Fase } from '../lib/pomodoro'
import { useMapa } from '../store/useMapa'

const NOME_FASE: Record<Fase, string> = { foco: 'foco', pausa: 'pausa', longa: 'pausa longa' }
const COR_FASE: Record<Fase, string> = { foco: 'var(--coral)', pausa: 'var(--menta)', longa: 'var(--menta)' }

function Numero({ rotulo, valor, min, max, mudar }: { rotulo: string; valor: number; min: number; max: number; mudar: (n: number) => void }) {
  return (
    <label className="flex items-center justify-between gap-2 text-sm text-[var(--tinta)]">
      {rotulo}
      <input
        type="number"
        min={min}
        max={max}
        value={valor}
        onChange={(e) => {
          const n = Number(e.target.value)
          if (n >= min && n <= max) mudar(n)
        }}
        className="w-16 rounded-lg border border-[var(--linha)] bg-[var(--papel)] px-2 py-1 text-right"
      />
    </label>
  )
}

function Configurar() {
  const p = useMapa((s) => s.pomodoroPref)
  const setP = useMapa((s) => s.setPomodoroPref)
  const [texto, setTexto] = useState(p.atividades.join('\n'))
  return (
    <div className="mt-3 space-y-2 border-t border-[var(--linha)] pt-3">
      <Numero rotulo="foco (min)" valor={p.foco} min={1} max={120} mudar={(foco) => setP({ foco })} />
      <Numero rotulo="pausa curta (min)" valor={p.pausa} min={1} max={60} mudar={(pausa) => setP({ pausa })} />
      <Numero rotulo="pausa longa (min)" valor={p.longa} min={1} max={90} mudar={(longa) => setP({ longa })} />
      <Numero rotulo="focos até a pausa longa" valor={p.ciclos} min={1} max={12} mudar={(ciclos) => setP({ ciclos })} />
      <label className="flex items-center justify-between gap-2 text-sm text-[var(--tinta)]">
        som ao terminar
        <input type="checkbox" checked={p.som} onChange={() => setP({ som: !p.som })} className="h-4 w-4 accent-[var(--foco)]" />
      </label>
      <div>
        <div className="mb-1 text-sm text-[var(--tinta)]">O que fazer nas pausas</div>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onBlur={() => setP({ atividades: texto.split('\n').map((l) => l.trim()).filter(Boolean) })}
          rows={6}
          className="w-full resize-y rounded-lg border border-[var(--linha)] bg-[var(--papel)] px-2 py-1.5 text-xs leading-relaxed text-[var(--tinta-forte)]"
        />
        <p className="text-[11px] text-[var(--tinta-suave)]">Uma por linha. Escreva {'{min}'} onde quiser a duração da pausa.</p>
        <button
          className="mt-1 text-[11px] text-[var(--foco)] hover:underline"
          onClick={() => {
            setTexto(ATIVIDADES_PADRAO.join('\n'))
            setP({ atividades: ATIVIDADES_PADRAO })
          }}
        >
          voltar às sugestões padrão
        </button>
      </div>
    </div>
  )
}

/** Timer pomodoro no canto inferior esquerdo, em todas as telas. */
export function Pomodoro({ telaMapa = false }: { telaMapa?: boolean }) {
  const e = useMapa((s) => s.pomodoro)
  const p = useMapa((s) => s.pomodoroPref)
  const setE = useMapa((s) => s.setPomodoro)
  const [aberto, setAberto] = useState(false)
  const [ajustes, setAjustes] = useState(false)
  const [agora, setAgora] = useState(() => Date.now())

  // relógio: só anda enquanto está rodando
  useEffect(() => {
    if (!e.rodando) return
    const t = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [e.rodando])

  const resta = faltam(e, p, agora)

  // fim de fase (também pega o caso de a aba ter ficado fechada e o tempo já ter passado)
  useEffect(() => {
    if (!e.rodando || !e.terminaEm || agora < e.terminaEm) return
    const seguinte = proxima(e, p, Date.now())
    setE(seguinte)
    if (p.som) bipar()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- abrir o cartão é a reação ao fim da fase
    setAberto(true)
  }, [agora, e, p, setE])

  // tempo no título da aba, para ver de outra aba
  useEffect(() => {
    const base = 'Mapa de IA'
    document.title = e.rodando ? `${e.fase === 'foco' ? '🍅' : '☕'} ${relogio(resta)} · ${base}` : base
  }, [e.rodando, e.fase, resta])

  const agoraMs = () => Date.now()
  const comecar = () => {
    const n = agoraMs()
    setAgora(n)
    setE({ ...e, rodando: true, terminaEm: n + (e.restante ?? duracao(e.fase, p)), restante: null })
  }
  const pausar = () => setE({ ...e, rodando: false, terminaEm: null, restante: faltam(e, p, agoraMs()) })
  const pular = () => {
    const n = agoraMs()
    setAgora(n)
    setE(proxima(e, p, n))
  }
  const zerar = () => setE(PARADO)

  const emPausa = e.fase !== 'foco'
  const naoComecou = !e.rodando && e.restante === null && e.fase === 'foco' && e.feitos === 0
  const progresso = 1 - resta / duracao(e.fase, p)
  const cicloAtual = (e.feitos % p.ciclos) + 1

  return (
    <div className={`fixed z-[35] ${telaMapa ? 'bottom-4 left-16' : 'bottom-5 left-5'}`} style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="absolute bottom-full left-0 mb-2 max-h-[75vh] w-[min(20rem,calc(100vw-2.5rem))] overflow-y-auto rounded-3xl border border-[var(--linha)] bg-[var(--cartao)] p-4 shadow-[0_18px_40px_-16px_rgba(36,34,44,.35)]"
            role="dialog"
            aria-label="pomodoro"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: COR_FASE[e.fase] }}>
                {NOME_FASE[e.fase]}
                {e.fase === 'foco' && <span className="text-[var(--tinta-suave)]"> · {cicloAtual} de {p.ciclos}</span>}
              </span>
              <button className="text-xs text-[var(--tinta-suave)] hover:underline" onClick={() => setAberto(false)}>
                esconder
              </button>
            </div>

            <div className="mt-1 text-5xl font-semibold tabular-nums text-[var(--tinta-forte)]">{relogio(resta)}</div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--papel-2)]">
              <div className="h-full rounded-full transition-[width] duration-1000" style={{ width: `${progresso * 100}%`, background: COR_FASE[e.fase] }} />
            </div>

            {emPausa && e.sugestao && (
              <div className="mt-3 rounded-2xl bg-[var(--menta-claro)] px-3 py-2.5 text-sm text-[var(--tinta-forte)]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--menta)]">na pausa</div>
                <p className="mt-0.5">{e.sugestao}</p>
                <button className="mt-1 text-xs text-[var(--tinta-suave)] hover:underline" onClick={() => setE({ ...e, sugestao: sortear(p, e.fase, e.sugestao) })}>
                  ↻ outra ideia
                </button>
              </div>
            )}
            {!e.rodando && e.fase === 'foco' && e.feitos > 0 && e.restante === null && <p className="mt-3 text-sm text-[var(--tinta)]">A pausa acabou. Pronta para o próximo foco?</p>}

            <div className="mt-3 flex flex-wrap gap-2">
              {e.rodando ? (
                <button className="botao-suave" onClick={pausar}>
                  ⏸ pausar
                </button>
              ) : (
                <button className="botao-foco" onClick={comecar}>
                  ▶ {e.restante !== null ? 'continuar' : emPausa ? 'começar pausa' : 'começar foco'}
                </button>
              )}
              {!naoComecou && (
                <button className="botao-suave" onClick={pular} title={emPausa ? 'encerrar a pausa' : 'encerrar o foco e ir para a pausa'}>
                  ⏭ {emPausa ? 'voltar ao foco' : 'ir para a pausa'}
                </button>
              )}
              {!naoComecou && (
                <button className="botao-suave" onClick={zerar} title="volta ao começo">
                  ↺
                </button>
              )}
            </div>
            <p className="mt-2 text-[11px] text-[var(--tinta-suave)]">
              {e.feitos === 0 ? 'Nenhum foco terminado ainda.' : `${e.feitos} ${e.feitos === 1 ? 'foco terminado' : 'focos terminados'}.`} A pausa começa sozinha; o foco espera você.
            </p>

            <button className="mt-2 text-xs text-[var(--foco)] hover:underline" onClick={() => setAjustes(!ajustes)} aria-expanded={ajustes}>
              {ajustes ? '▾' : '▸'} ajustar tempos e atividades
            </button>
            {ajustes && <Configurar />}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setAberto(!aberto)}
        aria-label={`pomodoro${e.rodando ? `, ${NOME_FASE[e.fase]}, faltam ${relogio(resta)}` : ''}`}
        aria-expanded={aberto}
        className="flex items-center gap-2 rounded-full border border-[var(--linha)] bg-[var(--cartao)] px-3.5 py-2.5 text-sm font-medium text-[var(--tinta-forte)] shadow-[0_10px_30px_-12px_rgba(36,34,44,.35)] transition-transform hover:-translate-y-0.5"
      >
        <span>{emPausa ? '☕' : '🍅'}</span>
        {naoComecou ? <span className="hidden sm:inline">pomodoro</span> : <span className="tabular-nums" style={{ color: e.rodando ? COR_FASE[e.fase] : undefined }}>{relogio(resta)}</span>}
        {!e.rodando && !naoComecou && <span className="text-xs text-[var(--tinta-suave)]">⏸</span>}
      </button>
    </div>
  )
}
