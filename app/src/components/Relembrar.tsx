import { createPortal } from 'react-dom'
// Relembrar: o aviso de "pare e relembre" no meio do estudo e a gaveta com o relógio de cada tópico.
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { topicoPorId } from '../content/topicos'
import { faltaQuanto, haQuanto, voltaEm } from '../lib/revisita'
import { useMapa } from '../store/useMapa'

/** "agora" que anda sozinho a cada `ms`. */
export function useAgora(ms = 30_000) {
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms])
  return agora
}

/** Minutos com a aba visível desde que o componente montou (aba escondida não conta). */
function useMinutosLendo() {
  const [segundos, setSegundos] = useState(0)
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') setSegundos((s) => s + 5)
    }, 5000)
    return () => clearInterval(t)
  }, [])
  return segundos / 60
}

/** Faixa que aparece depois de N minutos lendo: pare e puxe da memória. Use com key={id} para zerar a cada tópico. */
export function AvisoPausa({ irParaLembrar }: { irParaLembrar: () => void }) {
  const limite = useMapa((s) => s.estudo.minutosLembrete)
  const minutos = useMinutosLendo()
  // depois de "agora não", espera mais metade do intervalo; depois de relembrar, mais um intervalo inteiro
  const [adiado, setAdiado] = useState<number | null>(null)
  const proximo = adiado ?? limite
  const setProximo = setAdiado
  const mostrar = minutos >= proximo

  return (
    <AnimatePresence>
      {mostrar && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed inset-x-0 bottom-0 z-30 px-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
        >
          <div className="coluna-leitura mx-auto rounded-2xl border border-[var(--linha)] bg-[var(--cartao)] p-4 shadow-[0_12px_40px_-12px_rgba(36,34,44,.35)]">
            <p className="text-[var(--tinta-forte)]">
              <strong>⏱ {Math.round(minutos) === 1 ? "1 minuto" : `${Math.round(minutos)} minutos`} aqui.</strong> Pare um pouco e tente lembrar o que leu, sem olhar. Dois minutos bastam.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="botao-foco"
                onClick={() => {
                  setProximo(minutos + limite)
                  irParaLembrar()
                }}
              >
                relembrar agora
              </button>
              <button className="botao-suave" onClick={() => setProximo(minutos + Math.max(5, Math.round(limite / 2)))}>
                agora não, me avisa em {Math.max(5, Math.round(limite / 2))} min
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Gaveta lateral: cada tópico estudado e quanto falta para relembrar. */
function GavetaRelembrar({ aberto, fechar }: { aberto: boolean; fechar: () => void }) {
  const revisitas = useMapa((s) => s.revisitas)
  const intervalos = useMapa((s) => s.estudo.intervalos)
  const selecionar = useMapa((s) => s.selecionar)
  const agora = useAgora(aberto ? 15_000 : 60_000)

  useEffect(() => {
    if (!aberto) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && fechar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [aberto, fechar])

  const lista = Object.entries(revisitas)
    .filter(([id]) => topicoPorId.has(id))
    .map(([id, r]) => ({ id, r, alvo: voltaEm(r, intervalos) }))
    .sort((a, b) => a.alvo - b.alvo)
  const vencidos = lista.filter((x) => x.alvo <= agora)
  const futuros = lista.filter((x) => x.alvo > agora)

  const Item = ({ id, r, alvo }: (typeof lista)[number]) => (
    <li>
      <button
        onClick={() => {
          fechar()
          selecionar(id)
        }}
        className="flex w-full items-baseline gap-3 rounded-xl px-3 py-2 text-left hover:bg-[var(--papel-2)]"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[var(--tinta-forte)]">{topicoPorId.get(id)!.titulo}</span>
          <span className="text-xs text-[var(--tinta-suave)]">
            {haQuanto(r, agora)} · volta {r.n + 1} de {intervalos.length}
          </span>
        </span>
        <span className={`shrink-0 text-sm font-medium ${alvo <= agora ? 'text-[var(--coral)]' : 'text-[var(--tinta-suave)]'}`}>{faltaQuanto(alvo, agora)}</span>
      </button>
    </li>
  )

  return createPortal(
    <AnimatePresence>
      {aberto && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-[rgba(36,34,44,.25)]" onClick={fechar} />
          <motion.aside
            role="dialog"
            aria-label="Quando relembrar cada tópico"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col overflow-y-auto bg-[var(--cartao)] shadow-[-12px_0_40px_-16px_rgba(36,34,44,.3)]"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="flex items-center justify-between border-b border-[var(--linha)] px-5 py-3">
              <h2 className="font-semibold text-[var(--tinta-forte)]">⏱ Relembrar</h2>
              <button className="botao-suave" onClick={fechar}>
                fechar
              </button>
            </div>
            <div className="px-3 py-4">
              {!lista.length && <p className="px-2 text-sm text-[var(--tinta-suave)]">Nenhum tópico ainda. Depois que você ler um tópico, ele aparece aqui com o relógio para a próxima volta.</p>}
              {vencidos.length > 0 && (
                <>
                  <div className="rotulo-formula px-3">hora de relembrar</div>
                  <ul className="mt-1">{vencidos.map((x) => <Item key={x.id} {...x} />)}</ul>
                </>
              )}
              {futuros.length > 0 && (
                <>
                  <div className="rotulo-formula mt-4 px-3">próximos</div>
                  <ul className="mt-1">{futuros.map((x) => <Item key={x.id} {...x} />)}</ul>
                </>
              )}
              <p className="mt-6 px-3 text-xs text-[var(--tinta-suave)]">Os intervalos mudam no painel Aa. Cada "lembrei" leva o tópico para a próxima volta; "esqueci" recomeça.</p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export function BotaoRelembrar() {
  const [aberto, setAberto] = useState(false)
  const revisitas = useMapa((s) => s.revisitas)
  const intervalos = useMapa((s) => s.estudo.intervalos)
  const agora = useAgora(60_000)
  const vencidos = Object.entries(revisitas).filter(([id, r]) => topicoPorId.has(id) && voltaEm(r, intervalos) <= agora).length
  return (
    <>
      <button className="botao-suave relative" onClick={() => setAberto(true)} title="quando relembrar cada tópico" aria-label={`relembrar${vencidos ? `, ${vencidos} para agora` : ''}`}>
        ⏱
        {vencidos > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--coral)] px-1 text-[11px] font-semibold text-white">{vencidos}</span>
        )}
      </button>
      <GavetaRelembrar aberto={aberto} fechar={() => setAberto(false)} />
    </>
  )
}
