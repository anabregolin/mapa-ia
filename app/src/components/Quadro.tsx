// Quadro de brainstorm: post-its soltos que você arrasta, mais a lista de anotações por tópico.
import { AnimatePresence, MotionConfig, motion, useDragControls, useMotionValue } from 'framer-motion'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useCalmo, useSurgir } from '../lib/movimento'
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

// fundo: a cor do cartão; ponto: a bolinha que mostra a cor (mais forte, para se ver no próprio cartão)
const CORES: Record<CorPostit, { fundo: string; ponto: string; nome: string }> = {
  sol: { fundo: 'color-mix(in srgb, var(--sol) 38%, white)', ponto: 'var(--sol)', nome: 'amarelo' },
  menta: { fundo: 'var(--menta-claro)', ponto: 'var(--menta)', nome: 'verde' },
  foco: { fundo: 'var(--foco-claro)', ponto: 'var(--foco)', nome: 'lilás' },
  coral: { fundo: 'color-mix(in srgb, var(--coral) 28%, white)', ponto: 'var(--coral)', nome: 'coral' },
  papel: { fundo: 'var(--cartao)', ponto: 'var(--tinta-suave)', nome: 'branco' },
}
const ORDEM_CORES = Object.keys(CORES) as CorPostit[]

function Nota({ p, apagar, novo, z, aoTocar }: { p: Postit; apagar: (p: Postit) => void; novo: boolean; z: number; aoTocar: () => void }) {
  const atualizar = useMapa((s) => s.atualizarPostit)
  const selecionar = useMapa((s) => s.selecionar)
  const calmo = useCalmo()
  const surgir = useSurgir('cima')
  const controles = useDragControls()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const [texto, setTexto] = useState(p.texto)
  const [paleta, setPaleta] = useState(false)
  const campo = useRef<HTMLTextAreaElement>(null)
  const caixaPaleta = useRef<HTMLDivElement>(null)
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

  // a paleta fecha ao clicar fora dela
  useEffect(() => {
    if (!paleta) return
    const fora = (e: PointerEvent) => {
      if (!caixaPaleta.current?.contains(e.target as Node)) setPaleta(false)
    }
    document.addEventListener('pointerdown', fora)
    return () => document.removeEventListener('pointerdown', fora)
  }, [paleta])

  return (
    <motion.div
      data-postit={p.id}
      drag
      dragControls={controles}
      dragListener={false}
      dragMomentum={false}
      dragConstraints={{ left: -p.x, top: -p.y, right: LARGURA - TAM - p.x, bottom: ALTURA - TAM - p.y }}
      dragElastic={0}
      onPointerDownCapture={aoTocar}
      onDragEnd={() => {
        atualizar(p.id, { x: Math.round(p.x + x.get()), y: Math.round(p.y + y.get()) })
        x.set(0)
        y.set(0)
      }}
      initial={calmo ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={calmo ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
      transition={{ duration: calmo ? 0 : 0.2 }}
      whileDrag={calmo ? { zIndex: 1000 } : { scale: 1.03, rotate: -1, zIndex: 1000, boxShadow: '0 24px 40px -18px rgba(36,34,44,.5)' }}
      className="group/nota absolute flex flex-col rounded-2xl shadow-[0_1px_2px_rgba(36,34,44,.08),0_10px_24px_-14px_rgba(36,34,44,.45)] ring-1 ring-black/5"
      style={{ left: p.x, top: p.y, width: TAM, minHeight: TAM, x, y, zIndex: z, background: CORES[p.cor].fundo }}
    >
      {/* alça: só ela arrasta, assim dá para selecionar o texto */}
      <div
        onPointerDown={(e) => {
          // sem isso, arrastar seleciona o texto das ideias por onde o mouse passa
          e.preventDefault()
          controles.start(e)
        }}
        className="flex cursor-grab touch-none items-center gap-0.5 rounded-t-2xl bg-black/[.04] py-1 pl-2 pr-1 active:cursor-grabbing"
        title="arraste para mover"
      >
        <span className="mr-auto select-none text-sm leading-none tracking-tighter text-[var(--tinta-suave)] opacity-70" aria-hidden>
          ⠿
        </span>
        <div ref={caixaPaleta} className="relative">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setPaleta(!paleta)}
            aria-label={`cor: ${CORES[p.cor].nome}. Trocar a cor`}
            aria-expanded={paleta}
            title="trocar a cor"
            className="grid h-7 w-7 place-items-center rounded-full hover:bg-black/5"
          >
            <span className="h-3.5 w-3.5 rounded-full ring-2 ring-white" style={{ background: CORES[p.cor].ponto }} />
          </button>
          <AnimatePresence>
            {paleta && (
              <motion.div
                key="paleta"
                {...surgir}
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute right-0 top-full z-20 mt-1 flex gap-1 rounded-full bg-[var(--cartao)] p-1.5 shadow-[var(--sombra)] ring-1 ring-[var(--linha)]"
                style={{ transformOrigin: 'top right' }}
              >
                {ORDEM_CORES.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      atualizar(p.id, { cor: c })
                      setPaleta(false)
                    }}
                    aria-label={CORES[c].nome}
                    aria-pressed={p.cor === c}
                    title={CORES[c].nome}
                    className={`h-6 w-6 rounded-full ring-1 ring-black/10 transition-transform hover:scale-110 ${p.cor === c ? 'outline outline-2 outline-offset-2 outline-[var(--foco)]' : ''}`}
                    style={{ background: CORES[c].ponto }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => apagar(p)}
          aria-label="apagar esta ideia"
          title="apagar"
          className="grid h-7 w-7 place-items-center rounded-full text-base leading-none text-[var(--tinta-suave)] hover:bg-black/5 hover:text-[var(--tinta-forte)]"
        >
          ×
        </button>
      </div>
      <textarea
        ref={campo}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={() => texto !== p.texto && atualizar(p.id, { texto })}
        placeholder="uma ideia…"
        aria-label="texto da ideia"
        // cresce com o texto (onde o navegador sabe fazer isso); senão rola por dentro
        className="min-h-[8.5rem] flex-1 resize-none bg-transparent px-3.5 pb-3 pt-2 text-[15px] leading-snug text-[var(--tinta-forte)] outline-none [field-sizing:content] placeholder:text-[var(--tinta-suave)]"
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
        <div
          key={p.id}
          className="whitespace-pre-wrap rounded-xl p-3 text-sm leading-snug text-[var(--tinta-forte)] shadow-[var(--sombra)]"
          style={{ background: CORES[p.cor].fundo }}
        >
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
          // acima do rodapé fixo (--rodape-fixo já inclui a área segura do celular)
          style={{ bottom: 'calc(var(--rodape-fixo, env(safe-area-inset-bottom, 0px)) + 1.25rem)' }}
          className="fixed inset-x-0 z-40 mx-auto flex w-fit items-center gap-3 rounded-full bg-[var(--tinta-forte)] px-4 py-2 text-sm text-white shadow-lg"
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
    <nav className="flex gap-1 overflow-x-auto sem-barra" aria-label="partes das anotações">
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
      const ms =
        filtro === 'postits' || filtro === 'notas'
          ? []
          : marcas.filter((m) => m.topico === id && !!m.arquivada === arquivadas && (arquivadas || passa(filtro, m))).sort((a, b) => a.em - b.em)
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
      <button
        className={botaoAcao}
        onClick={() => atualizarMarca(m.id, { arquivada: m.arquivada ? undefined : true })}
        title={m.arquivada ? 'volta para a lista' : 'sai da lista; o grifo continua no texto'}
      >
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
    <button
      key={f}
      role="tab"
      aria-selected={filtro === f}
      onClick={() => setFiltro(f)}
      className={`${botaoFiltro} ${filtro === f ? 'bg-[var(--foco)] font-medium text-white shadow-[var(--sombra)]' : inativo}`}
    >
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
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-[var(--tinta)]">{total ? <>{resumo.join(' · ')}.</> : 'Nada ainda.'}</p>
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
                <span className="block text-xs text-[var(--tinta-suave)]">
                  {p.id === 'quadro' ? `${quadro.length} post-it${quadro.length === 1 ? '' : 's'}` : 'páginas livres'}
                </span>
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
                        <button
                          className={botaoAcao}
                          onClick={() => arquivarNota(id, !nota.arquivada)}
                          title={nota.arquivada ? 'volta para a lista' : 'sai da lista; continua no tópico'}
                        >
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
  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || (e.target as HTMLElement).closest?.('input, select, textarea, [contenteditable]')) return
      voltarDasPaginas()
    }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [])

  if (aba === 'tudo')
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-dvh bg-[var(--papel)] text-[var(--tinta)]">
        <BarraTopo onde="tudo por tópico" />
        <PaginaAnotacoes />
      </motion.div>
    )
  return <Quadro />
}

