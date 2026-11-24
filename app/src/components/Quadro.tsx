// Quadro de brainstorm: post-its soltos que você arrasta, mais a lista de anotações por tópico.
import { AnimatePresence, motion, useDragControls, useMotionValue } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { topicoPorId } from '../content/topicos'
import { voltarDasPaginas } from '../lib/paineis'
import { unidade } from '../lib/trilha'
import { TINTA, type IdCor, type Marca } from '../lib/marcas'
import { ListaMarcas, useRotuloTag } from './Marcas'
import { useMapa, type CorPostit, type Postit } from '../store/useMapa'
import { LinkAjuda } from './LinkAjuda'

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

type Filtro = 'tudo' | 'notas' | 'postits' | 'arquivadas' | IdCor | `tag:${string}`

const passa = (f: Filtro, m: { cor: IdCor; tags?: string[] }) => f === 'tudo' || f === m.cor || (f.startsWith('tag:') && !!m.tags?.includes(f.slice(4)))

/** post-its no meio das anotações: só leitura (edita-se no quadro ou no caderno) */
function PostitsLidos({ ps }: { ps: Postit[] }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {ps.map((p) => (
        <div key={p.id} className="whitespace-pre-wrap rounded-xl p-3 text-sm leading-snug text-[var(--tinta-forte)] shadow-[var(--sombra)]" style={{ background: CORES[p.cor].fundo }}>
          {p.texto}
        </div>
      ))}
    </div>
  )
}

/** O "desfazer" que aparece embaixo depois de apagar algo. */
type Desfazer = { texto: string; fazer: () => void }

