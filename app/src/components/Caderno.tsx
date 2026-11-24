// Caderno: páginas por assunto que você monta com o que já existe no app e com coisas suas.
// Blocos que apontam para outra coisa (post-it, marca, anotação, explicação) editam a original:
// mudar aqui muda lá, e vice-versa. Fotos e áudios ficam no IndexedDB deste navegador.
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CARTOES } from '../content/cartoes'
import { palavrasDoTopico } from '../content/palavras'
import { TOPICOS, topicoPorId, UNIDADES } from '../content/topicos'
import { novoId, SEM_ASSUNTO, type Bloco, type PaginaCaderno, type TipoBloco } from '../lib/caderno'
import { guardarFoto, lerFoto } from '../lib/fotos'
import { lerGravacao, todasGravacoes, type Gravacao } from '../lib/gravacoes'
import { mmss, useGravar } from '../lib/gravar'
import { TINTA } from '../lib/marcas'
import { voltarDasPaginas } from '../lib/paineis'
import { NOME_PROFUNDIDADE, unidade } from '../lib/trilha'
import { useMapa } from '../store/useMapa'
import { Tex } from './FormulaAnimada'
import { Contexto, NotaDaMarca, TagsDaMarca } from './Marcas'
import { AbasAnotacoes } from './Quadro'
import { Ampliado, img, lerIndice, type Indice } from './Slides'
import { Texto } from './Texto'

const TIPOS: { tipo: TipoBloco; icone: string; nome: string; dica: string }[] = [
  { tipo: 'titulo', icone: 'H', nome: 'título', dica: 'separa a página em partes' },
  { tipo: 'texto', icone: '¶', nome: 'texto', dica: 'escreva do seu jeito; $fórmula$ e **negrito** funcionam' },
  { tipo: 'foto', icone: '📷', nome: 'foto', dica: 'do caderno de papel, do quadro, um print' },
  { tipo: 'audio', icone: '🎙', nome: 'áudio', dica: 'gravar agora ou trazer uma explicação gravada' },
  { tipo: 'slide', icone: '📄', nome: 'slide', dica: 'uma página dos slides da aula' },
  { tipo: 'postit', icone: '💭', nome: 'post-it', dica: 'do quadro de ideias' },
  { tipo: 'cartao', icone: '🗂', nome: 'cartão', dica: 'pergunta e resposta dos cartões' },
  { tipo: 'marca', icone: '🖍', nome: 'marca', dica: 'um trecho que você marcou' },
  { tipo: 'nota', icone: '📝', nome: 'anotação', dica: 'a anotação de um tópico' },
  { tipo: 'explicacao', icone: '🗣', nome: 'explicação', dica: 'o que você escreveu em "explicar para alguém"' },
  { tipo: 'topico', icone: '●', nome: 'tópico', dica: 'o resumo e um atalho para o tópico' },
  { tipo: 'palavras', icone: '🔑', nome: 'palavras-chave', dica: 'as palavras-chave de um tópico' },
  { tipo: 'trilha', icone: '▤', nome: 'trilha', dica: 'uma aba da trilha (prova, lista) com o progresso' },
]
const INFO = Object.fromEntries(TIPOS.map((t) => [t.tipo, t])) as Record<TipoBloco, (typeof TIPOS)[number]>

/* ───────────── tela ───────────── */

