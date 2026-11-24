// Ferramentas de foco dentro do tópico: anotar, revisitar, palavras-chave e cartões.
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CARTOES, type Cartao, type Nota as NotaCartao } from '../content/cartoes'
import { topicoPorId } from '../content/topicos'
import { palavrasDoTopico } from '../content/palavras'
import { faltaQuanto, haQuanto, venceu, voltaEm } from '../lib/revisita'
import { useMapa } from '../store/useMapa'
import { Tex } from './FormulaAnimada'
import { Texto } from './Texto'

/* ───────────── anotação rápida ───────────── */

/** Botão flutuante que abre uma folha de anotação. Salva sozinho enquanto você digita. */
export function Anotacao({ id }: { id: string }) {
  const nota = useMapa((s) => s.notas[id])
  const salvarNota = useMapa((s) => s.salvarNota)
  const adicionarPostit = useMapa((s) => s.adicionarPostit)
  const [aberta, setAberta] = useState(false)
  const [texto, setTexto] = useState(nota?.texto ?? '')
  const [levou, setLevou] = useState(false)
  const campo = useRef<HTMLTextAreaElement>(null)

  // salva 400 ms depois da última tecla
  useEffect(() => {
    if (texto === (nota?.texto ?? '')) return
    const t = setTimeout(() => salvarNota(id, texto), 400)
    return () => clearTimeout(t)
  }, [texto, nota, id, salvarNota])

  useEffect(() => {
    if (!aberta) return
    campo.current?.focus()
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberta(false)
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [aberta])

  const fechar = () => {
    salvarNota(id, texto)
    setAberta(false)
  }

  return (
    <>
      <button
        hidden={aberta}
        onClick={() => setAberta(true)}
        aria-label={nota ? 'abrir minha anotação' : 'anotar'}
        className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-[var(--cartao)] px-4 py-3 text-sm font-medium text-[var(--tinta-forte)] shadow-[0_10px_30px_-12px_rgba(36,34,44,.35)] transition-transform hover:-translate-y-0.5"
        style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        📝 <span className="hidden sm:inline">{nota ? 'minha anotação' : 'anotar'}</span>
        {nota && <span className="h-2 w-2 rounded-full bg-[var(--coral)]" />}
      </button>

      <AnimatePresence>
        {aberta && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={fechar} className="fixed inset-0 z-40 bg-[rgba(36,34,44,.18)]" />
            <motion.div
              role="dialog"
              aria-label="Anotação do tópico"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-2xl rounded-t-3xl bg-[var(--cartao)] p-5 shadow-[0_-12px_40px_-16px_rgba(36,34,44,.3)]"
              style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-semibold text-[var(--tinta-forte)]">📝 Sua anotação</span>
                <span className="text-xs text-[var(--tinta-suave)]">{texto === (nota?.texto ?? '') ? (nota ? 'salvo' : '') : 'salvando…'}</span>
                <button onClick={fechar} className="botao-suave ml-auto">
                  fechar
                </button>
              </div>
              <textarea
                ref={campo}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={7}
                placeholder="Escreve do seu jeito: o que entendeu, o que ficou confuso, um exemplo seu…"
                className="fonte-leitura w-full resize-y rounded-2xl border border-[var(--linha)] bg-[var(--papel)] p-3 text-[var(--tinta-forte)] outline-none focus:border-[var(--foco)]"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--tinta-suave)]">
                <span>Fica só neste navegador.</span>
                <button
                  disabled={!texto.trim() || levou}
                  onClick={() => {
                    adicionarPostit({ x: 40 + Math.random() * 200, y: 40 + Math.random() * 160, texto: texto.trim(), cor: 'sol', topico: id })
                    setLevou(true)
                  }}
                  className="botao-suave ml-auto disabled:opacity-50"
                >
                  {levou ? '✓ está no quadro' : '💭 levar para o quadro'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

/* ───────────── revisita ───────────── */

/** Aparece no topo quando um tópico estudado "venceu": uma olhada rápida segura a memória. */
export function AvisoRevisita({ id, irParaCola }: { id: string; irParaCola: () => void }) {
  const r = useMapa((s) => s.revisitas[id])
  const intervalos = useMapa((s) => s.estudo.intervalos)
  const revisitar = useMapa((s) => s.revisitar)
  const [resposta, setResposta] = useState<'lembrou' | 'esqueceu' | null>(null)
  // decide uma vez ao abrir; se responder, o aviso vira um agradecimento em vez de sumir de repente
  const [mostrar] = useState(() => venceu(r, intervalos, Date.now()))
  const [quanto] = useState(() => (r ? haQuanto(r, Date.now()) : ''))
  if (!mostrar) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-5 rounded-2xl border border-[var(--foco-claro)] bg-[color-mix(in_srgb,var(--foco-claro)_60%,var(--cartao))] px-4 py-3 text-sm"
    >
      {resposta ? (
        <p className="text-[var(--tinta-forte)]">
          {resposta === 'lembrou'
            ? `✓ Boa! A próxima volta é ${faltaQuanto(voltaEm(r!, intervalos), Date.now())}.`
            : `Tudo bem, esquecer faz parte. Relê as camadas com calma; ele volta ${faltaQuanto(voltaEm(r!, intervalos), Date.now())}.`}
        </p>
      ) : (
        <>
          <p className="text-[var(--tinta-forte)]">
            <strong>Hora de relembrar.</strong> {quanto.replace('faz', 'Faz')} que você estudou isto. Tenta lembrar antes de ler, depois confere na cola.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={irParaCola} className="botao-suave">
              ver a cola ↓
            </button>
            <button
              onClick={() => {
                revisitar(id, true)
                setResposta('lembrou')
              }}
              className="rounded-full bg-[var(--menta-claro)] px-3 py-1 text-[13px] font-medium text-[var(--menta)]"
            >
              ✓ lembrei
            </button>
            <button
              onClick={() => {
                revisitar(id, false)
                setResposta('esqueceu')
              }}
              className="rounded-full bg-[var(--alerta-claro)] px-3 py-1 text-[13px] font-medium text-[var(--alerta)]"
            >
              esqueci um pouco
            </button>
          </div>
        </>
      )}
    </motion.div>
  )
}

/* ───────────── palavras-chave flutuantes ───────────── */

// posições fixas (em % da altura da tela) para as palavras não pularem a cada render
const ALTURAS = [16, 30, 44, 58, 72, 86, 23]

/**
 * Palavras-chave do tópico flutuando devagar nas margens (telas largas)
 * ou numa faixa embaixo do título (telas estreitas). Dá para desligar.
 */
export function PalavrasFlutuantes({ id, cor }: { id: string; cor: string }) {
  const ligadas = useMapa((s) => s.palavrasFlutuantes)
  const palavras = useMemo(() => palavrasDoTopico(id), [id])
  const calmo = useMapa((s) => s.leitura.calmo)
  const parado = useReducedMotion() || calmo
  if (!ligadas || !palavras.length) return null

  const balao = (p: string, i: number, extra = '') => (
    <motion.span
      key={p}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={parado ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1, y: [0, -7, 0, 5, 0], x: [0, 3, 0, -3, 0] }}
      transition={
        parado
          ? { duration: 0.3 }
          : { opacity: { duration: 0.6, delay: 0.1 * i }, scale: { duration: 0.6, delay: 0.1 * i }, y: { duration: 7 + (i % 3) * 1.7, repeat: Infinity, ease: 'easeInOut' }, x: { duration: 9 + (i % 4), repeat: Infinity, ease: 'easeInOut' } }
      }
      className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-medium ${extra}`}
      style={{ background: `color-mix(in srgb, ${cor} 13%, var(--cartao))`, color: 'var(--tinta-forte)', border: `1px solid color-mix(in srgb, ${cor} 28%, transparent)` }}
    >
      {p}
    </motion.span>
  )

  return (
    <>
      {/* faixa sob o título (telas até ~1180px) */}
      <div className="mt-4 flex flex-wrap gap-2 xl:hidden" aria-label="palavras-chave">
        {palavras.map((p, i) => balao(p, i))}
      </div>
      {/* margens (telas largas): metade de cada lado, fora da coluna de leitura */}
      <div aria-hidden className="pointer-events-none fixed inset-y-0 left-0 right-0 z-0 hidden xl:block">
        {palavras.map((p, i) => {
          const esquerda = i % 2 === 0
          return (
            <div
              key={p}
              className="absolute"
              style={{
                top: `${ALTURAS[i % ALTURAS.length]}%`,
                ...(esquerda ? { right: `calc(50% + var(--leitura-largura, 42rem) / 2 + ${24 + (i % 3) * 22}px)` } : { left: `calc(50% + var(--leitura-largura, 42rem) / 2 + ${24 + (i % 3) * 22}px)` }),
              }}
            >
              {balao(p, i, 'shadow-[var(--sombra)]')}
            </div>
          )
        })}
      </div>
    </>
  )
}

/** Botão do cabeçalho para ligar/desligar as palavras flutuantes. */
export function AlternarPalavras() {
  const ligadas = useMapa((s) => s.palavrasFlutuantes)
  const alternar = useMapa((s) => s.alternarPalavras)
  return (
    <button onClick={alternar} aria-pressed={ligadas} title={ligadas ? 'esconder palavras-chave' : 'mostrar palavras-chave'} className={`botao-suave ${ligadas ? '' : 'opacity-60'}`}>
      ✦ <span className="hidden sm:inline">palavras</span>
    </button>
  )
}

/* ───────────── cartões do tópico ───────────── */

const BOTOES: { nota: NotaCartao; rotulo: string; estilo: React.CSSProperties }[] = [
  { nota: 'errei', rotulo: 'não lembrei', estilo: { background: 'var(--alerta-claro)', color: 'var(--alerta)' } },
  { nota: 'dificil', rotulo: 'mais ou menos', estilo: { background: 'color-mix(in srgb, var(--sol) 30%, var(--cartao))', color: 'var(--tinta-forte)' } },
  { nota: 'acertei', rotulo: 'lembrei!', estilo: { background: 'var(--menta-claro)', color: 'var(--menta)' } },
]

/** Os cartões deste tópico, um de cada vez. As respostas entram na mesma fila da revisão geral. */
export function CartoesDoTopico({ id, lista }: { id: string; lista?: Cartao[] }) {
  const cartoes = useMemo(() => lista ?? CARTOES.filter((c) => c.topico === id), [id, lista])
  const responderCartao = useMapa((s) => s.responderCartao)
  const [i, setI] = useState(0)
  const [virado, setVirado] = useState(false)
  const [lembrou, setLembrou] = useState(0)
  if (!cartoes.length) return null
  const c = cartoes[i]

  if (!c)
    return (
      <div className="text-center">
        <p className="text-[var(--tinta-forte)]">
          {lembrou === cartoes.length ? '🎉 Lembrou de todos.' : `Lembrou de ${lembrou} de ${cartoes.length}.`} Eles voltam na revisão de cartões no tempo certo.
        </p>
        <button
          className="botao-suave mt-3"
          onClick={() => {
            setI(0)
            setLembrou(0)
          }}
        >
          passar de novo
        </button>
      </div>
    )

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-[var(--tinta-suave)]">
        <span>Tenta responder de cabeça antes de virar.</span>
        <span>
          {i + 1} de {cartoes.length}
        </span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={c.id}
          initial={{ opacity: 0, rotateX: -12 }}
          animate={{ opacity: 1, rotateX: 0 }}
          exit={{ opacity: 0, rotateX: 12 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl border border-[var(--linha)] bg-[var(--papel)] p-4"
        >
          {c.topico !== id && <div className="mb-1 text-xs text-[var(--tinta-suave)]">de {topicoPorId.get(c.topico)?.titulo}</div>}
          <p className="fonte-leitura font-medium text-[var(--tinta-forte)]">
            <Texto>{c.pergunta}</Texto>
          </p>
          {virado ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-2 border-t border-[var(--linha)] pt-3 text-[15px] leading-relaxed text-[var(--tinta)]">
              {c.latex && (
                <div className="overflow-x-auto text-lg">
                  <Tex latex={c.latex} display />
                </div>
              )}
              {c.resposta.split('\n\n').map((par, k) => (
                <p key={k}>
                  <Texto>{par}</Texto>
                </p>
              ))}
            </motion.div>
          ) : (
            <button onClick={() => setVirado(true)} className="mt-3 w-full rounded-xl bg-[var(--papel-2)] py-2.5 text-sm text-[var(--tinta)] hover:bg-[var(--linha)]">
              virar o cartão
            </button>
          )}
        </motion.div>
      </AnimatePresence>
      {virado && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {BOTOES.map((b) => (
            <button
              key={b.nota}
              style={b.estilo}
              className="rounded-xl py-2 text-sm font-medium hover:brightness-95"
              onClick={() => {
                responderCartao(c.id, b.nota, Date.now())
                if (b.nota === 'acertei') setLembrou((n) => n + 1)
                setVirado(false)
                setI((n) => n + 1)
              }}
            >
              {b.rotulo}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export const temCartoes = (id: string) => CARTOES.some((c) => c.topico === id)
