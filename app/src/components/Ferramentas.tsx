// Ferramentas de foco dentro do tópico: anotar, revisitar, palavras-chave e cartões.
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CARTOES, type Cartao, type Nota as NotaCartao } from '../content/cartoes'
import { topicoPorId } from '../content/topicos'
import { palavrasDoTopico } from '../content/palavras'
import { faltaQuanto, haQuanto, venceu, voltaEm } from '../lib/revisita'
import { useMapa } from '../store/useMapa'
import { Tex } from './FormulaAnimada'
import { Texto } from './Texto'
import { ListaMarcas } from './Marcas'
import { TesteRelembrar } from './Teste'
import { lembrou as lembrouTeste, questoesPara } from '../lib/teste'

/* ───────────── anotação rápida ───────────── */

/** Folha de anotação do tópico, aberta pelo botão do rodapé. Salva sozinha enquanto você digita. */
const EVENTO_ANOTAR = 'mapa:anotar'
export const abrirAnotacao = () => window.dispatchEvent(new Event(EVENTO_ANOTAR))

/** Botão do rodapé fixo que abre a anotação; mostra se já há nota e quantos trechos você marcou. */
export function BotaoAnotar({ id }: { id: string }) {
  const nota = useMapa((s) => !!s.notas[id]?.texto)
  const marcas = useMapa((s) => s.marcas.filter((m) => m.topico === id).length)
  return (
    <button
      onClick={abrirAnotacao}
      aria-label={nota ? 'abrir minha anotação' : 'anotar sobre este tópico'}
      className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--foco)] px-3.5 py-1.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
    >
      📝 <span className="hidden sm:inline">{nota ? 'minha anotação' : 'anotar'}</span>
      {marcas > 0 && <span className="rounded-full bg-white/25 px-1.5 text-xs">🖍 {marcas}</span>}
      {nota && <span className="h-2 w-2 rounded-full bg-[var(--coral)]" />}
    </button>
  )
}

export function Anotacao({ id }: { id: string }) {
  const nota = useMapa((s) => s.notas[id])
  const salvarNota = useMapa((s) => s.salvarNota)
  const adicionarPostit = useMapa((s) => s.adicionarPostit)
  const todasMarcas = useMapa((s) => s.marcas)
  const marcas = useMemo(() => todasMarcas.filter((m) => m.topico === id), [todasMarcas, id])
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

  // o botão do rodapé fixo abre a anotação por evento
  useEffect(() => {
    const abrir = () => setAberta(true)
    window.addEventListener(EVENTO_ANOTAR, abrir)
    return () => window.removeEventListener(EVENTO_ANOTAR, abrir)
  }, [])

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
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[85dvh] max-w-2xl overflow-y-auto rounded-t-3xl bg-[var(--cartao)] p-5 shadow-[0_-12px_40px_-16px_rgba(36,34,44,.3)]"
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
              {marcas.length > 0 && (
                <div className="mt-5 border-t border-[var(--linha)] pt-4">
                  <div className="mb-2 text-sm font-semibold text-[var(--tinta-forte)]">🖍 Trechos que você marcou aqui</div>
                  <ListaMarcas marcas={marcas} />
                </div>
              )}
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
  const [testando, setTestando] = useState(false)
  // decide uma vez ao abrir; se responder, o aviso vira um agradecimento em vez de sumir de repente
  const [mostrar] = useState(() => venceu(r, intervalos, Date.now()))
  const [quanto] = useState(() => (r ? haQuanto(r, Date.now()) : ''))
  const [temQuestoes] = useState(() => questoesPara(id, 0).some((q) => q.tipo !== 'aberta'))
  if (!mostrar) return null
  const responder = (lembrou: boolean) => {
    revisitar(id, lembrou)
    setResposta(lembrou ? 'lembrou' : 'esqueceu')
  }
  if (testando)
    return (
      <TesteRelembrar
        id={id}
        terminar={(res) => {
          setTestando(false)
          if (res) responder(lembrouTeste(res))
        }}
      />
    )
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-5 rounded-2xl border border-[var(--foco-claro)] bg-[color-mix(in_srgb,var(--foco-claro)_60%,var(--cartao))] px-4 py-3 text-sm"
    >
      {resposta ? (
        <p className="text-[var(--tinta-forte)]">
          {resposta === 'lembrou'
            ? `✓ Boa! A próxima volta é ${faltaQuanto(voltaEm(useMapa.getState().revisitas[id] ?? r!, intervalos), Date.now())}.`
            : `Tudo bem, esquecer faz parte. Relê as camadas com calma; ele volta ${faltaQuanto(voltaEm(useMapa.getState().revisitas[id] ?? r!, intervalos), Date.now())}.`}
        </p>
      ) : (
        <>
          <p className="text-[var(--tinta-forte)]">
            <strong>Hora de relembrar.</strong> {quanto.replace('faz', 'Faz')} que você estudou isto.{' '}
            {temQuestoes ? 'Responda 3 questões sem olhar: acertar 2 conta como lembrei.' : 'Tenta lembrar antes de ler, depois confere na cola.'}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {temQuestoes && (
              <button onClick={() => setTestando(true)} className="botao-foco">
                testar a memória
              </button>
            )}
            <button onClick={irParaCola} className="botao-suave">
              ver a cola ↓
            </button>
            <span className={`flex gap-2 ${temQuestoes ? 'text-xs' : ''}`}>
              <button onClick={() => responder(true)} className="rounded-full bg-[var(--menta-claro)] px-3 py-1 text-[13px] font-medium text-[var(--menta)]">
                ✓ lembrei
              </button>
              <button onClick={() => responder(false)} className="rounded-full bg-[var(--alerta-claro)] px-3 py-1 text-[13px] font-medium text-[var(--alerta)]">
                esqueci um pouco
              </button>
            </span>
          </div>
        </>
      )}
    </motion.div>
  )
}

