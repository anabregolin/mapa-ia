// Quadro de brainstorm: post-its soltos que você arrasta, mais a lista de anotações por tópico.
import { AnimatePresence, motion, useDragControls, useMotionValue } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { topicoPorId } from '../content/topicos'
import { unidade } from '../lib/trilha'
import { useMapa, type CorPostit, type Postit } from '../store/useMapa'

const LARGURA = 1800
const ALTURA = 1200
const TAM = 200

const CORES: Record<CorPostit, { fundo: string; nome: string }> = {
  sol: { fundo: 'color-mix(in srgb, var(--sol) 38%, white)', nome: 'amarelo' },
  menta: { fundo: 'var(--menta-claro)', nome: 'verde' },
  foco: { fundo: 'var(--foco-claro)', nome: 'lilás' },
  coral: { fundo: 'color-mix(in srgb, var(--coral) 28%, white)', nome: 'coral' },
  papel: { fundo: 'var(--cartao)', nome: 'branco' },
}
const ORDEM_CORES = Object.keys(CORES) as CorPostit[]

function Nota({ p, apagar, novo }: { p: Postit; apagar: (p: Postit) => void; novo: boolean }) {
  const atualizar = useMapa((s) => s.atualizarPostit)
  const selecionar = useMapa((s) => s.selecionar)
  const controles = useDragControls()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const [texto, setTexto] = useState(p.texto)
  const campo = useRef<HTMLTextAreaElement>(null)
  const tp = p.topico ? topicoPorId.get(p.topico) : undefined

  useEffect(() => {
    if (novo) campo.current?.focus()
  }, [novo])

  // salva o texto com um respiro
  useEffect(() => {
    if (texto === p.texto) return
    const t = setTimeout(() => atualizar(p.id, { texto }), 400)
    return () => clearTimeout(t)
  }, [texto, p.texto, p.id, atualizar])

  const proximaCor = () => atualizar(p.id, { cor: ORDEM_CORES[(ORDEM_CORES.indexOf(p.cor) + 1) % ORDEM_CORES.length] })

  return (
    <motion.div
      drag
      dragControls={controles}
      dragListener={false}
      dragMomentum={false}
      dragConstraints={{ left: -p.x, top: -p.y, right: LARGURA - TAM - p.x, bottom: ALTURA - TAM - p.y }}
      dragElastic={0}
      onDragEnd={() => {
        atualizar(p.id, { x: Math.round(p.x + x.get()), y: Math.round(p.y + y.get()) })
        x.set(0)
        y.set(0)
      }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      whileDrag={{ scale: 1.04, rotate: -1.5, zIndex: 10 }}
      className="absolute flex flex-col rounded-2xl shadow-[0_10px_24px_-14px_rgba(36,34,44,.45)]"
      style={{ left: p.x, top: p.y, width: TAM, minHeight: TAM, x, y, background: CORES[p.cor].fundo }}
    >
      {/* alça: só ela arrasta, assim dá para selecionar texto */}
      <div onPointerDown={(e) => controles.start(e)} className="flex cursor-grab touch-none items-center gap-1 px-2 pt-1.5 active:cursor-grabbing" title="arrastar">
        <span className="flex-1 select-none text-center text-[var(--tinta-suave)]">⋯</span>
        <button onPointerDown={(e) => e.stopPropagation()} onClick={proximaCor} aria-label={`cor: ${CORES[p.cor].nome}, trocar`} className="h-6 w-6 rounded-full text-xs hover:bg-black/5">
          ◐
        </button>
        <button onPointerDown={(e) => e.stopPropagation()} onClick={() => apagar(p)} aria-label="apagar" className="h-6 w-6 rounded-full text-sm text-[var(--tinta-suave)] hover:bg-black/5">
          ×
        </button>
      </div>
      <textarea
        ref={campo}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={() => texto !== p.texto && atualizar(p.id, { texto })}
        placeholder="uma ideia…"
        aria-label="texto do post-it"
        className="flex-1 resize-none bg-transparent px-3 pb-2 text-[15px] leading-snug text-[var(--tinta-forte)] outline-none placeholder:text-[var(--tinta-suave)]"
      />
      {tp && (
        <button onClick={() => selecionar(tp.id)} className="mx-2 mb-2 truncate rounded-full bg-white/60 px-2 py-0.5 text-left text-[11px] text-[var(--tinta)] hover:bg-white">
          <span style={{ color: unidade(tp.unidade).cor }}>●</span> {tp.titulo}
        </button>
      )}
    </motion.div>
  )
}

function Anotacoes() {
  const notas = useMapa((s) => s.notas)
  const selecionar = useMapa((s) => s.selecionar)
  const lista = Object.entries(notas)
    .filter(([id]) => topicoPorId.has(id))
    .sort((a, b) => b[1].em - a[1].em)
  if (!lista.length)
    return (
      <p className="mt-8 rounded-3xl bg-[var(--cartao)] p-6 text-center text-[var(--tinta-suave)] shadow-[var(--sombra)]">
        Nenhuma anotação ainda. Dentro de qualquer tópico, o botão 📝 no canto abre um espaço para escrever.
      </p>
    )
  return (
    <ul className="mt-6 space-y-3">
      {lista.map(([id, n]) => {
        const tp = topicoPorId.get(id)!
        return (
          <li key={id}>
            <button onClick={() => selecionar(id)} className="w-full rounded-2xl bg-[var(--cartao)] p-4 text-left shadow-[var(--sombra)] transition-transform hover:-translate-y-0.5">
              <div className="flex items-center gap-2 text-xs text-[var(--tinta-suave)]">
                <span style={{ color: unidade(tp.unidade).cor }}>●</span>
                <span className="font-medium text-[var(--tinta-forte)]">{tp.titulo}</span>
                <span className="ml-auto">{new Date(n.em).toLocaleDateString('pt-BR')}</span>
              </div>
              <p className="mt-1.5 line-clamp-4 whitespace-pre-wrap text-sm text-[var(--tinta)]">{n.texto}</p>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export function TelaQuadro() {
  const quadro = useMapa((s) => s.quadro)
  const adicionar = useMapa((s) => s.adicionarPostit)
  const remover = useMapa((s) => s.removerPostit)
  const restaurar = useMapa((s) => s.restaurarPostit)
  const nNotas = useMapa((s) => Object.keys(s.notas).length)
  const [aba, setAba] = useState<'quadro' | 'notas'>('quadro')
  const [apagado, setApagado] = useState<Postit | null>(null)
  const [novo, setNovo] = useState<string | null>(null)
  const area = useRef<HTMLDivElement>(null)

  // o "desfazer" some depois de 6 s
  useEffect(() => {
    if (!apagado) return
    const t = setTimeout(() => setApagado(null), 6000)
    return () => clearTimeout(t)
  }, [apagado])

  const nova = () => {
    // aparece no meio do que está visível, com um leve desvio para não empilhar
    const el = area.current
    const cx = el ? el.scrollLeft + el.clientWidth / 2 - TAM / 2 : 60
    const cy = el ? el.scrollTop + el.clientHeight / 2 - TAM / 2 : 60
    const d = (quadro.length % 5) * 18
    const id = adicionar({ x: Math.max(8, Math.min(LARGURA - TAM, cx + d)), y: Math.max(8, Math.min(ALTURA - TAM, cy + d)), texto: '', cor: ORDEM_CORES[quadro.length % ORDEM_CORES.length] })
    setNovo(id)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-dvh flex-col bg-[var(--papel)]">
      <header className="border-b border-[var(--linha)] bg-[var(--papel)]" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-2.5 sm:px-6">
          <a href="#/" className="botao-suave">
            ← trilha
          </a>
          <h1 className="mr-auto text-base font-semibold text-[var(--tinta-forte)]">Quadro de ideias</h1>
          <div role="tablist" className="flex rounded-full bg-[var(--papel-2)] p-0.5 text-[13px]">
            {(['quadro', 'notas'] as const).map((a) => (
              <button
                key={a}
                role="tab"
                aria-selected={aba === a}
                onClick={() => setAba(a)}
                className={`rounded-full px-3 py-1 ${aba === a ? 'bg-[var(--cartao)] font-medium text-[var(--tinta-forte)] shadow-[var(--sombra)]' : 'text-[var(--tinta-suave)]'}`}
              >
                {a === 'quadro' ? `💭 post-its (${quadro.length})` : `📝 anotações (${nNotas})`}
              </button>
            ))}
          </div>
          {aba === 'quadro' && (
            <button className="botao-foco !py-1.5 text-sm" onClick={nova}>
              + ideia
            </button>
          )}
        </div>
      </header>

      {aba === 'quadro' ? (
        <div ref={area} className="relative flex-1 overflow-auto">
          <div
            className="relative"
            style={{ width: LARGURA, height: ALTURA, backgroundImage: 'radial-gradient(var(--linha) 1.2px, transparent 1.2px)', backgroundSize: '24px 24px' }}
          >
            {quadro.length === 0 && (
              <div className="absolute left-6 top-6 max-w-xs rounded-2xl bg-[var(--cartao)] p-4 text-sm text-[var(--tinta-suave)] shadow-[var(--sombra)]">
                Despeja aqui tudo o que vier na cabeça, sem ordem. Depois arrasta pela alça <strong>⋯</strong> para agrupar o que combina. ◐ troca a cor.
              </div>
            )}
            <AnimatePresence>
              {quadro.map((p) => (
                <Nota
                  key={p.id}
                  p={p}
                  novo={p.id === novo}
                  apagar={(q) => {
                    remover(q.id)
                    setApagado(q)
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-2xl px-4 pb-16 sm:px-6">
            <Anotacoes />
          </div>
        </div>
      )}

      <AnimatePresence>
        {apagado && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="fixed inset-x-0 bottom-5 z-40 mx-auto flex w-fit items-center gap-3 rounded-full bg-[var(--tinta-forte)] px-4 py-2 text-sm text-white shadow-lg"
            style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            post-it apagado
            <button
              className="font-semibold text-[var(--sol)]"
              onClick={() => {
                restaurar(apagado)
                setApagado(null)
              }}
            >
              desfazer
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
