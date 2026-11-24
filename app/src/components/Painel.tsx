// Painéis laterais de Revisão e de Anotações: um resumo com um cartão para cada tipo, que leva à página cheia.
// Também guarda as peças que o painel de Configurações usa (PainelLateral, Secao) e as seções
// "pontos fracos" e "seu progresso", que aparecem na página de revisão.
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CARTOES } from '../content/cartoes'
import { questaoPorId } from '../content/questoes'
import { topicoPorId, TOPICOS, UNIDADES } from '../content/topicos'
import { GERAL } from '../lib/abas'
import { NOMES_REVISAO as N } from '../lib/paineis'
import { cobertura } from '../lib/cobertura'
import { TINTA, type IdCor } from '../lib/marcas'
import { faltaQuanto, voltaEm } from '../lib/revisita'
import { formatarTempo, tempoTotal } from '../lib/tempo'
import { useMapa } from '../store/useMapa'
import { ChipTag } from './Marcas'
import { useAgora } from './Relembrar'
import { Texto } from './Texto'
import { useTreinosHoje } from './Treino'
import { LinkAjuda } from './LinkAjuda'

/* ───────────── peças ───────────── */

export function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="border-t border-[var(--linha)] pt-5">
      <h3 className="mb-3 text-sm font-semibold text-[var(--tinta-forte)]">{titulo}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