const ZOOM_MIN = 0.4
const ZOOM_MAX = 1.5
/** folga em volta do quadro, para a borda dele aparecer */
const MARGEM = 32

/** O quadro de ideias: uma folha pontilhada que dá para arrastar, aproximar e afastar. */
function Quadro() {
  const quadro = useMapa((s) => s.quadro)
  const adicionar = useMapa((s) => s.adicionarPostit)
  const atualizar = useMapa((s) => s.atualizarPostit)
  const remover = useMapa((s) => s.removerPostit)
  const restaurar = useMapa((s) => s.restaurarPostit)
  const calmo = useCalmo()
  const [aviso, setAviso] = useState<Desfazer | null>(null)
  const limparAviso = useCallback(() => setAviso(null), [])
  const [novo, setNovo] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [arrastando, setArrastando] = useState(false)
  // quem foi tocado por último fica por cima (só na tela, não é salvo)
  const [ordem, setOrdem] = useState<string[]>([])
  const area = useRef<HTMLDivElement>(null)
  const folha = useRef<HTMLDivElement>(null)
  const zoomAtual = useRef(zoom)
  // ponto da folha que deve ficar parado na tela depois de mudar o zoom
  const fixar = useRef<{ fx: number; fy: number; tx: number; ty: number } | null>(null)

  /** onde a folha começa dentro da área rolável (muda com o zoom, porque ela fica centrada quando é menor) */
  const origem = () => ({ x: (folha.current?.offsetLeft ?? 0) + MARGEM, y: (folha.current?.offsetTop ?? 0) + MARGEM })

  const posicionar = useCallback(() => {
    const el = area.current
    const f = fixar.current
    if (!el || !f) return
    fixar.current = null
    const o = origem()
    el.scrollTo({ left: o.x + f.fx * zoomAtual.current - f.tx, top: o.y + f.fy * zoomAtual.current - f.ty })
  }, [])

  useLayoutEffect(() => {
    zoomAtual.current = zoom
    posicionar()
  }, [zoom, posicionar])

  /** Muda o zoom mantendo parado o ponto (tx, ty) da tela; sem ponto, o meio. */
  const zoomPara = useCallback(
    (valor: number, tx?: number, ty?: number) => {
      const el = area.current
      if (!el) return
      const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(valor * 100) / 100))
      const px = tx ?? el.clientWidth / 2
      const py = ty ?? el.clientHeight / 2
      const o = origem()
      fixar.current = { fx: (el.scrollLeft + px - o.x) / zoomAtual.current, fy: (el.scrollTop + py - o.y) / zoomAtual.current, tx: px, ty: py }
      if (z === zoomAtual.current) posicionar()
      else setZoom(z)
    },
    [posicionar],
  )

  /** Enquadra todas as ideias (ou o começo da folha, se não houver nenhuma). */
  const verTudo = useCallback(
    (ps: Postit[] = useMapa.getState().quadro) => {
      const el = area.current
      if (!el) return
      if (!ps.length) {
        fixar.current = { fx: 0, fy: 0, tx: MARGEM, ty: MARGEM }
        if (zoomAtual.current === 1) posicionar()
        else setZoom(1)
        return
      }
      const alturas = (p: Postit) => (folha.current?.querySelector<HTMLElement>(`[data-postit="${p.id}"]`)?.offsetHeight ?? TAM) + 0
      const x0 = Math.min(...ps.map((p) => p.x))
      const y0 = Math.min(...ps.map((p) => p.y))
      const x1 = Math.max(...ps.map((p) => p.x + TAM))
      const y1 = Math.max(...ps.map((p) => p.y + alturas(p)))
      const folga = 48
      const z = Math.min(1, Math.max(ZOOM_MIN, Math.min((el.clientWidth - folga * 2) / (x1 - x0), (el.clientHeight - folga * 2) / (y1 - y0))))
      const zr = Math.round(z * 100) / 100
      fixar.current = { fx: (x0 + x1) / 2, fy: (y0 + y1) / 2, tx: el.clientWidth / 2, ty: el.clientHeight / 2 }
      if (zr === zoomAtual.current) posicionar()
      else setZoom(zr)
    },
    [posicionar],
  )

  // ao abrir: enquadra o que já existe
  useEffect(() => {
    const t = requestAnimationFrame(() => verTudo())
    return () => cancelAnimationFrame(t)
  }, [verTudo])

  // Ctrl + roda (ou pinça no touchpad) aproxima e afasta no ponto do mouse
  useEffect(() => {
    const el = area.current
    if (!el) return
    const roda = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const r = el.getBoundingClientRect()
      zoomPara(zoomAtual.current * Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top)
    }
    el.addEventListener('wheel', roda, { passive: false })
    return () => el.removeEventListener('wheel', roda)
  }, [zoomPara])

  /** ponto da tela → ponto da folha */
  const naFolha = (clientX: number, clientY: number) => {
    const el = area.current!
    const r = el.getBoundingClientRect()
    const o = origem()
    return { x: (el.scrollLeft + clientX - r.left - o.x) / zoom, y: (el.scrollTop + clientY - r.top - o.y) / zoom }
  }

  const criar = (cx: number, cy: number) => {
    const id = adicionar({
      x: Math.round(Math.max(8, Math.min(LARGURA - TAM - 8, cx))),
      y: Math.round(Math.max(8, Math.min(ALTURA - TAM - 8, cy))),
      texto: '',
      cor: ORDEM_CORES[quadro.length % ORDEM_CORES.length],
    })
    setNovo(id)
    setOrdem((o) => [...o, id])
  }

  const nova = () => {
    // no meio do que está visível, com um leve desvio para não empilhar
    const el = area.current
    if (!el) return criar(60, 60)
    const r = el.getBoundingClientRect()
    const m = naFolha(r.left + el.clientWidth / 2, r.top + el.clientHeight / 2)
    const d = (quadro.length % 5) * 18
    criar(m.x - TAM / 2 + d, m.y - TAM / 2 + d)
  }

  // arrastar o fundo com o mouse anda pelo quadro (no toque, o dedo já rola)
  const fundo = (alvo: EventTarget) => alvo === area.current || alvo === folha.current || (alvo as HTMLElement).dataset?.fundo === 'sim'
  const inicioArrasto = useRef<{ x: number; y: number; sl: number; st: number } | null>(null)
  const aoApertar = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !fundo(e.target)) return
    const el = area.current!
    inicioArrasto.current = { x: e.clientX, y: e.clientY, sl: el.scrollLeft, st: el.scrollTop }
    el.setPointerCapture(e.pointerId)
    setArrastando(true)
  }
  const aoMover = (e: React.PointerEvent) => {
    const i = inicioArrasto.current
    if (!i) return
    area.current!.scrollTo({ left: i.sl - (e.clientX - i.x), top: i.st - (e.clientY - i.y) })
  }
  const aoSoltar = () => {
    inicioArrasto.current = null
    setArrastando(false)
  }

  /** Junta as ideias em colunas, uma por cor, na ordem em que estavam (de cima para baixo). Dá para desfazer. */
  const arrumarPorCor = () => {
    const antes = quadro.map((p) => ({ id: p.id, x: p.x, y: p.y }))
    const altura = (p: Postit) => folha.current?.querySelector<HTMLElement>(`[data-postit="${p.id}"]`)?.offsetHeight ?? TAM
    const GX = 32
    const GY = 20
    let col = 0
    const novas: Postit[] = []
    for (const c of ORDEM_CORES) {
      const daCor = quadro.filter((p) => p.cor === c).sort((a, b) => a.y - b.y || a.x - b.x)
      if (!daCor.length) continue
      let y = 40
      for (const p of daCor) {
        const h = altura(p)
        // coluna cheia: continua na do lado
        if (y + h > ALTURA - 16 && y > 40) {
          col++
          y = 40
        }
        const q = { ...p, x: Math.min(LARGURA - TAM - 8, 40 + col * (TAM + GX)), y }
        atualizar(p.id, { x: q.x, y: q.y })
        novas.push(q)
        y += h + GY
      }
      col++
    }
    setAviso({ texto: 'ideias arrumadas por cor', fazer: () => antes.forEach((a) => atualizar(a.id, { x: a.x, y: a.y })) })
    requestAnimationFrame(() => verTudo(novas))
  }

  const botaoBarra =
    'inline-flex h-8 min-w-8 items-center justify-center whitespace-nowrap rounded-full px-2 text-sm text-[var(--tinta)] transition-colors hover:bg-[var(--papel-2)] disabled:opacity-40 disabled:hover:bg-transparent'
  const vazio = quadro.length === 0

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-[calc(100dvh-var(--rodape-fixo,0px))] flex-col bg-[var(--papel)]">
      <BarraTopo onde="quadro">
        {!vazio && (
          <span className="hidden text-xs text-[var(--tinta-suave)] sm:inline">
            {quadro.length} {quadro.length === 1 ? 'ideia' : 'ideias'}
          </span>
        )}
        <button className="botao-foco shrink-0 !py-1.5 text-sm" onClick={nova}>
          + ideia
        </button>
      </BarraTopo>
      <div className="border-b border-[var(--linha)]">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <AbasAnotacoes atual="quadro" />
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={area}
          onPointerDown={aoApertar}
          onPointerMove={aoMover}
          onPointerUp={aoSoltar}
          onPointerCancel={aoSoltar}
          onDoubleClick={(e) => {
            if (!fundo(e.target)) return
            const m = naFolha(e.clientX, e.clientY)
            criar(m.x - TAM / 2, m.y - 20)
          }}
          // sem barras de rolagem: anda-se arrastando o fundo, rolando ou com o dedo
          className={`absolute inset-0 overflow-auto bg-[var(--papel-2)] sem-barra ${arrastando ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
        >
          <div ref={folha} className="relative mx-auto" style={{ width: LARGURA * zoom + MARGEM * 2, height: ALTURA * zoom + MARGEM * 2 }}>
            <MotionConfig transformPagePoint={(p) => ({ x: p.x / zoom, y: p.y / zoom })}>
              <div
                data-fundo="sim"
                className="absolute origin-top-left rounded-3xl bg-[var(--papel)] shadow-[0_0_0_1px_var(--linha),0_12px_40px_-24px_rgba(36,34,44,.35)]"
                style={{
                  left: MARGEM,
                  top: MARGEM,
                  width: LARGURA,
                  height: ALTURA,
                  transform: `scale(${zoom})`,
                  backgroundImage: 'radial-gradient(color-mix(in srgb, var(--tinta-suave) 35%, transparent) 1.2px, transparent 1.2px)',
                  backgroundSize: '24px 24px',
                  backgroundPosition: '12px 12px',
                }}
              >
                <AnimatePresence>
                  {quadro.map((p) => (
                    <Nota
                      key={p.id}
                      p={p}
                      novo={p.id === novo}
                      z={1 + ordem.indexOf(p.id) + 1}
                      aoTocar={() => setOrdem((o) => (o[o.length - 1] === p.id ? o : [...o.filter((i) => i !== p.id), p.id]))}
                      apagar={(q) => {
                        remover(q.id)
                        setAviso({ texto: 'ideia apagada', fazer: () => restaurar(q) })
                      }}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </MotionConfig>
          </div>
        </div>

        {/* quadro vazio: um convite no meio da tela, não um aviso no canto */}
        <AnimatePresence>
          {vazio && (
            <motion.div
              key="vazio"
              initial={{ opacity: 0, y: calmo ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: calmo ? 0 : 0.22 }}
              className="pointer-events-none absolute inset-0 grid place-items-center p-5"
            >
              <div className="pointer-events-auto w-full max-w-sm rounded-3xl bg-[var(--cartao)] p-6 text-center shadow-[var(--sombra)] ring-1 ring-[var(--linha)]">
                <div className="text-3xl" aria-hidden>
                  💭
                </div>
                <h2 className="mt-2 text-lg font-semibold text-[var(--tinta-forte)]">Seu quadro de ideias</h2>
                <p className="mt-1 text-sm leading-relaxed text-[var(--tinta-suave)]">Despeje tudo o que vier na cabeça, sem ordem. Depois agrupe o que combina.</p>
                <button className="botao-foco mt-4" onClick={nova}>
                  + primeira ideia
                </button>
                <ul className="mt-5 space-y-1.5 border-t border-[var(--linha)] pt-4 text-left text-xs text-[var(--tinta-suave)]">
                  <li>
                    <span className="inline-block w-6 text-center" aria-hidden>
                      ⠿
                    </span>
                    arraste pela alça de cima para mover
                  </li>
                  <li>
                    <span className="inline-block w-6 text-center" aria-hidden>
                      ●
                    </span>
                    a bolinha troca a cor
                  </li>
                  <li>
                    <span className="inline-block w-6 text-center" aria-hidden>
                      ✥
                    </span>
                    arraste o fundo para andar · Ctrl + roda aproxima
                  </li>
                  <li>
                    <span className="inline-block w-6 text-center" aria-hidden>
                      ⊕
                    </span>
                    dois cliques no fundo criam uma ideia ali
                  </li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* zoom e organização no canto de cima (embaixo fica o aviso de desfazer) */}
        {!vazio && (
          <div
            role="toolbar"
            aria-label="ver o quadro"
            className="absolute right-3 top-3 z-10 flex items-center gap-0.5 rounded-full bg-[var(--cartao)] p-1 shadow-[var(--sombra)] ring-1 ring-[var(--linha)]"
          >
            <button className={botaoBarra} onClick={() => zoomPara(zoom - 0.1)} disabled={zoom <= ZOOM_MIN} aria-label="afastar" title="afastar (Ctrl + roda)">
              −
            </button>
            <button className={`${botaoBarra} w-14 tabular-nums text-xs`} onClick={() => zoomPara(1)} title="voltar a 100%">
              {Math.round(zoom * 100)}%
            </button>
            <button className={botaoBarra} onClick={() => zoomPara(zoom + 0.1)} disabled={zoom >= ZOOM_MAX} aria-label="aproximar" title="aproximar (Ctrl + roda)">
              +
            </button>
            <span className="mx-1 h-5 w-px bg-[var(--linha)]" aria-hidden />
            <button className={botaoBarra} onClick={() => verTudo()} title="enquadrar todas as ideias">
              ⤢ <span className="ml-1 hidden sm:inline">ver tudo</span>
            </button>
            <button className={botaoBarra} onClick={arrumarPorCor} title="junta as ideias em colunas, uma por cor (dá para desfazer)">
              ▦ <span className="ml-1 hidden sm:inline">arrumar por cor</span>
            </button>
          </div>
        )}
      </div>
      <AvisoDesfazer aviso={aviso} limpar={limparAviso} />
    </motion.div>
  )
}
