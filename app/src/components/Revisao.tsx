import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { CARTOES, NOME_TIPO, ULTIMA_CAIXA, type Cartao, type Nota, type TipoCartao } from '../content/cartoes'
import { topicoPorId, UNIDADES, unidadePorId } from '../content/topicos'
import type { UnidadeId } from '../content/tipos'
import { useMapa, type FeedbackCartao } from '../store/useMapa'
import { todasGravacoes, type Gravacao } from '../lib/gravacoes'
import { Tex } from './FormulaAnimada'
import { Ampliado, img, lerIndice, type Indice } from './Slides'
import { Texto } from './Texto'
import { ABAS_REVISAO, NOMES_REVISAO, voltarDasPaginas, type AbaRevisao } from '../lib/paineis'
import { ListaRelembrar, useAgora } from './Relembrar'
import { PontosFracos, Progresso, usePontosFracos, useTopicosDaAba, Vazio } from './Painel'
import { voltaEm } from '../lib/revisita'
import { cobertura } from '../lib/cobertura'
import { formatarTempo, tempoTotal } from '../lib/tempo'
import { useTreinosHoje } from './Treino'
import { LinkAjuda } from './LinkAjuda'

const TIPOS: { id: TipoCartao | 'todos'; nome: string }[] = [
  { id: 'todos', nome: 'tudo' },
  ...(Object.keys(NOME_TIPO) as TipoCartao[]).map((id) => ({ id, nome: NOME_TIPO[id].varios })),
]

const NOTAS: { nota: Nota; rotulo: string; tecla: string; cor: string; fundo: string }[] = [
  { nota: 'errei', rotulo: 'errei', tecla: '1', cor: 'var(--alerta)', fundo: 'var(--alerta-claro)' },
  { nota: 'dificil', rotulo: 'difícil', tecla: '2', cor: 'var(--foco)', fundo: 'var(--foco-claro)' },
  { nota: 'acertei', rotulo: 'acertei', tecla: '3', cor: 'var(--menta)', fundo: 'var(--menta-claro)' },
]

type Faltou = FeedbackCartao['faltou'][number]
const FALTOU: { id: Faltou; texto: string }[] = [
  { id: 'ideia-central', texto: 'faltou a ideia central' },
  { id: 'detalhe', texto: 'faltou um detalhe' },
  { id: 'formula', texto: 'faltou a fórmula' },
  { id: 'exemplo', texto: 'faltou um exemplo' },
  { id: 'confundi', texto: 'confundi com outra coisa' },
]

/** Números pequenos ao lado de cada aba: o que tem para fazer ou ver em cada uma. */
function useContagens(): Partial<Record<AbaRevisao, { n: number; alerta?: boolean }>> {
  const cartoes = useMapa((s) => s.cartoes)
  const revisitas = useMapa((s) => s.revisitas)
  const intervalos = useMapa((s) => s.estudo.intervalos)
  const feynman = useMapa((s) => s.feynman)
  const fixados = useMapa((s) => s.slidesFixados)
  const { fracos, perigosas } = usePontosFracos()
  const agora = useAgora(60_000)
  return {
    cartoes: { n: CARTOES.filter((c) => cartoes[c.id] && cartoes[c.id].volta <= agora).length, alerta: true },
    relembrar: { n: Object.entries(revisitas).filter(([id, r]) => topicoPorId.has(id) && voltaEm(r, intervalos) <= agora).length, alerta: true },
    fracos: { n: fracos.length + perigosas.length, alerta: true },
    explicar: { n: Object.keys(feynman).filter((id) => topicoPorId.has(id) && (feynman[id].texto.trim() || feynman[id].travei?.trim())).length },
    slides: { n: Object.entries(fixados).reduce((n, [t, ps]) => n + (topicoPorId.has(t) ? ps.length : 0), 0) },
  }
}

/** Só as atividades: "Seu progresso" não é um jeito de revisar, fica num cartão à parte no topo. */
const ATIVIDADES = ABAS_REVISAO.filter((a) => a !== 'progresso')

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