export function TelaCaderno({ paginaId }: { paginaId?: string }) {
  const caderno = useMapa((s) => s.caderno)
  const criar = useMapa((s) => s.criarPagina)
  const setPaginaAtual = useMapa((s) => s.setPaginaAtual)
  const restaurar = useMapa((s) => s.restaurarPagina)
  const [apagada, setApagada] = useState<PaginaCaderno | null>(null)
  const pagina = caderno.find((p) => p.id === paginaId)

  useEffect(() => {
    if (pagina) setPaginaAtual(pagina.id)
  }, [pagina, setPaginaAtual])
  useEffect(() => {
    if (!apagada) return
    const t = setTimeout(() => setApagada(null), 8000)
    return () => clearTimeout(t)
  }, [apagada])

  const nova = () => {
    const id = criar({ assunto: pagina?.assunto ?? '' })
    location.hash = `#/caderno/${id}`
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-dvh bg-[var(--papel)]">
      <header className="sticky top-0 z-20 border-b border-[var(--linha)] bg-[var(--papel)]/90 backdrop-blur" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 pt-2.5 sm:px-6">
          <button className="botao-suave shrink-0 whitespace-nowrap" onClick={voltarDasPaginas}>
            ← voltar
          </button>
          {pagina && (
            <a href="#/caderno" className="botao-suave shrink-0 whitespace-nowrap md:hidden">
              ☰ páginas
            </a>
          )}
          <h1 className="mr-auto min-w-0 truncate text-base font-semibold text-[var(--tinta-forte)]">
            📝<span className={pagina ? 'hidden sm:inline' : ''}> Anotações</span>
          </h1>
          <button className="botao-foco shrink-0 whitespace-nowrap" onClick={nova} aria-label="nova página">
            + <span className={pagina ? 'hidden sm:inline' : ''}>página</span>
          </button>
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <AbasAnotacoes atual="caderno" />
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 pb-28 pt-6 sm:px-6">
        <aside className={`w-full shrink-0 md:block md:w-64 ${pagina ? 'hidden' : ''}`}>
          <ListaPaginas atual={pagina?.id} nova={nova} />
        </aside>
        <main className={`min-w-0 flex-1 ${pagina ? '' : 'hidden md:block'}`}>
          {pagina ? (
            <VerPagina key={pagina.id} p={pagina} apagou={(p) => setApagada(p)} />
          ) : (
            <div className="rounded-3xl border border-dashed border-[var(--linha)] p-8 text-center text-sm text-[var(--tinta-suave)]">
              {caderno.length ? 'Escolha uma página na lista ou crie outra.' : 'Seu caderno está vazio. Crie a primeira página e vá juntando o que quiser nela.'}
            </div>
          )}
        </main>
      </div>

      <AnimatePresence>
        {apagada && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full bg-[var(--tinta-forte)] px-4 py-2 text-sm text-[var(--papel)] shadow-lg"
          >
            Página apagada.
            <button
              className="font-semibold underline"
              onClick={() => {
                restaurar(apagada)
                location.hash = `#/caderno/${apagada.id}`
                setApagada(null)
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

/* ───────────── lista de páginas por assunto ───────────── */

function ListaPaginas({ atual, nova }: { atual?: string; nova: () => void }) {
  const caderno = useMapa((s) => s.caderno)
  const [busca, setBusca] = useState('')
  const q = busca.trim().toLowerCase()
  const filtradas = caderno.filter((p) => !q || `${p.titulo} ${p.assunto}`.toLowerCase().includes(q))
  const grupos = new Map<string, PaginaCaderno[]>()
  for (const p of filtradas) {
    const a = p.assunto.trim() || SEM_ASSUNTO
    grupos.set(a, [...(grupos.get(a) ?? []), p])
  }
  const ordem = [...grupos.keys()].sort((a, b) => (a === SEM_ASSUNTO ? 1 : b === SEM_ASSUNTO ? -1 : a.localeCompare(b, 'pt-BR')))

  return (
    <nav aria-label="páginas do caderno">
      {caderno.length > 4 && (
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="procurar página…"
          className="mb-4 w-full rounded-full border border-[var(--linha)] bg-[var(--cartao)] px-3 py-1.5 text-sm outline-none focus:border-[var(--foco)]"
        />
      )}
      {!caderno.length && (
        <button className="botao-foco w-full" onClick={nova}>
          + primeira página
        </button>
      )}
      <div className="space-y-5">
        {ordem.map((a) => (
          <section key={a}>
            <h2 className="rotulo-formula mb-1.5">{a}</h2>
            <ul className="space-y-1">
              {grupos
                .get(a)!
                .sort((x, y) => y.em - x.em)
                .map((p) => (
                  <li key={p.id}>
                    <a
                      href={`#/caderno/${p.id}`}
                      className={`block rounded-xl px-3 py-2 text-sm transition-colors ${p.id === atual ? 'bg-[var(--foco-claro)] font-medium text-[var(--foco)]' : 'text-[var(--tinta)] hover:bg-[var(--papel-2)]'}`}
                    >
                      {p.titulo.trim() || 'sem título'}
                      <span className="ml-1.5 text-[11px] font-normal text-[var(--tinta-suave)]">{p.blocos.length}</span>
                    </a>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  )
}

/* ───────────── página ───────────── */

/** tópicos que aparecem na página: usados para pôr primeiro o que é do mesmo assunto ao adicionar */
function useTopicosDaPagina(p: PaginaCaderno) {
  const quadro = useMapa((s) => s.quadro)
  const marcas = useMapa((s) => s.marcas)
  return useMemo(() => {
    const ids = new Set<string>()
    for (const b of p.blocos) {
      if (!b.ref) continue
      if (b.tipo === 'topico' || b.tipo === 'palavras' || b.tipo === 'nota' || b.tipo === 'explicacao') ids.add(b.ref)
      else if (b.tipo === 'marca') {
        const m = marcas.find((x) => x.id === b.ref)
        if (m) ids.add(m.topico)
      } else if (b.tipo === 'cartao') {
        const c = CARTOES.find((x) => x.id === b.ref)
        if (c) ids.add(c.topico)
      } else if (b.tipo === 'postit') {
        const t = quadro.find((x) => x.id === b.ref)?.topico
        if (t) ids.add(t)
      }
    }
    return ids
  }, [p.blocos, quadro, marcas])
}

function VerPagina({ p, apagou }: { p: PaginaCaderno; apagou: (p: PaginaCaderno) => void }) {
  const editar = useMapa((s) => s.editarPagina)
  const remover = useMapa((s) => s.removerPagina)
  const adicionarBloco = useMapa((s) => s.adicionarBloco)
  const removerBloco = useMapa((s) => s.removerBloco)
  const moverBloco = useMapa((s) => s.moverBloco)
  const caderno = useMapa((s) => s.caderno)
  const abas = useMapa((s) => s.abas)
  const [adicionando, setAdicionando] = useState(false)
  const [novo, setNovo] = useState<string | null>(null)
  const [tirado, setTirado] = useState<{ b: Bloco; i: number } | null>(null)
  const [apagar, setApagar] = useState(false)
  const topicos = useTopicosDaPagina(p)

  useEffect(() => {
    if (!tirado) return
    const t = setTimeout(() => setTirado(null), 8000)
    return () => clearTimeout(t)
  }, [tirado])

  // sugestões de assunto: os que você já usa, as abas da trilha e as unidades
  const assuntos = [...new Set([...caderno.map((x) => x.assunto.trim()).filter(Boolean), ...abas.map((a) => a.nome), ...UNIDADES.map((u) => u.titulo)])]

  const por = (b: Omit<Bloco, 'id'>) => {
    const id = adicionarBloco(p.id, b)
    setNovo(id)
    setAdicionando(false)
  }
  const tirar = (b: Bloco, i: number) => {
    removerBloco(p.id, b.id)
    setTirado({ b, i })
  }

  return (
    <article>
      <input
        value={p.titulo}
        onChange={(e) => editar(p.id, { titulo: e.target.value })}
        placeholder="Título da página"
        aria-label="título da página"
        autoFocus={!p.titulo && !p.blocos.length}
        className="w-full bg-transparent text-2xl font-semibold text-[var(--tinta-forte)] outline-none placeholder:text-[var(--tinta-suave)]/60 sm:text-3xl"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--tinta-suave)]">
        <label className="flex items-center gap-1.5">
          assunto
          <input
            value={p.assunto}
            onChange={(e) => editar(p.id, { assunto: e.target.value })}
            list="assuntos-caderno"
            placeholder="ex.: P2, Busca, revisão final"
            className="w-48 rounded-full border border-[var(--linha)] bg-[var(--cartao)] px-2.5 py-1 text-[var(--tinta-forte)] outline-none focus:border-[var(--foco)]"
          />
        </label>
        <datalist id="assuntos-caderno">
          {assuntos.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>
        <span>· editada em {new Date(p.em).toLocaleDateString('pt-BR')}</span>
        <span className="ml-auto">
          {apagar ? (
            <span className="flex items-center gap-2">
              apagar a página?
              <button
                className="font-semibold text-[var(--alerta)]"
                onClick={() => {
                  remover(p.id)
                  apagou(p)
                  location.hash = '#/caderno'
                }}
              >
                sim
              </button>
              <button onClick={() => setApagar(false)}>não</button>
            </span>
          ) : (
            <button className="hover:text-[var(--alerta)]" onClick={() => setApagar(true)}>
              apagar página
            </button>
          )}
        </span>
      </div>

      <div className="mt-6 space-y-3">
        {p.blocos.map((b, i) => (
          <Moldura key={b.id} b={b} subir={i > 0 ? () => moverBloco(p.id, b.id, i - 1) : undefined} descer={i < p.blocos.length - 1 ? () => moverBloco(p.id, b.id, i + 1) : undefined} tirar={() => tirar(b, i)}>
            <VerBloco b={b} pagina={p.id} novo={novo === b.id} />
          </Moldura>
        ))}
      </div>

      {tirado && (
        <p className="mt-3 text-center text-xs text-[var(--tinta-suave)]">
          {INFO[tirado.b.tipo].nome} tirado da página{tirado.b.tipo === 'foto' || tirado.b.tipo === 'audio' ? ' (o arquivo continua guardado)' : ''} ·{' '}
          <button
            className="font-semibold text-[var(--foco)] underline"
            onClick={() => {
              adicionarBloco(p.id, tirado.b, tirado.i)
              setTirado(null)
            }}
          >
            desfazer
          </button>
        </p>
      )}

      <div className="mt-6">
        {adicionando ? (
          <Adicionar pagina={p.id} topicos={topicos} por={por} fechar={() => setAdicionando(false)} />
        ) : (
          <div className="flex flex-wrap gap-2">
            <button className="botao-foco" onClick={() => setAdicionando(true)}>
              + adicionar
            </button>
            <button className="botao-suave" onClick={() => por({ tipo: 'texto', texto: '' })}>
              ¶ texto
            </button>
            <button className="botao-suave" onClick={() => por({ tipo: 'titulo', texto: '' })}>
              H título
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

/** caixa de cada bloco, com subir/descer/tirar */
function Moldura({ b, subir, descer, tirar, children }: { b: Bloco; subir?: () => void; descer?: () => void; tirar: () => void; children: ReactNode }) {
  const semCaixa = b.tipo === 'titulo' || b.tipo === 'texto'
  const botao = 'grid h-7 w-7 place-items-center rounded-full text-xs text-[var(--tinta-suave)] hover:bg-[var(--papel-2)] hover:text-[var(--tinta-forte)] disabled:opacity-30'
  return (
    <div className={`group relative ${semCaixa ? 'px-1' : 'rounded-2xl border border-[var(--linha)] bg-[var(--cartao)] p-4 shadow-[var(--sombra)]'}`}>
      {/* em tela de toque não há hover: os botões ficam sempre um pouco visíveis */}
      <div className="absolute -top-3 right-2 z-10 flex gap-0.5 rounded-full border border-[var(--linha)] bg-[var(--cartao)] px-0.5 opacity-60 shadow-sm transition-opacity focus-within:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:opacity-0">
        <button className={botao} onClick={subir} disabled={!subir} aria-label="subir">
          ↑
        </button>
        <button className={botao} onClick={descer} disabled={!descer} aria-label="descer">
          ↓
        </button>
        <button className={`${botao} hover:!text-[var(--alerta)]`} onClick={tirar} aria-label={`tirar ${INFO[b.tipo].nome} da página`}>
          ×
        </button>
      </div>
      {!semCaixa && <div className="rotulo-formula mb-2">{`${INFO[b.tipo].icone} ${INFO[b.tipo].nome}`}</div>}
      {children}
    </div>
  )
}

/* ───────────── blocos ───────────── */

function VerBloco({ b, pagina, novo }: { b: Bloco; pagina: string; novo: boolean }) {
  switch (b.tipo) {
    case 'titulo':
      return <BlocoTitulo b={b} pagina={pagina} novo={novo} />
    case 'texto':
      return <BlocoTexto b={b} pagina={pagina} novo={novo} />
    case 'foto':
      return <BlocoFoto b={b} pagina={pagina} />
    case 'audio':
      return <BlocoAudio b={b} />
    case 'slide':
      return <BlocoSlide b={b} pagina={pagina} />
    case 'postit':
      return <BlocoPostit b={b} />
    case 'cartao':
      return <BlocoCartao b={b} />
    case 'marca':
      return <BlocoMarca b={b} />
    case 'nota':
      return <BlocoNota b={b} />
    case 'explicacao':
      return <BlocoExplicacao b={b} />
    case 'topico':
      return <BlocoTopico b={b} />
    case 'palavras':
      return <BlocoPalavras b={b} />
    case 'trilha':
      return <BlocoTrilha b={b} />
  }
}

const Sumiu = ({ o }: { o: string }) => <p className="text-sm italic text-[var(--tinta-suave)]">{o} não existe mais (foi apagado em outro lugar). Dá para tirar este bloco.</p>

/** textarea que cresce com o texto e salva com um respiro */
function Campo({ valor, salvar, placeholder, className = '', foco = false, rotulo }: { valor: string; salvar: (t: string) => void; placeholder: string; className?: string; foco?: boolean; rotulo: string }) {
  const [texto, setTexto] = useState(valor)
  const ref = useRef<HTMLTextAreaElement>(null)
  const editando = useRef(false)
  useEffect(() => {
    // mudou em outro lugar (ex.: a anotação no tópico) e não é este campo que está sendo editado
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!editando.current) setTexto(valor)
  }, [valor])
  useEffect(() => {
    if (texto === valor) return
    const t = setTimeout(() => salvar(texto), 400)
    return () => clearTimeout(t)
  }, [texto, valor, salvar])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [texto])
  return (
    <textarea
      ref={ref}
      autoFocus={foco}
      value={texto}
      rows={1}
      aria-label={rotulo}
      onFocus={() => (editando.current = true)}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={() => {
        editando.current = false
        if (texto !== valor) salvar(texto)
      }}
      placeholder={placeholder}
      className={`block w-full resize-none overflow-hidden bg-transparent outline-none placeholder:text-[var(--tinta-suave)]/70 ${className}`}
    />
  )
}

function BlocoTitulo({ b, pagina, novo }: { b: Bloco; pagina: string; novo: boolean }) {
  const editar = useMapa((s) => s.editarBloco)
  return (
    <Campo
      valor={b.texto ?? ''}
      salvar={(texto) => editar(pagina, b.id, { texto })}
      foco={novo}
      rotulo="título"
      placeholder="Título da parte"
      className="pt-3 text-xl font-semibold text-[var(--tinta-forte)]"
    />
  )
}

/** texto seu: mostra formatado ($…$, **…**); clicar edita */
function BlocoTexto({ b, pagina, novo }: { b: Bloco; pagina: string; novo: boolean }) {
  const editar = useMapa((s) => s.editarBloco)
  const [editando, setEditando] = useState(novo || !b.texto)
  if (!editando)
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => !(e.target as HTMLElement).closest('a') && setEditando(true)}
        onKeyDown={(e) => e.key === 'Enter' && setEditando(true)}
        className="fonte-leitura cursor-text whitespace-pre-wrap rounded-lg py-1 text-[var(--tinta)] hover:bg-[var(--papel-2)]/60"
        title="clique para editar"
      >
        <Texto formulas="respiro">{b.texto ?? ''}</Texto>
      </div>
    )
  return (
    <div onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && b.texto && setEditando(false)}>
      <Campo
        valor={b.texto ?? ''}
        salvar={(texto) => editar(pagina, b.id, { texto })}
        foco={novo || editando}
        rotulo="texto"
        placeholder="Escreva aqui… ($fórmula$, **negrito**)"
        className="fonte-leitura rounded-lg bg-[var(--papel-2)]/60 px-2 py-1 text-[var(--tinta-forte)]"
      />
    </div>
  )
}

function Legenda({ b, pagina }: { b: Bloco; pagina: string }) {
  const editar = useMapa((s) => s.editarBloco)
  return <Campo valor={b.texto ?? ''} salvar={(texto) => editar(pagina, b.id, { texto })} rotulo="legenda" placeholder="legenda (opcional)" className="mt-2 text-sm text-[var(--tinta)]" />
}

/** imagem em tela cheia; clicar ou Esc fecha */
function TelaCheia({ src, legenda, fechar }: { src: string; legenda: string; fechar: () => void }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && fechar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [fechar])
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4" onClick={fechar} role="dialog" aria-label={legenda}>
      <img src={src} alt={legenda} className="max-h-full max-w-full rounded-xl object-contain shadow-2xl" />
      <span className="absolute bottom-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">{legenda} · clique para fechar</span>
    </div>
  )
}

function useUrlDoBlob(blob?: Blob) {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob])
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url])
  return url
}

function BlocoFoto({ b, pagina }: { b: Bloco; pagina: string }) {
  const [foto, setFoto] = useState<Blob | null | undefined>(undefined)
  const [grande, setGrande] = useState(false)
  useEffect(() => {
    if (!b.ref) return
    lerFoto(b.ref)
      .then((f) => setFoto(f?.blob ?? null))
      .catch(() => setFoto(null))
  }, [b.ref])
  const url = useUrlDoBlob(foto ?? undefined)
  if (foto === null) return <Sumiu o="Esta foto" />
  return (
    <figure className="m-0">
      {url ? (
        <button onClick={() => setGrande(true)} className="block overflow-hidden rounded-xl bg-[var(--papel-2)]" title="ampliar">
          <img src={url} alt={b.texto || 'foto do caderno'} className="block max-h-[28rem] w-auto max-w-full object-contain" />
        </button>
      ) : (
        <div className="h-40 animate-pulse rounded-xl bg-[var(--papel-2)]" />
      )}
      <Legenda b={b} pagina={pagina} />
      {grande && url && <TelaCheia src={url} legenda={b.texto || 'foto'} fechar={() => setGrande(false)} />}
    </figure>
  )
}

const deOnde = (g: Gravacao) => (g.topico.startsWith('caderno:') ? 'gravado no caderno' : `explicação de ${topicoPorId.get(g.topico)?.titulo ?? g.topico}`)

function BlocoAudio({ b }: { b: Bloco }) {
  const [g, setG] = useState<Gravacao | null | undefined>(undefined)
  useEffect(() => {
    if (!b.ref) return
    lerGravacao(b.ref)
      .then((x) => setG(x ?? null))
      .catch(() => setG(null))
  }, [b.ref])
  const url = useUrlDoBlob(g?.blob)
  if (g === null) return <Sumiu o="Esta gravação" />
  if (!g || !url) return <div className="h-9 animate-pulse rounded-full bg-[var(--papel-2)]" />
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap gap-x-3 text-xs text-[var(--tinta-suave)]">
        <span>{deOnde(g)}</span>
        <span>{new Date(g.em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
        <span>{mmss(g.duracao)}</span>
      </div>
      <audio controls preload="metadata" src={url} className="h-9 w-full" />
    </div>
  )
}

function BlocoSlide({ b, pagina }: { b: Bloco; pagina: string }) {
  const [grande, setGrande] = useState(false)
  const [arquivo, n] = (b.ref ?? '#').split('#')
  return (
    <figure className="m-0">
      <button onClick={() => setGrande(true)} className="block overflow-hidden rounded-xl border border-[var(--linha)] bg-white" title="ampliar">
        <img src={img(arquivo, Number(n))} alt={`slide ${n} de ${arquivo}`} loading="lazy" className="block max-h-80 w-auto max-w-full object-contain" />
      </button>
      <figcaption className="mt-1 text-[11px] text-[var(--tinta-suave)]">
        {arquivo} · p. {n}
      </figcaption>
      <Legenda b={b} pagina={pagina} />
      {grande && <Ampliado arquivo={arquivo} n={Number(n)} fechar={() => setGrande(false)} />}
    </figure>
  )
}

const FUNDO_POSTIT: Record<string, string> = {
  sol: 'color-mix(in srgb, var(--sol) 38%, white)',
  menta: 'var(--menta-claro)',
  foco: 'var(--foco-claro)',
  coral: 'color-mix(in srgb, var(--coral) 28%, white)',
  papel: 'var(--papel-2)',
}

function LinkTopico({ id }: { id: string }) {
  const selecionar = useMapa((s) => s.selecionar)
  const tp = topicoPorId.get(id)
  if (!tp) return null
  return (
    <button onClick={() => selecionar(id)} className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--tinta-suave)] hover:text-[var(--tinta-forte)] hover:underline">
      <span style={{ color: unidade(tp.unidade).cor }}>●</span> {tp.titulo} →
    </button>
  )
}

function BlocoPostit({ b }: { b: Bloco }) {
  const p = useMapa((s) => s.quadro.find((x) => x.id === b.ref))
  const atualizar = useMapa((s) => s.atualizarPostit)
  if (!p) return <Sumiu o="Este post-it" />
  return (
    <div>
      <div className="rounded-xl p-3" style={{ background: FUNDO_POSTIT[p.cor] }}>
        <Campo valor={p.texto} salvar={(texto) => atualizar(p.id, { texto })} rotulo="texto do post-it" placeholder="uma ideia…" className="text-[15px] leading-snug text-[var(--tinta-forte)]" />
      </div>
      {p.topico && <LinkTopico id={p.topico} />}
    </div>
  )
}

function BlocoCartao({ b }: { b: Bloco }) {
  const c = CARTOES.find((x) => x.id === b.ref)
  const [virado, setVirado] = useState(false)
  if (!c) return <Sumiu o="Este cartão" />
  return (
    <div>
      <p className="font-medium text-[var(--tinta-forte)]">
        <Texto>{c.pergunta}</Texto>
      </p>
      {virado ? (
        <div className="mt-3 border-t border-[var(--linha)] pt-3 text-sm text-[var(--tinta)]">
          {c.latex && (
            <div className="mb-2 overflow-x-auto">
              <Tex latex={c.latex} display />
            </div>
          )}
          {c.resposta && (
            <div className="whitespace-pre-wrap">
              <Texto>{c.resposta}</Texto>
            </div>
          )}
          <button className="mt-2 text-xs text-[var(--tinta-suave)] hover:underline" onClick={() => setVirado(false)}>
            esconder resposta
          </button>
        </div>
      ) : (
        <button className="mt-2 text-sm text-[var(--foco)] hover:underline" onClick={() => setVirado(true)}>
          ver resposta
        </button>
      )}
      <div>
        <LinkTopico id={c.topico} />
      </div>
    </div>
  )
}

function BlocoMarca({ b }: { b: Bloco }) {
  const m = useMapa((s) => s.marcas.find((x) => x.id === b.ref))
  if (!m) return <Sumiu o="Esta marca" />
  return (
    <div>
      <Contexto m={m} />
      <NotaDaMarca m={m} />
      <TagsDaMarca m={m} />
      <LinkTopico id={m.topico} />
    </div>
  )
}

function BlocoNota({ b }: { b: Bloco }) {
  const nota = useMapa((s) => s.notas[b.ref ?? ''])
  const salvar = useMapa((s) => s.salvarNota)
  if (!b.ref || !topicoPorId.has(b.ref)) return <Sumiu o="Este tópico" />
  return (
    <div>
      <Campo valor={nota?.texto ?? ''} salvar={(t) => salvar(b.ref!, t)} rotulo="anotação do tópico" placeholder="(a anotação deste tópico está vazia: escreva aqui)" className="text-sm text-[var(--tinta)]" />
      <LinkTopico id={b.ref} />
    </div>
  )
}

function BlocoExplicacao({ b }: { b: Bloco }) {
  const f = useMapa((s) => s.feynman[b.ref ?? ''])
  const salvar = useMapa((s) => s.salvarFeynman)
  if (!b.ref || !topicoPorId.has(b.ref)) return <Sumiu o="Este tópico" />
  return (
    <div>
      <Campo valor={f?.texto ?? ''} salvar={(texto) => salvar(b.ref!, { texto })} rotulo="explicação" placeholder="(ainda não há explicação escrita: escreva aqui)" className="fonte-leitura text-[var(--tinta)]" />
      {f?.travei && <p className="mt-2 text-xs text-[var(--alerta)]">Onde travou: {f.travei}</p>}
      <LinkTopico id={b.ref} />
    </div>
  )
}

function BlocoTopico({ b }: { b: Bloco }) {
  const tp = topicoPorId.get(b.ref ?? '')
  const entendi = useMapa((s) => !!s.estudados[b.ref ?? ''])
  const prof = useMapa((s) => s.profundidade[b.ref ?? ''])
  const selecionar = useMapa((s) => s.selecionar)
  if (!tp) return <Sumiu o="Este tópico" />
  const u = unidade(tp.unidade)
  return (
    <button onClick={() => selecionar(tp.id)} className="block w-full text-left">
      <div className="flex items-center gap-2">
        <span style={{ color: u.cor }}>●</span>
        <span className="font-semibold text-[var(--tinta-forte)]">{tp.titulo}</span>
        <span className="ml-auto text-xs text-[var(--tinta-suave)]">{entendi ? '✓ entendi' : prof !== undefined ? `lido até ${NOME_PROFUNDIDADE[Math.min(prof, NOME_PROFUNDIDADE.length - 1)]}` : 'não aberto'}</span>
      </div>
      <p className="mt-1 text-sm text-[var(--tinta)]">
        <Texto>{tp.resumo}</Texto>
      </p>
      <span className="mt-1 inline-block text-xs text-[var(--foco)]">abrir o tópico →</span>
    </button>
  )
}

function BlocoPalavras({ b }: { b: Bloco }) {
  const tp = topicoPorId.get(b.ref ?? '')
  if (!tp) return <Sumiu o="Este tópico" />
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {palavrasDoTopico(tp.id, 12).map((p) => (
          <span key={p} className="rounded-full bg-[var(--papel-2)] px-2.5 py-1 text-sm text-[var(--tinta-forte)]">
            <Texto>{p}</Texto>
          </span>
        ))}
      </div>
      <LinkTopico id={tp.id} />
    </div>
  )
}

function BlocoTrilha({ b }: { b: Bloco }) {
  const aba = useMapa((s) => s.abas.find((a) => a.id === b.ref))
  const estudados = useMapa((s) => s.estudados)
  const setAbaAtual = useMapa((s) => s.setAbaAtual)
  if (!aba) return <Sumiu o="Esta aba da trilha" />
  const feitos = aba.topicos.filter((t) => estudados[t]).length
  return (
    <div>
      <p className="font-semibold text-[var(--tinta-forte)]">{aba.nome}</p>
      {aba.descricao && <p className="text-sm text-[var(--tinta-suave)]">{aba.descricao}</p>}
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--papel-2)]">
        <div className="h-full rounded-full bg-[var(--menta)]" style={{ width: `${(feitos / Math.max(1, aba.topicos.length)) * 100}%` }} />
      </div>
      <p className="mt-1 text-xs text-[var(--tinta-suave)]">
        {feitos} de {aba.topicos.length} tópicos entendidos
      </p>
      <button
        className="mt-1 text-xs text-[var(--foco)] hover:underline"
        onClick={() => {
          setAbaAtual(aba.id)
          location.hash = '#/'
        }}
      >
        abrir esta trilha →
      </button>
    </div>
  )
}