/** Gaveta que entra pela direita. `rodape` fica preso embaixo (o botão da página cheia). */
export function PainelLateral({
  aberto,
  fechar,
  titulo,
  sub,
  topo,
  rodape,
  children,
}: {
  aberto: boolean
  fechar: () => void
  titulo: string
  sub: string
  topo?: ReactNode
  rodape?: ReactNode
  children: ReactNode
}) {
  useEffect(() => {
    if (!aberto) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && fechar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [aberto, fechar])

  return createPortal(
    <AnimatePresence>
      {aberto && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-[rgba(36,34,44,.25)]" onClick={fechar} />
          <motion.aside
            role="dialog"
            aria-label={titulo}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClickCapture={(e) => {
              if ((e.target as HTMLElement).closest('a[href^="#"]')) fechar()
            }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col lg:max-w-lg bg-[var(--cartao)] shadow-[-12px_0_40px_-16px_rgba(36,34,44,.3)]"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="border-b border-[var(--linha)] px-6 py-4">
              <h2 className="truncate text-lg font-semibold leading-tight text-[var(--tinta-forte)]">{titulo}</h2>
              <p className="truncate text-xs text-[var(--tinta-suave)]">{sub}</p>
              {topo}
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
            {/* fechar fica embaixo, sempre à vista, no mesmo jeito do "← voltar" das páginas */}
            <div className="flex items-center gap-3 border-t border-[var(--linha)] px-5 py-3">
              <button className="botao-suave shrink-0 whitespace-nowrap !py-2.5" onClick={fechar} aria-label="fechar o painel" title="fechar (Esc)">
                → fechar
              </button>
              {rodape && <div className="min-w-0 flex-1">{rodape}</div>}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/** Um cartão do resumo: número grande, o que é, e o que tem dentro. Leva à aba certa da página cheia. */
/** Uma linha do resumo do painel: o que é à esquerda, quanto à direita. Destaque = tem algo para fazer agora. */
function Resumo({ href, icone, titulo, numero, rotulo, detalhe, destaque = false }: { href: string; icone: string; titulo: string; numero: number; rotulo: string; detalhe?: string; destaque?: boolean }) {
  return (
    <a href={href} className={`group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--papel-2)] ${destaque ? 'bg-[color-mix(in_srgb,var(--foco-claro)_55%,transparent)]' : ''}`}>
      <span className="w-5 shrink-0 text-center" aria-hidden>
        {icone}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-[var(--tinta-forte)]">{titulo}</span>
        {detalhe && <span className="block truncate text-[11px] text-[var(--tinta-suave)]">{detalhe}</span>}
      </span>
      <span className="shrink-0 text-right">
        <span className={`text-lg font-semibold tabular-nums ${destaque ? 'text-[var(--foco)]' : numero ? 'text-[var(--tinta-forte)]' : 'text-[var(--tinta-suave)]'}`}>{numero}</span>{' '}
        <span className="text-xs text-[var(--tinta-suave)]">{rotulo}</span>
      </span>
      <span className="text-[var(--tinta-suave)] transition-transform group-hover:translate-x-0.5" aria-hidden>
        →
      </span>
    </a>
  )
}

/** A lista de linhas do resumo, num cartão só. */
const ListaResumo = ({ children }: { children: ReactNode }) => (
  <div className="divide-y divide-[var(--linha)] overflow-hidden rounded-2xl border border-[var(--linha)]">{children}</div>
)

const BotaoPagina = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} className="botao-foco flex w-full items-center justify-center gap-2">
    {children}
  </a>
)

/* ───────────── pontos fracos (usado na página de revisão e no contador do painel) ───────────── */

export function usePontosFracos() {
  const testes = useMapa((s) => s.testes)
  const questoes = useMapa((s) => s.questoes)
  return useMemo(() => {
    const fracos = Object.entries(testes)
      .filter(([k, r]) => k.endsWith(':fechamento') && r.total && r.acertos / r.total < 0.7)
      .map(([k, r]) => ({ id: k.split(':')[1], r }))
      .filter((x) => topicoPorId.has(x.id))
    const perigosas = Object.entries(questoes)
      .filter(([, h]) => !h.ultimaCerta && h.errosComCerteza)
      .map(([id]) => questaoPorId.get(id))
      .filter((q) => !!q)
    return { fracos, perigosas }
  }, [testes, questoes])
}

/** Quadro vazio com um ícone grande, um título e o que fazer. */
export function Vazio({ icone, titulo, children }: { icone: string; titulo: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-[var(--linha)] px-6 py-12 text-center">
      <div className="text-4xl" aria-hidden>
        {icone}
      </div>
      <p className="mt-4 text-base font-semibold text-[var(--tinta-forte)]">{titulo}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--tinta-suave)]">{children}</p>
    </div>
  )
}

/** Um bloco da página de revisão: cartão com título e, se quiser, uma linha explicando. */
function Bloco({ titulo, sub, children }: { titulo: string; sub?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-[var(--linha)] bg-[var(--cartao)] p-5 sm:p-7">
      <h3 className="text-lg font-semibold text-[var(--tinta-forte)]">{titulo}</h3>
      {sub && <p className="mt-1.5 text-sm leading-relaxed text-[var(--tinta-suave)]">{sub}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

const item = 'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-[var(--papel-2)]'
const linha = 'flex w-full items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-left text-[15px] hover:bg-[var(--papel-2)]'

export function PontosFracos({ abrir }: { abrir: (id: string) => void }) {
  const { fracos, perigosas } = usePontosFracos()
  if (!fracos.length && !perigosas.length)
    return (
      <Vazio icone="🎯" titulo="Nenhum ponto fraco ainda">
        Aparecem pelos testes do fim dos tópicos. <LinkAjuda secao="testes" />
      </Vazio>
    )
  return (
    <div className="space-y-6">
      {fracos.length > 0 && (
        <Bloco titulo={`Tópicos abaixo de 70% (${fracos.length})`}>
          <ul className="-mx-3 divide-y divide-[var(--linha)]">
            {fracos.map(({ id, r }) => (
              <li key={id}>
                <button className={linha} onClick={() => abrir(id)}>
                  <span className="truncate text-[var(--tinta-forte)]">{topicoPorId.get(id)!.titulo}</span>
                  <span className="shrink-0 rounded-full bg-[var(--alerta-claro)] px-2.5 py-0.5 text-sm font-semibold tabular-nums text-[var(--alerta)]">
                    {r.acertos}/{r.total}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Bloco>
      )}
      {perigosas.length > 0 && (
        <Bloco titulo={`Errou com certeza (${perigosas.length})`}>
          <ul className="space-y-3">
            {perigosas.map((q) => (
              <li key={q!.id}>
                <button className="w-full rounded-2xl bg-[var(--alerta-claro)] px-4 py-3 text-left text-[15px] leading-relaxed text-[var(--tinta)] hover:brightness-[.98]" onClick={() => abrir(q!.topico)}>
                  <Texto>{q!.enunciado.length > 160 ? `${q!.enunciado.slice(0, q!.enunciado.lastIndexOf(' ', 157))}…` : q!.enunciado}</Texto>
                  <span className="mt-1 block text-xs text-[var(--tinta-suave)]">{topicoPorId.get(q!.topico)?.titulo} →</span>
                </button>
              </li>
            ))}
          </ul>
        </Bloco>
      )}
    </div>
  )
}

/* ───────────── seu progresso (aba da página de revisão) ───────────── */

/** Os tópicos da aba de prova aberta, ou os da trilha (sem os não vistos) na aba geral. */
export function useTopicosDaAba() {
  const abaAtual = useMapa((s) => s.abaAtual)
  const abas = useMapa((s) => s.abas)
  return useMemo(() => {
    const aba = abaAtual === GERAL ? null : abas.find((a) => a.id === abaAtual)
    return { aba, ids: aba ? aba.topicos : TOPICOS.filter((t) => !t.naoVisto).map((t) => t.id) }
  }, [abaAtual, abas])
}

export function Progresso({ abrir }: { abrir: (id: string) => void }) {
  const s = useMapa()
  const [verTudo, setVerTudo] = useState(false)
  const { aba, ids } = useTopicosDaAba()
  const maisTempo = Object.entries(s.tempo)
    .filter(([id]) => topicoPorId.has(id))
    .sort((a, b) => b[1].ms - a[1].ms)
    .slice(0, 8)
  const fb = Object.entries(s.feedbackCartoes).filter(([, f]) => f.dividir || f.confuso || f.comentario)
  const cob = cobertura(ids)
  const comFalta = cob.filter((c) => c.falta.length)
  const nome = aba ? aba.nome : 'na trilha'

  return (
    <div className="space-y-6">
      <Bloco titulo="Tempo de estudo">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-[var(--papel-2)] px-5 py-4">
            <div className="text-2xl font-semibold tabular-nums text-[var(--tinta-forte)]">{formatarTempo(tempoTotal(s.tempo, ids))}</div>
            <div className="mt-1 text-sm text-[var(--tinta-suave)]">{aba ? `em ${nome}` : nome}</div>
          </div>
          <div className="rounded-2xl bg-[var(--papel-2)] px-5 py-4">
            <div className="text-2xl font-semibold tabular-nums text-[var(--tinta-forte)]">{formatarTempo(tempoTotal(s.tempo, Object.keys(s.tempo)))}</div>
            <div className="mt-1 text-sm text-[var(--tinta-suave)]">no total</div>
          </div>
        </div>
        {maisTempo.length > 0 && (
          <>
            <div className="rotulo-formula mt-6">onde você passou mais tempo</div>
            <ul className="-mx-3 mt-2 divide-y divide-[var(--linha)]">
              {maisTempo.map(([id, t]) => (
                <li key={id}>
                  <button className={linha} onClick={() => abrir(id)}>
                    <span className="truncate text-[var(--tinta)]">{topicoPorId.get(id)!.titulo}</span>
                    <span className="shrink-0 tabular-nums text-[var(--tinta-suave)]">{formatarTempo(t.ms)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Bloco>

      {fb.length > 0 && (
        <Bloco titulo={`Cartões que você quer mudar (${fb.length})`}>
          <ul className="space-y-4">
            {fb.map(([id, f]) => {
              const c = CARTOES.find((x) => x.id === id)
              return (
                <li key={id} className="text-[15px] leading-relaxed text-[var(--tinta)]">
                  <Texto>{c?.pergunta ?? id}</Texto>
                  <span className="mt-0.5 block text-sm text-[var(--tinta-suave)]">{[f.dividir && 'dividir', f.confuso && 'confuso', f.comentario && `“${f.comentario}”`].filter(Boolean).join(' · ')}</span>
                </li>
              )
            })}
          </ul>
        </Bloco>
      )}

      <Bloco
        titulo={`Cobertura ${aba ? `de ${aba.nome}` : 'da trilha'}`}
        sub={`O que o app tem para cada tópico. ${comFalta.length ? `${comFalta.length} de ${cob.length} com algum buraco.` : 'Nenhum buraco encontrado.'}`}
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {(verTudo ? cob : comFalta).map((c) => (
            <li key={c.id} className="rounded-2xl border border-[var(--linha)] p-4">
              <button className="text-left text-[15px] font-semibold text-[var(--tinta-forte)] hover:underline" onClick={() => abrir(c.id)}>
                {c.titulo}
              </button>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[13px] tabular-nums text-[var(--tinta-suave)]">
                <span title="questões fáceis, médias e difíceis">
                  questões {c.niveis[0]}·{c.niveis[1]}·{c.niveis[2]}
                </span>
                {c.abertas > 0 && <span>{c.abertas} discursiva{c.abertas > 1 ? 's' : ''}</span>}
                {c.calculos > 0 && <span>{c.calculos} cálculo{c.calculos > 1 ? 's' : ''}</span>}
                <span>{c.cartoes} cartões</span>
                {c.exercicios > 0 && <span>{c.exercicios} exercício{c.exercicios > 1 ? 's' : ''}</span>}
              </div>
              {c.falta.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.falta.map((f) => (
                    <span key={f} className="rounded-full bg-[var(--alerta-claro)] px-2.5 py-0.5 text-xs text-[var(--alerta)]">
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
        <button className="botao-suave mt-5" onClick={() => setVerTudo(!verTudo)}>
          {verTudo ? 'mostrar só os com buraco' : `mostrar todos os ${cob.length}`}
        </button>
      </Bloco>
    </div>
  )
}

/* ───────────── resumo da revisão ───────────── */

/** O que está para revisar hoje, somando cartões, tópicos e treinos. É o número no botão do cabeçalho. */
export function usePendentesRevisao() {
  const cartoes = useMapa((s) => s.cartoes)
  const revisitas = useMapa((s) => s.revisitas)
  const intervalos = useMapa((s) => s.estudo.intervalos)
  const treinos = useTreinosHoje()
  const agora = useAgora(60_000)
  const nCartoes = CARTOES.filter((c) => cartoes[c.id] && cartoes[c.id].volta <= agora).length
  const nTopicos = Object.entries(revisitas).filter(([id, r]) => topicoPorId.has(id) && voltaEm(r, intervalos) <= agora).length
  return nCartoes + nTopicos + treinos
}

export function ResumoRevisao() {
  const s = useMapa()
  const agora = useAgora(60_000)
  const treinos = useTreinosHoje()
  const { fracos, perigosas } = usePontosFracos()

  const cartoesHoje = CARTOES.filter((c) => s.cartoes[c.id] && s.cartoes[c.id].volta <= agora).length
  const cartoesNovos = CARTOES.filter((c) => !s.cartoes[c.id]).length
  const voltas = Object.entries(s.revisitas)
    .filter(([id]) => topicoPorId.has(id))
    .map(([id, r]) => ({ id, alvo: voltaEm(r, s.estudo.intervalos) }))
  const topicosAgora = voltas.filter((v) => v.alvo <= agora).length
  const proximoTopico = Math.min(...voltas.filter((v) => v.alvo > agora).map((v) => v.alvo))
  const explicadas = Object.values(s.feynman).filter((f) => f.texto.trim()).length
  const travei = Object.values(s.feynman).filter((f) => f.travei?.trim()).length
  const semExplicar = Object.keys(s.estudados).filter((id) => topicoPorId.has(id) && !s.feynman[id]?.texto.trim()).length
  const slides = Object.entries(s.slidesFixados).reduce((n, [t, ps]) => n + (topicoPorId.has(t) ? ps.length : 0), 0)

  // por assunto (unidade): quando é a próxima volta, juntando cartões e tópicos
  const assuntos = UNIDADES.map((u) => {
    const cs = CARTOES.filter((c) => c.unidade === u.id)
    const vistos = cs.filter((c) => s.cartoes[c.id])
    const tops = voltas.filter((v) => topicoPorId.get(v.id)!.unidade === u.id)
    const alvos = [...vistos.map((c) => s.cartoes[c.id].volta), ...tops.map((t) => t.alvo)]
    const agoraN = vistos.filter((c) => s.cartoes[c.id].volta <= agora).length + tops.filter((t) => t.alvo <= agora).length
    return { u, total: cs.length, vistos: vistos.length, tops: tops.length, agoraN, proximo: alvos.length ? Math.min(...alvos) : null }
  })

  return (
    <div className="space-y-6">
      <ListaResumo>
        <Resumo href="#/revisao/cartoes" icone={N.cartoes.icone} titulo={N.cartoes.nome} numero={cartoesHoje} rotulo="para hoje" detalhe={`${cartoesNovos} nunca vistos`} destaque={cartoesHoje > 0} />
        <Resumo
          href="#/revisao/relembrar"
          icone={N.relembrar.icone}
          titulo={N.relembrar.nome}
          numero={topicosAgora}
          rotulo={topicosAgora === 1 ? 'tópico agora' : 'tópicos agora'}
          detalhe={Number.isFinite(proximoTopico) ? `próximo ${faltaQuanto(proximoTopico, agora)}` : voltas.length ? undefined : 'aparece depois de ler'}
          destaque={topicosAgora > 0}
        />
        <Resumo href="#/treino" icone={N.treino.icone} titulo={N.treino.nome} numero={treinos} rotulo="cálculos para hoje" destaque={treinos > 0} />
        <Resumo href="#/revisao/fracos" icone={N.fracos.icone} titulo={N.fracos.nome} numero={fracos.length + perigosas.length} rotulo="tópicos e questões" detalhe={perigosas.length ? `${perigosas.length} errou com certeza` : undefined} />
        <Resumo href="#/revisao/explicar" icone={N.explicar.icone} titulo={N.explicar.nome} numero={explicadas} rotulo="explicações escritas" detalhe={[travei && `${travei} onde travou`, semExplicar && `${semExplicar} lidos sem explicar`].filter(Boolean).join(' · ') || undefined} />
        <Resumo href="#/revisao/slides" icone={N.slides.icone} titulo={N.slides.nome} numero={slides} rotulo={slides === 1 ? 'página' : 'páginas'} />
      </ListaResumo>

      <Secao titulo="Quando cada assunto volta">
        <ul className="space-y-2">
          {assuntos.map(({ u, total, vistos, tops, agoraN, proximo }) => (
            <li key={u.id} className="flex items-center gap-3">
              <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: u.cor }} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-[var(--tinta-forte)]">{u.titulo}</span>
                <span className="block text-xs text-[var(--tinta-suave)]">
                  {vistos}/{total} cartões vistos{tops ? ` · ${tops} ${tops === 1 ? 'tópico lido' : 'tópicos lidos'}` : ''}
                </span>
              </span>
              <span className={`shrink-0 text-sm font-medium ${agoraN ? 'text-[var(--coral)]' : 'text-[var(--tinta-suave)]'}`}>
                {proximo === null ? '—' : agoraN ? `${agoraN} agora` : faltaQuanto(proximo, agora)}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-[var(--tinta-suave)]">A próxima volta mais perto em cada unidade, juntando cartões e tópicos para relembrar. “—” é unidade que você ainda não começou a revisar.</p>
      </Secao>

      <Secao titulo="Tempo de estudo">
        <p className="text-sm text-[var(--tinta)]">
          <strong className="text-[var(--tinta-forte)]">{formatarTempo(tempoTotal(s.tempo, Object.keys(s.tempo)))}</strong> no total.{' '}
          <a href="#/revisao/progresso" className="text-[var(--foco)] hover:underline">
            {N.progresso.icone} {N.progresso.nome} →
          </a>
        </p>
      </Secao>
    </div>
  )
}

export const RodapeRevisao = () => <BotaoPagina href="#/revisao">⤢ abrir página de revisão</BotaoPagina>

/* ───────────── resumo das anotações ───────────── */

export function ResumoAnotacoes() {
  const notas = useMapa((s) => s.notas)
  const marcas = useMapa((s) => s.marcas)
  const quadro = useMapa((s) => s.quadro)
  const caderno = useMapa((s) => s.caderno)
  const selecionar = useMapa((s) => s.selecionar)
  const cores = useMapa((s) => s.coresMarca)
  const nomeCor = (c: IdCor) => cores.find((x) => x.id === c)?.objetivo.trim() || TINTA[c].nome

  const nNotas = Object.entries(notas).filter(([id, n]) => n.texto.trim() && topicoPorId.has(id)).length
  const postits = quadro.filter((p) => p.texto.trim()).length
  const porCor = (Object.keys(TINTA) as IdCor[]).map((c) => [c, marcas.filter((m) => m.cor === c).length] as const).filter(([, n]) => n)
  const tags = useMemo(() => {
    const n = new Map<string, number>()
    for (const m of marcas) for (const t of m.tags ?? []) n.set(t, (n.get(t) ?? 0) + 1)
    return [...n.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
  }, [marcas])
  const paginas = [...caderno].sort((a, b) => b.em - a.em).slice(0, 3)
  const recentes = useMemo(() => {
    const porTopico = new Map<string, { nota?: string; marcas: number; em: number }>()
    for (const [id, n] of Object.entries(notas)) if (n.texto.trim()) porTopico.set(id, { nota: n.texto, marcas: 0, em: n.em })
    for (const m of marcas) {
      const x = porTopico.get(m.topico) ?? { marcas: 0, em: 0 }
      porTopico.set(m.topico, { ...x, marcas: x.marcas + 1, em: Math.max(x.em, m.em) })
    }
    return [...porTopico.entries()].filter(([id]) => topicoPorId.has(id)).sort((a, b) => b[1].em - a[1].em).slice(0, 5)
  }, [notas, marcas])

  return (
    <div className="space-y-6">
      <ListaResumo>
        <Resumo href="#/anotacoes" icone="📝" titulo="Notas" numero={nNotas} rotulo={nNotas === 1 ? 'tópico com nota' : 'tópicos com nota'} />
        <Resumo href="#/anotacoes" icone="🖍" titulo="Marcas" numero={marcas.length} rotulo="trechos marcados" detalhe={tags.length ? `${tags.length} tags` : undefined} />
        <Resumo href="#/quadro" icone="💭" titulo="Quadro" numero={postits} rotulo="post-its" />
        <Resumo href="#/caderno" icone="📓" titulo="Caderno" numero={caderno.length} rotulo={caderno.length === 1 ? 'página' : 'páginas'} />
      </ListaResumo>

      {porCor.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs text-[var(--tinta)]" aria-label="marcas por cor">
          {porCor.map(([c, n]) => (
            <span key={c} className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: TINTA[c].fundo }}>
              {nomeCor(c)} <strong className="tabular-nums">{n}</strong>
            </span>
          ))}
        </div>
      )}

      {paginas.length > 0 && (
        <Secao titulo="Caderno: últimas páginas">
          <ul className="-mx-3">
            {paginas.map((p) => (
              <li key={p.id}>
                <a href={`#/caderno/${p.id}`} className={item}>
                  <span className="truncate text-[var(--tinta-forte)]">{p.titulo || 'sem título'}</span>
                  <span className="shrink-0 text-xs text-[var(--tinta-suave)]">{p.assunto}</span>
                </a>
              </li>
            ))}
          </ul>
        </Secao>
      )}

      <Secao titulo="Últimas notas e marcas">
        {!recentes.length && <p className="text-sm text-[var(--tinta-suave)]">Nada ainda. Dentro de um tópico, use 📝 para anotar ou selecione um trecho para marcar.</p>}
        <ul className="space-y-2">
          {recentes.map(([id, x]) => (
            <li key={id}>
              <button onClick={() => selecionar(id)} className="w-full rounded-2xl border border-[var(--linha)] px-4 py-3 text-left transition-colors hover:bg-[var(--papel-2)]">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium text-[var(--tinta-forte)]">{topicoPorId.get(id)!.titulo}</span>
                  {x.marcas > 0 && <span className="shrink-0 text-xs text-[var(--tinta-suave)]">🖍 {x.marcas}</span>}
                </span>
                {x.nota && <span className="mt-1 line-clamp-3 block whitespace-pre-line text-sm text-[var(--tinta)]">{x.nota}</span>}
              </button>
            </li>
          ))}
        </ul>
      </Secao>

      {tags.length > 0 && (
        <Secao titulo="Tags mais usadas">
          <div className="flex flex-wrap gap-1.5">
            {tags.map(([t, n]) => (
              <span key={t} className="flex items-center gap-1">
                <ChipTag tag={t} />
                <span className="text-xs tabular-nums text-[var(--tinta-suave)]">{n}</span>
              </span>
            ))}
          </div>
        </Secao>
      )}
    </div>
  )
}

export const RodapeAnotacoes = () => <BotaoPagina href="#/anotacoes">⤢ abrir página de anotações</BotaoPagina>