function AvisoDesfazer({ aviso, limpar }: { aviso: Desfazer | null; limpar: () => void }) {
  // some depois de 6 s
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(limpar, 6000)
    return () => clearTimeout(t)
  }, [aviso, limpar])
  return (
    <AnimatePresence>
      {aviso && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          role="status"
          className="fixed inset-x-0 bottom-5 z-40 mx-auto flex w-fit items-center gap-3 rounded-full bg-[var(--tinta-forte)] px-4 py-2 text-sm text-white shadow-lg"
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {aviso.texto}
          <button
            className="font-semibold text-[var(--sol)]"
            onClick={() => {
              aviso.fazer()
              limpar()
            }}
          >
            desfazer
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const botaoAcao = 'rounded-full px-2.5 py-1 text-xs text-[var(--tinta-suave)] transition-colors hover:bg-[var(--papel-2)] hover:text-[var(--tinta-forte)]'

const PARTES = [
  { href: '#/anotacoes', id: 'tudo', icone: '📋', nome: 'Tudo por tópico' },
  { href: '#/quadro', id: 'quadro', icone: '💭', nome: 'Quadro' },
  { href: '#/caderno', id: 'caderno', icone: '📓', nome: 'Caderno' },
] as const

/** As abas da página de anotações. O caderno é uma tela própria (com páginas), mas mostra as mesmas abas. */
export function AbasAnotacoes({ atual }: { atual: (typeof PARTES)[number]['id'] }) {
  return (
    <nav className="flex gap-1 overflow-x-auto" aria-label="partes das anotações">
      {PARTES.map((a) => (
        <a
          key={a.id}
          href={a.href}
          aria-current={atual === a.id ? 'page' : undefined}
          className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-sm transition-colors ${atual === a.id ? 'border-[var(--foco)] font-medium text-[var(--tinta-forte)]' : 'border-transparent text-[var(--tinta-suave)] hover:text-[var(--tinta)]'}`}
        >
          {a.icone} {a.nome.toLowerCase()}
        </a>
      ))}
    </nav>
  )
}

/** Barra fina do topo, igual à da revisão: só o caminho de volta (e o que for próprio da tela). */
function BarraTopo({ onde, children }: { onde: string; children?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-20 border-b border-[var(--linha)] bg-[var(--papel)]/90 backdrop-blur" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-5 py-2.5 sm:px-8">
        <button className="botao-suave shrink-0" onClick={voltarDasPaginas} title="Esc também volta">
          ← voltar
        </button>
        <span className="mr-auto truncate text-sm font-medium text-[var(--tinta-suave)]">
          Anotações <span aria-hidden>·</span> {onde}
        </span>
        {children}
      </div>
    </div>
  )
}

/** Página de anotações (tudo por tópico), no mesmo desenho da revisão: topo com o resumo, filtros ao lado, lista no meio. */
function PaginaAnotacoes() {
  const notas = useMapa((s) => s.notas)
  const marcas = useMapa((s) => s.marcas)
  const quadro = useMapa((s) => s.quadro)
  const cores = useMapa((s) => s.coresMarca)
  const selecionar = useMapa((s) => s.selecionar)
  const salvarNota = useMapa((s) => s.salvarNota)
  const arquivarNota = useMapa((s) => s.arquivarNota)
  const restaurarNota = useMapa((s) => s.restaurarNota)
  const atualizarMarca = useMapa((s) => s.atualizarMarca)
  const removerMarca = useMapa((s) => s.removerMarca)
  const restaurarMarca = useMapa((s) => s.restaurarMarca)
  const rotuloTag = useRotuloTag()
  const [filtro, setFiltro] = useState<Filtro>('tudo')
  const [aviso, setAviso] = useState<Desfazer | null>(null)
  const limparAviso = useCallback(() => setAviso(null), [])

  const arquivadas = filtro === 'arquivadas'
  const todasNotas = Object.entries(notas).filter(([id, n]) => n.texto.trim() && topicoPorId.has(id))
  const notasAtivas = todasNotas.filter(([, n]) => !n.arquivada)
  const marcasAtivas = marcas.filter((m) => !m.arquivada)
  const nArquivadas = todasNotas.length - notasAtivas.length + marcas.length - marcasAtivas.length
  const postits = quadro.filter((p) => p.texto.trim())

  // tags em uso, mais usadas primeiro
  const usoTags = new Map<string, number>()
  for (const m of marcasAtivas) for (const t of m.tags ?? []) usoTags.set(t, (usoTags.get(t) ?? 0) + 1)
  const tagsEmUso = [...usoTags].sort((a, b) => b[1] - a[1])

  const mostraPostits = filtro === 'tudo' || filtro === 'postits'
  const soltos = mostraPostits ? postits.filter((p) => !p.topico || !topicoPorId.has(p.topico)) : []
  const ids = new Set([...todasNotas.map(([id]) => id), ...marcas.map((m) => m.topico), ...postits.map((p) => p.topico ?? '')].filter((id) => topicoPorId.has(id)))
  const grupos = [...ids]
    .map((id) => {
      const n = notas[id]?.texto.trim() && !!notas[id].arquivada === arquivadas ? notas[id] : undefined
      const nota = filtro === 'tudo' || filtro === 'notas' || arquivadas ? n : undefined
      const ms = filtro === 'postits' || filtro === 'notas' ? [] : marcas.filter((m) => m.topico === id && !!m.arquivada === arquivadas && (arquivadas || passa(filtro, m))).sort((a, b) => a.em - b.em)
      const ps = mostraPostits ? postits.filter((p) => p.topico === id) : []
      // post-it não guarda data: um grupo só com post-its vai para o fim
      const recente = Math.max(nota?.em ?? 0, ...ms.map((m) => m.em))
      return { id, nota, ms, ps, recente }
    })
    .filter((g) => g.nota || g.ms.length || g.ps.length)
    .sort((a, b) => b.recente - a.recente)

  const apagarNota = (id: string) => {
    const n = notas[id]
    if (!n) return
    salvarNota(id, '')
    setAviso({ texto: 'anotação apagada', fazer: () => restaurarNota(id, n) })
  }
  const acoesMarca = (m: Marca) => (
    <>
      <button className={botaoAcao} onClick={() => atualizarMarca(m.id, { arquivada: m.arquivada ? undefined : true })} title={m.arquivada ? 'volta para a lista' : 'sai da lista; o grifo continua no texto'}>
        {m.arquivada ? '↩ desarquivar' : '🗄 arquivar'}
      </button>
      <button
        className={botaoAcao}
        onClick={() => {
          removerMarca(m.id)
          setAviso({ texto: 'marca apagada', fazer: () => restaurarMarca(m) })
        }}
        title="apaga o grifo e a nota dele"
      >
        🗑 apagar
      </button>
    </>
  )

  const total = notasAtivas.length + marcasAtivas.length + postits.length
  const resumo = [
    notasAtivas.length && `${notasAtivas.length} ${notasAtivas.length === 1 ? 'anotação' : 'anotações'}`,
    marcasAtivas.length && `${marcasAtivas.length} ${marcasAtivas.length === 1 ? 'trecho marcado' : 'trechos marcados'}`,
    postits.length && `${postits.length} post-it${postits.length === 1 ? '' : 's'}`,
  ].filter(Boolean)

  const botaoFiltro = 'flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors'
  const inativo = 'bg-[var(--cartao)] text-[var(--tinta)] ring-1 ring-[var(--linha)] hover:ring-[var(--tinta-suave)] lg:bg-transparent lg:ring-0 lg:hover:bg-[var(--papel-2)]'
  const opcao = (f: Filtro, icone: React.ReactNode, rotulo: string, n: number) => (
    <button key={f} role="tab" aria-selected={filtro === f} onClick={() => setFiltro(f)} className={`${botaoFiltro} ${filtro === f ? 'bg-[var(--foco)] font-medium text-white shadow-[var(--sombra)]' : inativo}`}>
      <span aria-hidden className="shrink-0">
        {icone}
      </span>
      <span className="min-w-0 truncate leading-tight">{rotulo}</span>
      <span className={`ml-auto text-xs tabular-nums ${filtro === f ? 'opacity-75' : 'text-[var(--tinta-suave)]'}`}>{n}</span>
    </button>
  )
  const bolinha = (c: IdCor) => <span className="inline-block h-3 w-3 rounded-full align-middle" style={{ background: TINTA[c].forte }} />

  const TITULO: Record<string, string> = { tudo: 'Tudo por tópico', notas: 'Só anotações', postits: 'Post-its', arquivadas: 'Arquivadas' }
  const titulo = TITULO[filtro] ?? (filtro.startsWith('tag:') ? `Tag: ${rotuloTag(filtro.slice(4))}` : cores.find((c) => c.id === filtro)?.objetivo || TINTA[filtro as IdCor].nome)

  return (
    <>
      <header className="border-b border-[var(--linha)] bg-[var(--papel-2)]/60">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-5 sm:px-8 sm:py-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-medium text-[var(--tinta-suave)]">o que você escreveu e marcou</div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--tinta-forte)] sm:text-4xl">Anotações</h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-[var(--tinta)]">
              {total ? <>{resumo.join(' · ')}.</> : 'Nada ainda.'}
            </p>
          </div>
          <div className="grid w-full shrink-0 grid-cols-2 gap-2 md:w-64">
            {PARTES.filter((p) => p.id !== 'tudo').map((p) => (
              <a key={p.id} href={p.href} className="group rounded-xl border border-[var(--linha)] bg-[var(--cartao)] px-3 py-2.5 transition-shadow hover:shadow-[var(--sombra)]">
                <span className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[var(--tinta-suave)]">
                  {p.icone}
                  <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                    →
                  </span>
                </span>
                <span className="mt-1 block text-sm font-semibold text-[var(--tinta-forte)]">{p.nome}</span>
                <span className="block text-xs text-[var(--tinta-suave)]">{p.id === 'quadro' ? `${quadro.length} post-it${quadro.length === 1 ? '' : 's'}` : 'páginas livres'}</span>
              </a>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-5 pb-40 pt-8 sm:px-8 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12 lg:pt-10">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rotulo-formula mb-3">mostrar</div>
          <nav role="tablist" aria-label="filtrar anotações" aria-orientation="vertical" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1 lg:gap-1">
            {opcao('tudo', '📋', 'tudo', total)}
            {opcao('notas', '📝', 'só anotações', notasAtivas.length)}
            {postits.length > 0 && opcao('postits', '💭', 'post-its', postits.length)}
            {cores.map((c) => opcao(c.id, bolinha(c.id), c.objetivo.trim() || TINTA[c.id].nome, marcasAtivas.filter((m) => m.cor === c.id).length))}
            {nArquivadas > 0 && opcao('arquivadas', '🗄', 'arquivadas', nArquivadas)}
          </nav>
          {tagsEmUso.length > 0 && (
            <>
              <div className="rotulo-formula mb-3 mt-6">tags</div>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="filtrar por tag">
                {tagsEmUso.map(([t, n]) => (
                  <button
                    key={t}
                    onClick={() => setFiltro(`tag:${t}`)}
                    aria-pressed={filtro === `tag:${t}`}
                    className={`rounded-full px-2.5 py-1 text-xs ${filtro === `tag:${t}` ? 'bg-[var(--foco)] text-white' : 'bg-[var(--cartao)] text-[var(--tinta)] ring-1 ring-[var(--linha)] hover:ring-[var(--tinta-suave)]'}`}
                  >
                    {t.startsWith('aba:') ? '▤' : t.startsWith('t:') ? '↔' : '#'} {rotuloTag(t)} <span className="opacity-70">{n}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </aside>

        <main className="mt-10 min-w-0 lg:mt-0">
          <header className="mb-8">
            <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-[var(--tinta-forte)]">
              {titulo} <LinkAjuda secao={filtro === 'tudo' || filtro === 'notas' || filtro === 'postits' ? 'anotacoes' : 'marcas'} />
            </h2>
          </header>

          {!grupos.length && !soltos.length && (
            <p className="rounded-3xl bg-[var(--cartao)] p-6 text-center text-sm text-[var(--tinta-suave)] shadow-[var(--sombra)]">
              {total || nArquivadas ? 'Nada aqui com esse filtro.' : 'Nenhuma anotação ainda. Escreva no 📝 de um tópico ou selecione um trecho do texto para marcar.'}
            </p>
          )}
          <ul className="space-y-8">
            {grupos.map(({ id, nota, ms, ps }) => {
              const tp = topicoPorId.get(id)!
              return (
                <li key={id}>
                  <button onClick={() => selecionar(id)} className="flex items-center gap-2 text-sm hover:underline">
                    <span style={{ color: unidade(tp.unidade).cor }}>●</span>
                    <span className="font-semibold text-[var(--tinta-forte)]">{tp.titulo}</span>
                    <span className="text-xs text-[var(--tinta-suave)]">abrir →</span>
                  </button>
                  {nota && (
                    <div className="mt-2 rounded-2xl bg-[var(--cartao)] p-4 shadow-[var(--sombra)]">
                      <div className="flex items-center gap-2 text-xs text-[var(--tinta-suave)]">
                        📝 sua anotação<span className="ml-auto">{new Date(nota.em).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <button onClick={() => selecionar(id)} className="mt-1.5 block w-full text-left" title="abrir o tópico para ler ou editar">
                        <p className="line-clamp-4 whitespace-pre-wrap text-sm text-[var(--tinta)]">{nota.texto}</p>
                      </button>
                      <div className="mt-2 flex flex-wrap justify-end gap-1">
                        <button className={botaoAcao} onClick={() => arquivarNota(id, !nota.arquivada)} title={nota.arquivada ? 'volta para a lista' : 'sai da lista; continua no tópico'}>
                          {nota.arquivada ? '↩ desarquivar' : '🗄 arquivar'}
                        </button>
                        <button className={botaoAcao} onClick={() => apagarNota(id)}>
                          🗑 apagar
                        </button>
                      </div>
                    </div>
                  )}
                  {ms.length > 0 && (
                    <div className="mt-2">
                      <ListaMarcas marcas={ms} acoes={acoesMarca} />
                    </div>
                  )}
                  {ps.length > 0 && <PostitsLidos ps={ps} />}
                </li>
              )
            })}
            {soltos.length > 0 && (
              <li>
                <p className="text-sm font-semibold text-[var(--tinta-forte)]">💭 post-its sem tópico</p>
                <PostitsLidos ps={soltos} />
              </li>
            )}
          </ul>
        </main>
      </div>
      <AvisoDesfazer aviso={aviso} limpar={limparAviso} />
    </>
  )
}

/** Página cheia de anotações: tudo por tópico (notas, marcas e post-its) ou o quadro de post-its. */
export function TelaQuadro({ aba }: { aba: 'tudo' | 'quadro' }) {
  const quadro = useMapa((s) => s.quadro)
  const adicionar = useMapa((s) => s.adicionarPostit)
  const remover = useMapa((s) => s.removerPostit)
  const restaurar = useMapa((s) => s.restaurarPostit)
  const [aviso, setAviso] = useState<Desfazer | null>(null)
  const limparAviso = useCallback(() => setAviso(null), [])
  const [novo, setNovo] = useState<string | null>(null)
  const area = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || (e.target as HTMLElement).closest?.('input, select, textarea, [contenteditable]')) return
      voltarDasPaginas()
    }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [])

  const nova = () => {
    // aparece no meio do que está visível, com um leve desvio para não empilhar
    const el = area.current
    const cx = el ? el.scrollLeft + el.clientWidth / 2 - TAM / 2 : 60
    const cy = el ? el.scrollTop + el.clientHeight / 2 - TAM / 2 : 60
    const d = (quadro.length % 5) * 18
    const id = adicionar({ x: Math.max(8, Math.min(LARGURA - TAM, cx + d)), y: Math.max(8, Math.min(ALTURA - TAM, cy + d)), texto: '', cor: ORDEM_CORES[quadro.length % ORDEM_CORES.length] })
    setNovo(id)
  }

  if (aba === 'tudo')
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-dvh bg-[var(--papel)] text-[var(--tinta)]">
        <BarraTopo onde="tudo por tópico" />
        <PaginaAnotacoes />
      </motion.div>
    )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-dvh flex-col bg-[var(--papel)]">
      <BarraTopo onde="quadro">
        <button className="botao-foco shrink-0 !py-1.5 text-sm" onClick={nova}>
          + ideia
        </button>
      </BarraTopo>
      <div className="border-b border-[var(--linha)]">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <AbasAnotacoes atual="quadro" />
        </div>
      </div>

      <div ref={area} className="relative flex-1 overflow-auto">
        <div className="relative" style={{ width: LARGURA, height: ALTURA, backgroundImage: 'radial-gradient(var(--linha) 1.2px, transparent 1.2px)', backgroundSize: '24px 24px' }}>
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
                  setAviso({ texto: 'post-it apagado', fazer: () => restaurar(q) })
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
      <AvisoDesfazer aviso={aviso} limpar={limparAviso} />
    </motion.div>
  )
}