/* ───────────── adicionar ───────────── */

interface Item {
  ref: string
  rotulo: string
  detalhe?: string
  topico?: string
  estilo?: React.CSSProperties
}

function Adicionar({ pagina, topicos, por, fechar }: { pagina: string; topicos: Set<string>; por: (b: Omit<Bloco, 'id'>) => void; fechar: () => void }) {
  const [tipo, setTipo] = useState<TipoBloco | null>(null)
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && (tipo ? setTipo(null) : fechar())
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [tipo, fechar])

  return (
    <div className="rounded-3xl border border-[var(--linha)] bg-[var(--cartao)] p-4 shadow-[var(--sombra)]">
      <div className="mb-3 flex items-center gap-2">
        {tipo && (
          <button className="botao-suave" onClick={() => setTipo(null)}>
            ←
          </button>
        )}
        <p className="mr-auto text-sm font-semibold text-[var(--tinta-forte)]">{tipo ? `${INFO[tipo].icone} ${INFO[tipo].nome}` : 'O que pôr na página?'}</p>
        <button className="botao-suave" onClick={fechar}>
          fechar
        </button>
      </div>
      {!tipo && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TIPOS.map((t) => (
            <button
              key={t.tipo}
              onClick={() => (t.tipo === 'titulo' || t.tipo === 'texto' ? por({ tipo: t.tipo, texto: '' }) : setTipo(t.tipo))}
              className="rounded-2xl border border-[var(--linha)] px-3 py-2.5 text-left transition-colors hover:border-[var(--foco)] hover:bg-[var(--foco-claro)]"
            >
              <span className="text-sm font-medium text-[var(--tinta-forte)]">
                {t.icone} {t.nome}
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-[var(--tinta-suave)]">{t.dica}</span>
            </button>
          ))}
        </div>
      )}
      {tipo === 'foto' && <AdicionarFoto por={por} />}
      {tipo === 'audio' && <AdicionarAudio pagina={pagina} por={por} />}
      {tipo === 'slide' && <AdicionarSlide por={por} topicos={topicos} />}
      {tipo && tipo !== 'foto' && tipo !== 'audio' && tipo !== 'slide' && <Escolher tipo={tipo} topicos={topicos} escolher={(ref) => por({ tipo, ref })} />}
    </div>
  )
}