/* ───────────── palavras-chave ───────────── */

/** As palavras-chave do tópico (na ficha, ou na coluna ao lado do texto em tela larga). */
export function PalavrasChave({ id, cor }: { id: string; cor: string }) {
  const palavras = useMemo(() => palavrasDoTopico(id), [id])
  if (!palavras.length) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {palavras.map((p) => (
        <span
          key={p}
          className="rounded-full px-2.5 py-0.5 text-[13px] font-medium text-[var(--tinta-forte)]"
          style={{ background: `color-mix(in srgb, ${cor} 13%, var(--cartao))`, border: `1px solid color-mix(in srgb, ${cor} 28%, transparent)` }}
        >
          {p}
        </span>
      ))}
    </div>
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
  const darFeedback = useMapa((s) => s.darFeedbackCartao)
  const [i, setI] = useState(0)
  const [virado, setVirado] = useState(false)
  const [lembrou, setLembrou] = useState(0)
  const [escrito, setEscrito] = useState('')
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`mt-3 grid gap-3 border-t border-[var(--linha)] pt-3 ${escrito.trim() ? 'sm:grid-cols-2' : ''}`}>
              {escrito.trim() && (
                <div className="rounded-xl bg-[var(--papel-2)] px-3 py-2.5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--tinta-suave)]">você escreveu</div>
                  <p className="fonte-leitura mt-1 whitespace-pre-line text-[15px] leading-relaxed text-[var(--tinta)]">{escrito}</p>
                </div>
              )}
              <div className="space-y-2 text-[15px] leading-relaxed text-[var(--tinta)]">
                {escrito.trim() && <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--tinta-suave)]">resposta</div>}
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
              </div>
            </motion.div>
          ) : (
            <div className="mt-3">
              <textarea
                value={escrito}
                onChange={(e) => setEscrito(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) setVirado(true)
                }}
                rows={3}
                aria-label="sua resposta"
                placeholder="Escreva a resposta do seu jeito, sem olhar (opcional)."
                className="fonte-leitura w-full resize-y rounded-xl border border-[var(--linha)] bg-[var(--cartao)] px-3 py-2.5 text-[15px] leading-relaxed text-[var(--tinta-forte)] outline-none focus:border-[var(--foco)]"
              />
              <button onClick={() => setVirado(true)} className="mt-2 w-full rounded-xl bg-[var(--papel-2)] py-2.5 text-sm text-[var(--tinta)] hover:bg-[var(--linha)]">
                {escrito.trim() ? 'comparar com a resposta' : 'virar o cartão'} <span className="hidden text-xs text-[var(--tinta-suave)] sm:inline">(Ctrl+Enter)</span>
              </button>
            </div>
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
                // o que você escreveu fica guardado como na revisão (mantém o que você marcou lá)
                if (escrito.trim()) {
                  const ant = useMapa.getState().feedbackCartoes[c.id]
                  darFeedback(c.id, { escrito: escrito.trim(), faltou: ant?.faltou ?? [], dividir: ant?.dividir ?? false, confuso: ant?.confuso ?? false, comentario: ant?.comentario ?? '' })
                }
                if (b.nota === 'acertei') setLembrou((n) => n + 1)
                setEscrito('')
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
