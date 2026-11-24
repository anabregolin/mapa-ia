import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { PARADO, bipar, duracao, faltam, proxima, relogio, sortear, type Fase } from '../lib/pomodoro'
import { useMapa } from '../store/useMapa'
import { useFlutuante } from '../lib/flutuante'
import { useSurgir } from '../lib/movimento'

const NOME_FASE: Record<Fase, string> = { foco: 'foco', pausa: 'pausa', longa: 'pausa longa' }
const COR_FASE: Record<Fase, string> = { foco: 'var(--coral)', pausa: 'var(--menta)', longa: 'var(--menta)' }

/** Relógio do pomodoro que só anda enquanto está rodando. */
function useAgoraPomodoro(rodando: boolean) {
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => {
    if (!rodando) return
    const t = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [rodando])
  return [agora, setAgora] as const
}

/** O pomodoro comprimido dentro de uma barra (o rodapé fixo do tópico): mostra o tempo e abre a janelinha. */
export function BotaoPomodoro() {
  const e = useMapa((s) => s.pomodoro)
  const p = useMapa((s) => s.pomodoroPref)
  const aberto = useMapa((s) => s.pomodoroAberto)
  const setAberto = useMapa((s) => s.setPomodoroAberto)
  const [agora] = useAgoraPomodoro(e.rodando)
  const resta = faltam(e, p, agora)
  const emPausa = e.fase !== 'foco'
  const naoComecou = !e.rodando && e.restante === null && e.fase === 'foco' && e.feitos === 0
  return (
    <button
      className="botao-suave flex shrink-0 items-center gap-1.5"
      onClick={() => setAberto(!aberto)}
      aria-expanded={aberto}
      title={aberto ? 'comprimir o pomodoro' : 'abrir o pomodoro'}
      aria-label={`pomodoro${e.rodando ? `, ${NOME_FASE[e.fase]}, faltam ${relogio(resta)}` : ''}`}
      style={aberto ? { background: 'var(--foco-claro)', color: 'var(--foco)' } : undefined}
    >
      <span aria-hidden>{emPausa ? '☕' : '🍅'}</span>
      {naoComecou ? (
        <span className="hidden sm:inline">pomodoro</span>
      ) : (
        <span className="tabular-nums" style={{ color: e.rodando ? COR_FASE[e.fase] : undefined }}>
          {relogio(resta)}
        </span>
      )}
      {!e.rodando && !naoComecou && <span className="text-xs text-[var(--tinta-suave)]">⏸</span>}
    </button>
  )
}

/**
 * Timer pomodoro flutuante, em todas as telas. Começa no canto de baixo à esquerda; arraste pelo botão ou pelo topo do cartão.
 * `semBotao`: a tela tem o próprio botão (o rodapé fixo do tópico e da trilha); comprimido, ele some daqui em vez de flutuar.
 */