const opcoesTopicos = (filtro: (id: string) => boolean = () => true): Item[] =>
  TOPICOS.filter((t) => filtro(t.id)).map((t) => ({ ref: t.id, rotulo: t.titulo, detalhe: unidade(t.unidade).titulo, topico: t.id }))

/** lista com busca; o que é dos tópicos já na página vem primeiro */
function Escolher({ tipo, topicos, escolher }: { tipo: TipoBloco; topicos: Set<string>; escolher: (ref: string) => void }) {
  const quadro = useMapa((s) => s.quadro)
  const marcas = useMapa((s) => s.marcas)
  const notas = useMapa((s) => s.notas)
  const feynman = useMapa((s) => s.feynman)
  const abas = useMapa((s) => s.abas)
  const [busca, setBusca] = useState('')

  const itens: Item[] = useMemo(() => {
    switch (tipo) {
      case 'postit':
        return quadro.filter((p) => p.texto.trim()).map((p) => ({ ref: p.id, rotulo: p.texto, topico: p.topico, estilo: { background: FUNDO_POSTIT[p.cor] } }))
      case 'cartao':
        return CARTOES.map((c) => ({ ref: c.id, rotulo: c.pergunta, detalhe: topicoPorId.get(c.topico)?.titulo, topico: c.topico }))
      case 'marca':
        return [...marcas].sort((a, b) => b.em - a.em).map((m) => ({ ref: m.id, rotulo: m.texto, detalhe: [topicoPorId.get(m.topico)?.titulo, m.nota].filter(Boolean).join(' · '), topico: m.topico, estilo: { background: TINTA[m.cor].fundo } }))
      case 'nota':
        return opcoesTopicos((id) => !!notas[id]?.texto.trim()).map((i) => ({ ...i, detalhe: notas[i.ref].texto.slice(0, 120) }))
      case 'explicacao':
        return opcoesTopicos((id) => !!feynman[id]?.texto.trim()).map((i) => ({ ...i, detalhe: feynman[i.ref].texto.slice(0, 120) }))
      case 'palavras':
        return opcoesTopicos((id) => palavrasDoTopico(id).length > 0).map((i) => ({ ...i, detalhe: palavrasDoTopico(i.ref, 5).join(', ') }))
      case 'topico':
        return opcoesTopicos()
      case 'trilha':
        return abas.map((a) => ({ ref: a.id, rotulo: a.nome, detalhe: `${a.topicos.length} tópicos${a.descricao ? ` · ${a.descricao}` : ''}` }))
      default:
        return []
    }
  }, [tipo, quadro, marcas, notas, feynman, abas])

  const q = busca.trim().toLowerCase()
  const lista = itens
    .filter((i) => !q || `${i.rotulo} ${i.detalhe ?? ''}`.toLowerCase().includes(q))
    .sort((a, b) => Number(!!b.topico && topicos.has(b.topico)) - Number(!!a.topico && topicos.has(a.topico)))
    .slice(0, 60)

  const vazio: Partial<Record<TipoBloco, string>> = {
    postit: 'Você ainda não tem post-its com texto. Eles nascem no Quadro de ideias.',
    marca: 'Você ainda não marcou nenhum trecho. Selecione um texto dentro de um tópico para marcar.',
    nota: 'Nenhum tópico tem anotação ainda. Escolha "tópico" ou escreva um texto direto aqui.',
    explicacao: 'Você ainda não escreveu nenhuma explicação. Ela fica no fim de cada tópico, em "Mais jeitos de revisar".',
  }

  return (
    <div>
      {itens.length > 6 && (
        <input
          autoFocus
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="procurar…"
          className="mb-3 w-full rounded-full border border-[var(--linha)] bg-[var(--papel)] px-3 py-1.5 text-sm outline-none focus:border-[var(--foco)]"
        />
      )}
      {!itens.length && <p className="text-sm text-[var(--tinta-suave)]">{vazio[tipo] ?? 'Nada para escolher.'}</p>}
      {topicos.size > 0 && itens.some((i) => i.topico && topicos.has(i.topico)) && <p className="mb-2 text-[11px] text-[var(--tinta-suave)]">Primeiro o que é dos tópicos que já estão nesta página.</p>}
      <ul className="max-h-96 space-y-1.5 overflow-y-auto pr-1">
        {lista.map((i) => (
          <li key={i.ref}>
            <button onClick={() => escolher(i.ref)} className="w-full rounded-xl border border-[var(--linha)] px-3 py-2 text-left transition-colors hover:border-[var(--foco)]" style={i.estilo}>
              <span className="line-clamp-2 text-sm text-[var(--tinta-forte)]">
                <Texto>{i.rotulo}</Texto>
              </span>
              {i.detalhe && <span className="mt-0.5 line-clamp-1 block text-[11px] text-[var(--tinta-suave)]">{i.detalhe}</span>}
            </button>
          </li>
        ))}
      </ul>
      {itens.length > lista.length && !q && <p className="mt-2 text-[11px] text-[var(--tinta-suave)]">Mostrando 60 de {itens.length}. Procure para achar os outros.</p>}
    </div>
  )
}