/** Página cheia de revisão: cada jeito de revisar numa aba. A sessão de cartões continua montada ao trocar de aba. */
export function TelaRevisao({ aba }: { aba: AbaRevisao }) {
  const abrir = (topico: string) => useMapa.getState().selecionar(topico)
  const irPara = (a: AbaRevisao) => location.replace(`#/revisao/${a}`)
  const contagens = useContagens()
  const treinos = useTreinosHoje()
  const agora = useAgora(60_000)
  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || (e.target as HTMLElement).closest?.('input, select, textarea')) return
      // um slide ampliado fecha primeiro (ele cuida do próprio Esc)
      if (document.querySelector('[data-ampliado]')) return
      voltarDasPaginas()
    }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [])
  const info = NOMES_REVISAO[aba]
  const data = new Date(agora).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const hoje = data.charAt(0).toUpperCase() + data.slice(1)

  // o que está vencido hoje, em palavras
  const pendentes = [
    contagens.cartoes?.n ? plural(contagens.cartoes.n, 'cartão', 'cartões') : '',
    contagens.relembrar?.n ? plural(contagens.relembrar.n, 'tópico para relembrar', 'tópicos para relembrar') : '',
    treinos ? plural(treinos, 'cálculo para treinar', 'cálculos para treinar') : '',
  ].filter(Boolean)

  const Contagem = ({ n, alerta, ativa }: { n?: number; alerta?: boolean; ativa: boolean }) => {
    if (!n) return null
    return (
      <span
        className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${ativa ? 'bg-white/25 text-white' : alerta ? 'bg-[var(--coral)] text-white' : 'bg-[var(--papel-2)] text-[var(--tinta-suave)]'}`}
      >
        {n > 99 ? '99+' : n}
      </span>
    )
  }

  const botaoAba = 'flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors'
  const inativa = 'bg-[var(--cartao)] text-[var(--tinta)] ring-1 ring-[var(--linha)] hover:ring-[var(--tinta-suave)] lg:bg-transparent lg:ring-0 lg:hover:bg-[var(--papel-2)]'

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-dvh bg-[var(--papel)] text-[var(--tinta)]">
      {/* barra fina que acompanha a rolagem: só o caminho de volta */}
      <div className="sticky top-0 z-20 border-b border-[var(--linha)] bg-[var(--papel)]/90 backdrop-blur" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-5 py-2.5 sm:px-8">
          <button className="botao-suave shrink-0" onClick={voltarDasPaginas} title="Esc também volta">
            ← voltar
          </button>
          <span className="truncate text-sm font-medium text-[var(--tinta-suave)]">
            Revisão <span aria-hidden>·</span> {info.nome}
          </span>
        </div>
      </div>

      {/* topo da página: título grande, o que tem para hoje e, à parte, o seu progresso */}
      <header className="border-b border-[var(--linha)] bg-[var(--papel-2)]/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-5 sm:px-8 sm:py-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-medium text-[var(--tinta-suave)]">{hoje}</div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--tinta-forte)] sm:text-4xl">Revisão</h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-[var(--tinta)]">
              {pendentes.length ? (
                <>
                  <span className="font-semibold text-[var(--tinta-forte)]">Para hoje:</span> {pendentes.join(' · ')}.
                </>
              ) : (
                'Nada vencido hoje. Dá para adiantar os cartões ou rever seus pontos fracos.'
              )}
            </p>
          </div>
          <CartaoProgresso ativo={aba === 'progresso'} onClick={() => irPara('progresso')} />
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-5 pb-40 pt-8 sm:px-8 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12 lg:pt-10">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rotulo-formula mb-3">jeitos de revisar</div>
          {/* lista ao lado em tela larga, grade de botões em tela estreita */}
          <nav role="tablist" aria-label="jeitos de revisar" aria-orientation="vertical" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1 lg:gap-1">
            {ATIVIDADES.map((a) => {
              const ativa = aba === a
              const c = contagens[a]
              return (
                <button
                  key={a}
                  role="tab"
                  aria-selected={ativa}
                  onClick={() => irPara(a)}
                  className={`${botaoAba} ${ativa ? 'bg-[var(--foco)] font-medium text-white shadow-[var(--sombra)]' : inativa}`}
                >
                  <span aria-hidden>{NOMES_REVISAO[a].icone}</span>
                  <span className="min-w-0 leading-tight">{NOMES_REVISAO[a].nome}</span>
                  <Contagem n={c?.n} alerta={c?.alerta} ativa={ativa} />
                </button>
              )
            })}
            <a href="#/treino" className={`${botaoAba} ${inativa}`} title="Abre a página de treino de cálculo">
              <span aria-hidden>{NOMES_REVISAO.treino.icone}</span>
              <span className="min-w-0 leading-tight">{NOMES_REVISAO.treino.nome}</span>
              {treinos ? (
                <Contagem n={treinos} alerta ativa={false} />
              ) : (
                <span className="ml-auto text-[var(--tinta-suave)]" aria-hidden>
                  ↗
                </span>
              )}
            </a>
          </nav>
        </aside>

        <main className="mt-10 min-w-0 max-w-3xl lg:mt-0">
          <header className="mb-8">
            {aba === 'progresso' && (
              <button className="mb-3 text-sm text-[var(--tinta-suave)] hover:text-[var(--tinta)]" onClick={() => irPara('cartoes')}>
                ← voltar às atividades
              </button>
            )}
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--tinta-forte)]">
              <span className="mr-2" aria-hidden>
                {info.icone}
              </span>
              {info.nome} <LinkAjuda secao="revisao" className="ml-1" />
            </h2>
          </header>

          <div hidden={aba !== 'cartoes'}>
            <Sessao ativa={aba === 'cartoes'} abrir={abrir} />
          </div>
          {aba === 'relembrar' && <ListaRelembrar abrir={abrir} grande />}
          {aba === 'fracos' && <PontosFracos abrir={abrir} />}
          {aba === 'explicar' && <RevisarExplicacoes abrir={abrir} />}
          {aba === 'slides' && <RevisarSlides abrir={abrir} />}
          {aba === 'progresso' && <Progresso abrir={abrir} />}
        </main>
      </div>
    </motion.div>
  )
}

/** Cartão do topo com o seu progresso. Não é uma atividade: é um resumo que abre o relatório completo. */
function CartaoProgresso({ ativo, onClick }: { ativo: boolean; onClick: () => void }) {
  const tempo = useMapa((s) => s.tempo)
  const total = tempoTotal(tempo, Object.keys(tempo))
  const { aba, ids } = useTopicosDaAba()
  const buracos = useMemo(() => cobertura(ids).filter((c) => c.falta.length).length, [ids])
  return (
    <button
      onClick={onClick}
      aria-current={ativo ? 'page' : undefined}
      className={`group w-full shrink-0 rounded-xl border bg-[var(--cartao)] px-4 py-2.5 text-left transition-shadow md:w-60 ${ativo ? 'border-[var(--foco)] ring-2 ring-[var(--foco)]' : 'border-[var(--linha)] hover:shadow-[var(--sombra)]'}`}
    >
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[var(--tinta-suave)]">
        <span>
          {NOMES_REVISAO.progresso.icone} {NOMES_REVISAO.progresso.nome}
        </span>
        <span className="normal-case tracking-normal transition-transform group-hover:translate-x-0.5" aria-hidden>
          {ativo ? 'aberto' : 'ver →'}
        </span>
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-lg font-semibold tabular-nums text-[var(--tinta-forte)]">{formatarTempo(total)}</span>
        <span className="text-xs text-[var(--tinta-suave)]">de estudo</span>
      </div>
      <div className="text-xs text-[var(--tinta-suave)]">
        {buracos ? `${buracos} de ${ids.length} tópicos com buraco` : 'Nenhum tópico com buraco'}
        {aba && <span> ({aba.nome})</span>}
      </div>
    </button>
  )
}

function Sessao({ ativa, abrir }: { ativa: boolean; abrir: (topico: string) => void }) {
  const { cartoes, responderCartao, zerarCartoes } = useMapa()
  const escrever = useMapa((s) => s.estudo.escreverCartao)
  const [unidade, setUnidade] = useState<UnidadeId | 'todas'>('todas')
  const [tipo, setTipo] = useState<TipoCartao | 'todos'>('todos')
  const [inicio, setInicio] = useState(() => Date.now())
  // progresso no começo da sessão: responder não reordena a fila no meio
  const [retrato, setRetrato] = useState(cartoes)
  const [fila, setFila] = useState<string[] | null>(null)
  const [virado, setVirado] = useState(false)
  const [feitos, setFeitos] = useState(0)
  const [zerando, setZerando] = useState(false)

  const filtrados = useMemo(
    () => CARTOES.filter((c) => (unidade === 'todas' || c.unidade === unidade) && (tipo === 'todos' || c.tipo === tipo)),
    [unidade, tipo],
  )
  // a fila é montada na hora em que a sessão começa e só muda com as respostas
  const pendentes = useMemo(() => {
    const vencidos = filtrados.filter((c) => retrato[c.id] && retrato[c.id].volta <= inicio).sort((a, b) => retrato[a.id].volta - retrato[b.id].volta)
    const novos = filtrados.filter((c) => !retrato[c.id]).sort((a, b) => a.etapa - b.etapa)
    return [...vencidos, ...novos].map((c) => c.id)
  }, [filtrados, inicio, retrato])
  const filaAtual = fila ?? pendentes
  const cartao: Cartao | undefined = CARTOES.find((c) => c.id === filaAtual[0])

  const porCaixa = Array.from({ length: ULTIMA_CAIXA + 1 }, (_, i) => filtrados.filter((c) => cartoes[c.id]?.caixa === i).length)
  const novos = filtrados.filter((c) => !cartoes[c.id]).length

  const recomecar = () => {
    setFila(null)
    setFeitos(0)
    setVirado(false)
    setInicio(Date.now())
    setRetrato(useMapa.getState().cartoes)
  }
  const filtrar = (f: () => void) => {
    f()
    setFila(null)
    setVirado(false)
  }

  const responder = (nota: Nota) => {
    if (!cartao) return
    responderCartao(cartao.id, nota, Date.now())
    const resto = filaAtual.slice(1)
    // quem errou volta no fim desta sessão
    setFila(nota === 'acertei' ? resto : [...resto, cartao.id])
    setFeitos((n) => n + 1)
    setVirado(false)
  }

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (!ativa || (e.target as HTMLElement).closest?.('input, select, textarea')) return
      if (!escrever && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        setVirado((v) => !v)
      } else if (virado) {
        const n = NOTAS.find((x) => x.tecla === e.key)
        if (n) document.getElementById(`nota-${n.nota}`)?.click()
      }
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  })

  const cor = cartao ? unidadePorId.get(cartao.unidade)!.cor : 'var(--foco)'
  const chip = (ativo: boolean) =>
    `rounded-full px-3 py-1.5 text-sm transition-colors ${ativo ? 'bg-[var(--tinta-forte)] text-[var(--papel)]' : 'bg-[var(--papel-2)] text-[var(--tinta)] hover:bg-[var(--linha)]'}`
  const total = feitos + filaAtual.length

  return (
    <div>
      {/* o que entra na sessão */}
      <section className="rounded-3xl border border-[var(--linha)] bg-[var(--cartao)] p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:gap-6">
          <label className="block">
            <span className="rotulo-formula">unidade</span>
            <select
              value={unidade}
              onChange={(e) => filtrar(() => setUnidade(e.target.value as UnidadeId | 'todas'))}
              className="mt-2 w-full rounded-xl border border-[var(--linha)] bg-[var(--papel)] px-3 py-2 text-sm text-[var(--tinta)] outline-none focus:border-[var(--foco)]"
            >
              <option value="todas">todas as unidades</option>
              {UNIDADES.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.id.toUpperCase()} · {u.titulo}
                </option>
              ))}
            </select>
          </label>
          <div>
            <span className="rotulo-formula">tipo de cartão</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {TIPOS.map((t) => (
                <button key={t.id} onClick={() => filtrar(() => setTipo(t.id))} className={chip(tipo === t.id)}>
                  {t.nome}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-[var(--linha)] pt-5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="rotulo-formula">onde estão os {filtrados.length} cartões</span>
            <span className="text-xs text-[var(--tinta-suave)]">caixa maior = volta mais tarde</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {[{ rotulo: 'novos', n: novos }, ...porCaixa.map((n, i) => ({ rotulo: `caixa ${i + 1}`, n }))].map((x) => (
              <div key={x.rotulo} className={`rounded-2xl px-3 py-2.5 ${x.n ? 'bg-[var(--papel-2)]' : 'bg-[var(--papel)]'}`}>
                <div className={`text-xl font-semibold tabular-nums ${x.n ? 'text-[var(--tinta-forte)]' : 'text-[var(--tinta-suave)]'}`}>{x.n}</div>
                <div className="mt-0.5 text-xs text-[var(--tinta-suave)]">{x.rotulo}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* a sessão */}
      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between gap-3 text-sm">
          <span className="font-medium text-[var(--tinta-forte)]">{total ? `${feitos} de ${total} nesta sessão` : 'Sessão'}</span>
          <span className="text-[var(--tinta-suave)]">{filaAtual.length} na fila</span>
        </div>
        <div className="mb-6 h-2 overflow-hidden rounded-full bg-[var(--papel-2)]">
          <motion.div className="h-full rounded-full bg-[var(--foco)]" animate={{ width: `${(feitos / Math.max(1, total)) * 100}%` }} />
        </div>

        {cartao ? (
          <AnimatePresence mode="wait">
            <motion.div key={cartao.id + feitos} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
              <CartaoAtual
                cartao={cartao}
                cor={cor}
                caixa={cartoes[cartao.id]?.caixa}
                escrever={escrever}
                virado={virado}
                virar={() => setVirado(true)}
                responder={responder}
                abrirTopico={() => abrir(cartao.topico)}
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="rounded-3xl border border-[var(--linha)] bg-[var(--cartao)] px-6 py-12 text-center shadow-[var(--sombra)]">
            <div className="text-4xl" aria-hidden>
              {feitos ? '🎉' : '☕'}
            </div>
            <p className="mt-4 text-xl font-semibold text-[var(--tinta-forte)]">{feitos ? 'Sessão concluída.' : 'Nada para revisar agora.'}</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--tinta-suave)]">
              {feitos ? `${feitos} respostas. ` : ''}Os cartões que você acertou voltam em 1, 3, 7 e 15 dias. Troque a unidade ou o tipo acima para ver outros.
            </p>
            <button className="botao-foco mt-6" onClick={recomecar}>
              conferir de novo
            </button>
          </div>
        )}

        <p className="mt-5 text-center text-xs leading-relaxed text-[var(--tinta-suave)]">
          errei volta no fim da sessão · acertei sobe uma caixa{!escrever && ' · espaço vira o cartão'}
        </p>
      </section>

      {/* longe do resto de propósito: apaga tudo */}
      <div className="mt-16 flex flex-wrap items-center justify-end gap-3 border-t border-[var(--linha)] pt-6 text-xs text-[var(--tinta-suave)]">
        {zerando ? (
          <>
            <span>Apagar o progresso de todos os cartões? Não dá para desfazer.</span>
            <button className="rounded-full bg-[var(--alerta-claro)] px-3 py-1.5 font-semibold text-[var(--alerta)]" onClick={() => (zerarCartoes(), recomecar(), setZerando(false))}>
              sim, apagar
            </button>
            <button className="rounded-full px-3 py-1.5 hover:bg-[var(--papel-2)]" onClick={() => setZerando(false)}>
              cancelar
            </button>
          </>
        ) : (
          <button className="hover:text-[var(--alerta)]" onClick={() => setZerando(true)}>
            zerar o progresso dos cartões
          </button>
        )}
      </div>
    </div>
  )
}

interface PropsCartao {
  cartao: Cartao
  cor: string
  caixa?: number
  escrever: boolean
  virado: boolean
  virar: () => void
  responder: (n: Nota) => void
  abrirTopico: () => void
}

/** Um cartão: você escreve (ou só pensa), vira, compara e diz o que faltou. */
function CartaoAtual({ cartao, cor, caixa, escrever, virado, virar, responder, abrirTopico }: PropsCartao) {
  const anterior = useMapa((s) => s.feedbackCartoes[cartao.id])
  const darFeedback = useMapa((s) => s.darFeedbackCartao)
  const tp = topicoPorId.get(cartao.topico)
  const [escrito, setEscrito] = useState('')
  const [faltou, setFaltou] = useState<Faltou[]>([])
  const [dividir, setDividir] = useState(false)
  const [confuso, setConfuso] = useState(false)
  const [comentario, setComentario] = useState('')

  const alternar = (f: Faltou) => setFaltou((x) => (x.includes(f) ? x.filter((y) => y !== f) : [...x, f]))
  const chip = (ativo: boolean, alerta = false) =>
    `rounded-full border px-3 py-1.5 text-sm transition-colors ${ativo ? (alerta ? 'border-[var(--alerta)] bg-[var(--alerta-claro)] text-[var(--alerta)]' : 'border-[var(--foco)] bg-[var(--foco-claro)] text-[var(--foco)]') : 'border-[var(--linha)] text-[var(--tinta-suave)] hover:border-[var(--tinta-suave)]'}`

  const dar = (nota: Nota) => {
    // guarda o que você escreveu e o que marcou, para ler depois (você ou uma IA)
    if (escrito.trim() || faltou.length || dividir || confuso || comentario.trim()) darFeedback(cartao.id, { escrito: escrito.trim(), faltou, dividir, confuso, comentario: comentario.trim() })
    responder(nota)
  }

  return (
    <div className="rounded-3xl border border-[var(--linha)] bg-[var(--cartao)] px-6 py-7 shadow-[var(--sombra)] sm:px-10 sm:py-9" style={{ borderTop: `5px solid ${cor}` }}>
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em]">
        <span style={{ color: cor }}>
          {cartao.unidade.toUpperCase()} · {NOME_TIPO[cartao.tipo].um}
        </span>
        <span className="rounded-full bg-[var(--papel-2)] px-2.5 py-1 text-[var(--tinta-suave)]">{caixa !== undefined ? `caixa ${caixa + 1}` : 'novo'}</span>
      </div>
      <p className="fonte-leitura mt-5 font-medium !leading-snug text-[var(--tinta-forte)]" style={{ fontSize: 'calc(var(--leitura-tamanho, 1.125rem) * 1.35)' }}>
        <Texto>{cartao.pergunta}</Texto>
      </p>
      {anterior && (anterior.dividir || anterior.confuso || anterior.comentario) && (
        <p className="mt-3 rounded-xl bg-[var(--papel-2)] px-3 py-2 text-xs text-[var(--tinta-suave)]">
          Da última vez você anotou: {[anterior.dividir && 'devia virar dois cartões', anterior.confuso && 'cartão confuso', anterior.comentario && `“${anterior.comentario}”`].filter(Boolean).join(' · ')}
        </p>
      )}

      {!virado ? (
        escrever ? (
          <div className="mt-7">
            <textarea
              autoFocus
              value={escrito}
              onChange={(e) => setEscrito(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) virar()
              }}
              rows={5}
              placeholder="Escreva a resposta do seu jeito, sem olhar. Pode ser curta."
              className="fonte-leitura w-full resize-y rounded-2xl border-2 border-[var(--linha)] bg-[var(--papel)] px-5 py-4 leading-relaxed text-[var(--tinta-forte)] outline-none focus:border-[var(--foco)]"
            />
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <button className="botao-foco" onClick={virar}>
                {escrito.trim() ? 'Comparar' : 'Ver a resposta sem escrever'}
              </button>
              <span className="hidden text-xs text-[var(--tinta-suave)] sm:inline">Ctrl+Enter compara</span>
            </div>
          </div>
        ) : (
          <button className="mt-8 w-full rounded-2xl bg-[var(--papel-2)] py-4 text-sm text-[var(--tinta)] hover:bg-[var(--linha)]" onClick={virar}>
            mostrar resposta <span className="text-[var(--tinta-suave)]">(espaço)</span>
          </button>
        )
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 space-y-8">
          <div className={`grid gap-4 ${escrito.trim() ? 'sm:grid-cols-2' : ''}`}>
            {escrito.trim() && (
              <div className="rounded-2xl bg-[var(--papel-2)] px-5 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--tinta-suave)]">você escreveu</div>
                <p className="fonte-leitura mt-2 whitespace-pre-line text-[15px] leading-relaxed text-[var(--tinta)]">{escrito}</p>
              </div>
            )}
            <div className="rounded-2xl border border-[var(--linha)] px-5 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--tinta-suave)]">resposta</div>
              <div className="fonte-leitura mt-2 space-y-3 text-[15px] leading-relaxed text-[var(--tinta)]">
                {cartao.latex && (
                  <div className="overflow-x-auto text-lg">
                    <Tex latex={cartao.latex} display />
                  </div>
                )}
                {cartao.variaveis && (
                  <ul className="space-y-0.5 text-sm text-[var(--tinta-suave)]">
                    {cartao.variaveis.map((v) => (
                      <li key={v.simbolo}>
                        <Tex latex={v.simbolo} />: {v.descricao}
                      </li>
                    ))}
                  </ul>
                )}
                {cartao.resposta.split('\n\n').map((par, i) => (
                  <p key={i} className={i > 0 ? 'text-[var(--tinta-suave)]' : ''}>
                    <Texto>{par}</Texto>
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--tinta-suave)]">o que faltou na sua resposta? (opcional)</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {FALTOU.map((f) => (
                <button key={f.id} className={chip(faltou.includes(f.id))} onClick={() => alternar(f.id)}>
                  {f.texto}
                </button>
              ))}
            </div>
            <div className="mt-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--tinta-suave)]">e o cartão?</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className={chip(dividir, true)} onClick={() => setDividir(!dividir)}>
                pede coisa demais: devia virar dois
              </button>
              <button className={chip(confuso, true)} onClick={() => setConfuso(!confuso)}>
                está confuso ou mal escrito
              </button>
            </div>
            <input
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Comentário (opcional): o que mudaria neste cartão?"
              className="mt-4 w-full rounded-xl border border-[var(--linha)] bg-[var(--papel)] px-4 py-2.5 text-sm outline-none focus:border-[var(--foco)]"
            />
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--tinta-suave)]">como foi?</div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {NOTAS.map((n) => (
                <button
                  key={n.nota}
                  id={`nota-${n.nota}`}
                  onClick={() => dar(n.nota)}
                  className="rounded-2xl py-3.5 text-[15px] font-semibold transition-transform hover:-translate-y-0.5"
                  style={{ color: n.cor, background: n.fundo }}
                >
                  {n.rotulo} <span className="hidden opacity-60 sm:inline">({n.tecla})</span>
                </button>
              ))}
            </div>
          </div>

          {tp && (
            <button className="text-sm text-[var(--foco)] hover:underline" onClick={abrirTopico}>
              abrir “{tp.titulo}” na trilha →
            </button>
          )}
        </motion.div>
      )}
    </div>
  )
}

/* ───────────── explicar para alguém ───────────── */

function OuvirGravacao({ g }: { g: Gravacao }) {
  const url = useMemo(() => URL.createObjectURL(g.blob), [g.blob])
  useEffect(() => () => URL.revokeObjectURL(url), [url])
  return (
    <div className="flex items-center gap-3 text-xs text-[var(--tinta-suave)]">
      <audio controls preload="metadata" src={url} className="h-9 min-w-0 flex-1" />
      <span className="shrink-0">{new Date(g.em).toLocaleDateString('pt-BR')}</span>
    </div>
  )
}

/** o que você escreveu e gravou explicando cada tópico, e os entendidos que ainda não têm explicação */
function RevisarExplicacoes({ abrir }: { abrir: (topico: string) => void }) {
  const feynman = useMapa((s) => s.feynman)
  const estudados = useMapa((s) => s.estudados)
  const [gravacoes, setGravacoes] = useState<Gravacao[]>([])
  const [so, setSo] = useState<'todas' | 'travei'>('todas')
  useEffect(() => {
    todasGravacoes()
      .then((gs) => setGravacoes(gs.filter((g) => topicoPorId.has(g.topico)).sort((a, b) => b.em - a.em)))
      .catch(() => setGravacoes([]))
  }, [])

  const porTopico = new Map<string, Gravacao[]>()
  for (const g of gravacoes) porTopico.set(g.topico, [...(porTopico.get(g.topico) ?? []), g])
  const ids = [...new Set([...Object.keys(feynman).filter((id) => feynman[id].texto.trim() || feynman[id].travei?.trim()), ...porTopico.keys()])]
    .filter((id) => topicoPorId.has(id))
    .filter((id) => so === 'todas' || feynman[id]?.travei?.trim())
    .sort((a, b) => Math.max(feynman[b]?.em ?? 0, porTopico.get(b)?.[0]?.em ?? 0) - Math.max(feynman[a]?.em ?? 0, porTopico.get(a)?.[0]?.em ?? 0))
  const semExplicacao = Object.keys(estudados).filter((id) => topicoPorId.has(id) && !feynman[id]?.texto.trim() && !porTopico.has(id))
  const comTravei = Object.values(feynman).filter((f) => f.travei?.trim()).length

  return (
    <div>
      {comTravei > 0 && (
        <div className="mb-6 flex gap-2 text-sm">
          {(['todas', 'travei'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setSo(k)}
              className={`rounded-full px-3 py-1.5 ${so === k ? 'bg-[var(--tinta-forte)] text-[var(--papel)]' : 'bg-[var(--papel-2)] text-[var(--tinta-suave)]'}`}
            >
              {k === 'todas' ? 'todas' : `onde travei (${comTravei})`}
            </button>
          ))}
        </div>
      )}
      {!ids.length && (
        <Vazio icone="🗣" titulo="Você ainda não explicou nenhum tópico">
          Fica no fim de cada tópico, em “Mais jeitos de revisar”.
        </Vazio>
      )}
      <ul className="space-y-4">
        {ids.map((id) => {
          const tp = topicoPorId.get(id)!
          const f = feynman[id]
          const gs = porTopico.get(id) ?? []
          return (
            <li key={id} className="rounded-3xl border border-[var(--linha)] bg-[var(--cartao)] p-5 shadow-[var(--sombra)] sm:p-6">
              <div className="flex items-center gap-3">
                <span style={{ color: unidadePorId.get(tp.unidade)!.cor }}>●</span>
                <span className="text-lg font-semibold text-[var(--tinta-forte)]">{tp.titulo}</span>
                <button className="ml-auto shrink-0 text-sm text-[var(--foco)] hover:underline" onClick={() => abrir(id)}>
                  abrir →
                </button>
              </div>
              {f?.texto.trim() && (
                <p className="fonte-leitura mt-4 whitespace-pre-wrap leading-relaxed text-[var(--tinta)]">
                  <Texto>{f.texto}</Texto>
                </p>
              )}
              {f?.travei?.trim() && <p className="mt-4 rounded-2xl bg-[var(--alerta-claro)] px-4 py-3 text-sm leading-relaxed text-[var(--tinta-forte)]"><strong>Onde travei:</strong> {f.travei}</p>}
              {gs.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-[var(--linha)] pt-4">
                  {gs.map((g) => (
                    <OuvirGravacao key={g.id} g={g} />
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {so === 'todas' && semExplicacao.length > 0 && (
        <div className="mt-10 rounded-3xl bg-[var(--papel-2)] p-5 sm:p-6">
          <p className="font-semibold text-[var(--tinta-forte)]">Entendidos, mas ainda sem explicação ({semExplicacao.length})</p>
          <p className="mt-1 text-sm text-[var(--tinta-suave)]">Explicar é um bom teste de que você entendeu mesmo.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {semExplicacao.map((id) => (
              <button key={id} onClick={() => abrir(id)} className="rounded-full bg-[var(--cartao)] px-3 py-1.5 text-sm text-[var(--tinta)] ring-1 ring-[var(--linha)] hover:ring-[var(--tinta-suave)]">
                {topicoPorId.get(id)!.titulo}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ───────────── slides fixados ───────────── */

function RevisarSlides({ abrir }: { abrir: (topico: string) => void }) {
  const fixados = useMapa((s) => s.slidesFixados)
  const alternar = useMapa((s) => s.alternarSlide)
  const [indice, setIndice] = useState<Indice | null | undefined>(undefined)
  const [grande, setGrande] = useState<{ arquivo: string; n: number } | null>(null)
  useEffect(() => {
    lerIndice().then(setIndice)
  }, [])
  const grupos = Object.entries(fixados).filter(([t, ps]) => ps.length && topicoPorId.has(t))

  if (!grupos.length)
    return (
      <Vazio icone="📌" titulo="Nenhum slide fixado">
        Dentro de um tópico, em “Mais jeitos de revisar” › slides da aula, toque no 📌 de uma página.
      </Vazio>
    )
  if (indice === null)
    return (
      <Vazio icone="🖼" titulo="As imagens dos slides não estão aqui">
        Você tem slides fixados, mas as imagens não estão neste computador (elas não vão para o site publicado). No seu computador, rode “npm run slides” uma vez.
      </Vazio>
    )

  return (
    <div className="space-y-12">
      {grupos.map(([t, ps]) => (
        <section key={t}>
          <button className="text-lg font-semibold text-[var(--tinta-forte)] hover:underline" onClick={() => abrir(t)}>
            <span style={{ color: unidadePorId.get(topicoPorId.get(t)!.unidade)!.cor }}>●</span> {topicoPorId.get(t)!.titulo} →
          </button>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {ps.map((k) => {
              const [arquivo, n] = k.split('#')
              return (
                <figure key={k} className="relative m-0">
                  <button onClick={() => setGrande({ arquivo, n: Number(n) })} className="block w-full overflow-hidden rounded-2xl border border-[var(--linha)] bg-white shadow-[var(--sombra)] transition-transform hover:-translate-y-0.5" title="ampliar">
                    <img src={img(arquivo, Number(n))} alt={`slide ${n} de ${arquivo}`} loading="lazy" className="block aspect-[4/3] w-full object-contain" />
                  </button>
                  <figcaption className="mt-2 flex items-center gap-2 text-xs text-[var(--tinta-suave)]">
                    <span className="truncate">
                      {arquivo} · p. {n}
                    </span>
                    <button className="ml-auto shrink-0 rounded-full px-2 py-0.5 hover:bg-[var(--alerta-claro)] hover:text-[var(--alerta)]" onClick={() => alternar(t, k)} title="desafixar" aria-label={`desafixar página ${n}`}>
                      desafixar
                    </button>
                  </figcaption>
                </figure>
              )
            })}
          </div>
        </section>
      ))}
      {grande && <Ampliado arquivo={grande.arquivo} n={grande.n} fechar={() => setGrande(null)} />}
    </div>
  )
}