export function Pomodoro({ telaMapa = false, semBotao = false }: { telaMapa?: boolean; semBotao?: boolean }) {
  const e = useMapa((s) => s.pomodoro)
  const p = useMapa((s) => s.pomodoroPref)
  const setE = useMapa((s) => s.setPomodoro)
  // fica aberto até você comprimir (e continua assim ao trocar de tela ou recarregar)
  const aberto = useMapa((s) => s.pomodoroAberto)
  const setAberto = useMapa((s) => s.setPomodoroAberto)
  // no mapa, um pouco mais à direita para não cobrir os controles do zoom
  const surgir = useSurgir('baixo')
  const f = useFlutuante('posicao-pomodoro', { lado: 'esq', x: telaMapa ? 64 : 20, borda: 'baixo', y: telaMapa ? 16 : 20 })
  const [agora, setAgora] = useAgoraPomodoro(e.rodando)

  const resta = faltam(e, p, agora)

  // fim de fase (também pega o caso de a aba ter ficado fechada e o tempo já ter passado)
  useEffect(() => {
    if (!e.rodando || !e.terminaEm || agora < e.terminaEm) return
    const seguinte = proxima(e, p, Date.now())
    setE(seguinte)
    if (p.som) bipar()
    setAberto(true)
  }, [agora, e, p, setE, setAberto])

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
    <div ref={f.ref} className="fixed z-[35]" style={f.estilo}>
      {/* mode="wait": a janelinha sai antes de o botão entrar, sem os dois juntos na tela */}
      <AnimatePresence initial={false} mode="wait">
        {aberto ? (
          <motion.div
            key="janela"
            {...surgir}
            className="max-h-[70vh] w-[min(20rem,calc(100vw-1rem))] overflow-y-auto rounded-3xl border border-[var(--linha)] bg-[var(--cartao)] p-4 shadow-[0_18px_40px_-16px_rgba(36,34,44,.35)]"
            role="dialog"
            aria-label="pomodoro"
          >
            <div {...f.alca} className="-mx-1 -mt-1 flex items-center justify-between rounded-2xl px-1 py-1" title="arraste para mudar de lugar">
              <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: COR_FASE[e.fase] }}>
                <span className="mr-1 text-[var(--tinta-suave)]" aria-hidden>
                  ⠿
                </span>
                {NOME_FASE[e.fase]}
                {e.fase === 'foco' && (
                  <span className="text-[var(--tinta-suave)]">
                    {' '}
                    · {cicloAtual} de {p.ciclos}
                  </span>
                )}
              </span>
              <button
                className="-mr-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-[var(--tinta-suave)] hover:bg-[var(--papel-2)] hover:text-[var(--tinta-forte)]"
                onClick={() => setAberto(false)}
                title="comprimir: vira só um botão com o tempo"
              >
                <span aria-hidden>↙</span> comprimir
              </button>
            </div>

            <div className="mt-1 text-4xl font-semibold tabular-nums text-[var(--tinta-forte)]">{relogio(resta)}</div>
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
            {!e.rodando && e.fase === 'foco' && e.feitos > 0 && e.restante === null && (
              <p className="mt-3 text-sm text-[var(--tinta)]">A pausa acabou. Pronta para o próximo foco?</p>
            )}

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
              {e.feitos === 0 ? 'Nenhum foco terminado ainda.' : `${e.feitos} ${e.feitos === 1 ? 'foco terminado' : 'focos terminados'}.`} A pausa começa sozinha; o foco espera
              você.
            </p>

            <a className="mt-2 inline-block text-xs text-[var(--foco)] hover:underline" href="#/configuracoes/pomodoro">
              ⚙ ajustar tempos e atividades
            </a>
          </motion.div>
        ) : (
          !semBotao && (
            <motion.button
              key="botao"
              {...surgir}
              {...f.alca}
              title="abrir o pomodoro (arraste para mudar de lugar)"
              onClick={() => setAberto(true)}
              aria-label={`pomodoro${e.rodando ? `, ${NOME_FASE[e.fase]}, faltam ${relogio(resta)}` : ''}`}
              aria-expanded={aberto}
              className="flex items-center gap-2 rounded-full border border-[var(--linha)] bg-[var(--cartao)] px-3.5 py-2.5 text-sm font-medium text-[var(--tinta-forte)] shadow-[0_10px_30px_-12px_rgba(36,34,44,.35)] transition-transform hover:-translate-y-0.5"
            >
              <span>{emPausa ? '☕' : '🍅'}</span>
              {naoComecou ? (
                <span className="hidden sm:inline">pomodoro</span>
              ) : (
                <span className="tabular-nums" style={{ color: e.rodando ? COR_FASE[e.fase] : undefined }}>
                  {relogio(resta)}
                </span>
              )}
              {!e.rodando && !naoComecou && <span className="text-xs text-[var(--tinta-suave)]">⏸</span>}
            </motion.button>
          )
        )}
      </AnimatePresence>
    </div>
  )
}