function AdicionarFoto({ por }: { por: (b: Omit<Bloco, 'id'>) => void }) {
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  const pegar = async (arquivos: FileList | null) => {
    if (!arquivos?.length) return
    setOcupado(true)
    setErro('')
    try {
      // uma de cada vez, na ordem escolhida
      const ids: string[] = []
      for (const a of [...arquivos]) ids.push(await guardarFoto(a))
      ids.forEach((ref) => por({ tipo: 'foto', ref, texto: '' }))
    } catch {
      setErro('Não consegui guardar a foto (o navegador pode estar sem espaço).')
    } finally {
      setOcupado(false)
    }
  }
  return (
    <div>
      <label className={`botao-foco inline-block cursor-pointer ${ocupado ? 'opacity-60' : ''}`}>
        {ocupado ? 'guardando…' : 'escolher foto(s)'}
        <input type="file" accept="image/*" multiple className="sr-only" disabled={ocupado} onChange={(e) => pegar(e.target.files)} />
      </label>
      <p className="mt-2 text-xs text-[var(--tinta-suave)]">No celular dá para tirar a foto na hora. Ela é reduzida para não ocupar muito, fica só neste navegador e entra no backup em JSON (não vai para a nuvem).</p>
      {erro && <p className="mt-2 text-sm text-[var(--alerta)]">{erro}</p>}
    </div>
  )
}

function AdicionarAudio({ pagina, por }: { pagina: string; por: (b: Omit<Bloco, 'id'>) => void }) {
  const { gravando, segundos, erro, comecar, parar, suporta } = useGravar(`caderno:${pagina}`, (g) => por({ tipo: 'audio', ref: g.id }))
  const [lista, setLista] = useState<Gravacao[] | null>(null)
  useEffect(() => {
    todasGravacoes()
      .then((gs) => setLista(gs.sort((a, b) => b.em - a.em)))
      .catch(() => setLista([]))
  }, [])
  return (
    <div>
      {suporta ? (
        gravando ? (
          <button className="flex items-center gap-2 rounded-full bg-[var(--coral)] px-4 py-2 text-sm font-semibold text-white" onClick={parar}>
            <span className="h-2.5 w-2.5 animate-pulse rounded-sm bg-white" /> parar · {mmss(segundos)}
          </button>
        ) : (
          <button className="botao-foco" onClick={comecar}>
            🎙 gravar agora
          </button>
        )
      ) : (
        <p className="text-sm text-[var(--tinta-suave)]">Este navegador não grava áudio.</p>
      )}
      {erro && <p className="mt-2 text-sm text-[var(--alerta)]">{erro}</p>}
      {!!lista?.length && (
        <>
          <p className="mb-1.5 mt-4 text-xs text-[var(--tinta-suave)]">ou traga uma que já existe:</p>
          <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {lista.map((g) => (
              <li key={g.id}>
                <button onClick={() => por({ tipo: 'audio', ref: g.id })} className="w-full rounded-xl border border-[var(--linha)] px-3 py-2 text-left text-sm hover:border-[var(--foco)]">
                  {deOnde(g)}
                  <span className="ml-2 text-[11px] text-[var(--tinta-suave)]">
                    {new Date(g.em).toLocaleDateString('pt-BR')} · {mmss(g.duracao)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

/** as páginas que você fixou nos tópicos, ou qualquer página de qualquer aula */
function AdicionarSlide({ por, topicos }: { por: (b: Omit<Bloco, 'id'>) => void; topicos: Set<string> }) {
  const fixados = useMapa((s) => s.slidesFixados)
  const [indice, setIndice] = useState<Indice | null | undefined>(undefined)
  const [pasta, setPasta] = useState('')
  const [n, setN] = useState(1)
  useEffect(() => {
    lerIndice().then((i) => {
      setIndice(i)
      if (i) setPasta(Object.keys(i)[0] ?? '')
    })
  }, [])
  if (indice === undefined) return <p className="text-sm text-[var(--tinta-suave)]">procurando os slides…</p>
  if (!indice)
    return <p className="text-sm text-[var(--tinta-suave)]">Os slides não estão neste computador (eles não vão para o site publicado). No seu computador, rode “npm run slides” uma vez.</p>

  const fixadas = Object.entries(fixados)
    .flatMap(([t, ps]) => ps.map((k) => ({ t, k })))
    .sort((a, b) => Number(topicos.has(b.t)) - Number(topicos.has(a.t)))
  const total = indice[pasta] ?? 1

  return (
    <div>
      {fixadas.length > 0 && (
        <>
          <p className="mb-1.5 text-xs text-[var(--tinta-suave)]">as que você fixou nos tópicos:</p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
            {fixadas.map(({ t, k }) => {
              const [a, p] = k.split('#')
              return (
                <button key={`${t}${k}`} onClick={() => por({ tipo: 'slide', ref: k, texto: '' })} className="shrink-0 overflow-hidden rounded-xl border border-[var(--linha)] bg-white text-left hover:border-[var(--foco)]">
                  <img src={img(a, Number(p))} alt={`slide ${p} de ${a}`} loading="lazy" className="block h-28 w-auto max-w-none" />
                  <span className="block max-w-44 truncate bg-[var(--cartao)] px-2 py-1 text-[10px] text-[var(--tinta-suave)]">
                    {topicoPorId.get(t)?.titulo} · p. {p}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}
      <p className="mb-1.5 mt-3 text-xs text-[var(--tinta-suave)]">ou qualquer página:</p>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <select value={pasta} onChange={(e) => (setPasta(e.target.value), setN(1))} className="max-w-full rounded-full border border-[var(--linha)] bg-[var(--papel)] px-3 py-1.5" aria-label="aula">
          {Object.keys(indice).map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5">
          página
          <input type="number" min={1} max={total} value={n} onChange={(e) => setN(Math.max(1, Math.min(total, Number(e.target.value) || 1)))} className="w-20 rounded-full border border-[var(--linha)] bg-[var(--papel)] px-3 py-1.5" />
          <span className="text-xs text-[var(--tinta-suave)]">de {total}</span>
        </label>
      </div>
      {pasta && (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <img src={img(pasta, n)} alt={`slide ${n} de ${pasta}`} className="block h-40 w-auto max-w-full rounded-xl border border-[var(--linha)] bg-white" />
          <button className="botao-foco" onClick={() => por({ tipo: 'slide', ref: `${pasta}#${n}`, texto: '' })}>
            pôr esta página
          </button>
        </div>
      )}
    </div>
  )
}

/* ───────────── levar do tópico para o caderno ───────────── */

/**
 * Põe o tópico na página aberta por último ou, se não houver, numa página nova com o nome dele.
 * Devolve a página usada.
 */
export function levarTopicoAoCaderno(topico: string): PaginaCaderno {
  const s = useMapa.getState()
  const tp = topicoPorId.get(topico)!
  const atual = s.caderno.find((p) => p.id === s.paginaAtual)
  if (atual) {
    if (!atual.blocos.some((b) => b.tipo === 'topico' && b.ref === topico)) s.adicionarBloco(atual.id, { tipo: 'topico', ref: topico })
    return useMapa.getState().caderno.find((p) => p.id === atual.id)!
  }
  const id = s.criarPagina({ titulo: tp.titulo, assunto: unidade(tp.unidade).titulo, blocos: [{ id: novoId('b'), tipo: 'topico', ref: topico }] })
  return useMapa.getState().caderno.find((p) => p.id === id)!
}

