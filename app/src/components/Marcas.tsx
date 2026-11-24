// Marca-texto dentro do tópico: selecionar → escolher a cor (o objetivo) → anotar sobre o trecho.
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { topicoPorId } from '../content/topicos'
import { dependentesDe, parecidosDe, prereqsDe } from '../lib/grafo'
import { TINTA, indiceDe, limpo, localizar, mapear, normalTag, rangeDe, recortar, temPintura, tipoTag, type CorMarca, type IdCor, type Marca } from '../lib/marcas'
import { useMapa } from '../store/useMapa'
import { Dica } from './Dica'

/** camadas de texto corrido que dá para marcar */
export const CAMADAS_MARCAVEIS = new Set(['resumo', 'intuicao', 'definicao', 'detalhe', 'cuidado'])
export const NOME_CAMADA: Record<string, string> = { resumo: 'cola', intuicao: 'pensa assim', definicao: 'com o nome certo', detalhe: 'mergulho', cuidado: 'pegadinha' }

const objetivoDe = (cores: CorMarca[], id: IdCor) => cores.find((c) => c.id === id)?.objetivo || TINTA[id].nome

/** etiqueta colorida com o objetivo da cor */
export function Etiqueta({ cor }: { cor: IdCor }) {
  const cores = useMapa((s) => s.coresMarca)
  return (
    <Dica texto={`Marca-texto ${TINTA[cor].nome}. O que cada cor quer dizer muda em ⚙ Configurações › Marca-texto.`} className="cursor-help">
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: TINTA[cor].fundo, color: TINTA[cor].forte }}>
        🖍 {objetivoDe(cores, cor)}
      </span>
    </Dica>
  )
}

/** "…antes [trecho] depois…" */
export function Contexto({ m, className = '' }: { m: Pick<Marca, 'texto' | 'antes' | 'depois' | 'cor'>; className?: string }) {
  const antes = limpo(m.antes)
  const depois = limpo(m.depois)
  return (
    <p className={`fonte-leitura text-[0.95em] leading-relaxed text-[var(--tinta-suave)] ${className}`}>
      {antes && '…'}
      {antes}
      <mark className="rounded px-0.5 text-[var(--tinta-forte)]" style={{ background: TINTA[m.cor].fundo }}>
        {limpo(m.texto)}
      </mark>
      {depois}
      {depois && '…'}
    </p>
  )
}

/** campo de anotação de uma marca, salva sozinho */
export function NotaDaMarca({ m, foco = false }: { m: Marca; foco?: boolean }) {
  const atualizar = useMapa((s) => s.atualizarMarca)
  const [texto, setTexto] = useState(m.nota)
  const campo = useRef<HTMLTextAreaElement>(null)
  // a mesma marca pode estar aberta em dois lugares (popover e cartão): segue o que foi salvo no outro
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincronizar com o store quando não é este campo que está sendo editado
    if (document.activeElement !== campo.current) setTexto(m.nota)
  }, [m.nota])
  useEffect(() => {
    if (texto === m.nota) return
    const t = setTimeout(() => atualizar(m.id, { nota: texto }), 400)
    return () => clearTimeout(t)
  }, [texto, m.nota, m.id, atualizar])
  // vazio, fica só um link: uma caixa aberta em cada marca pesava a lista
  const [aberto, setAberto] = useState(false)
  if (!foco && !aberto && !texto)
    return (
      <button className="mt-1.5 text-xs text-[var(--tinta-suave)] hover:text-[var(--foco)] hover:underline" onClick={() => setAberto(true)}>
        ✎ escrever por que marcou
      </button>
    )
  return (
    <textarea
      ref={campo}
      autoFocus={foco || aberto}
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={() => texto !== m.nota && atualizar(m.id, { nota: texto })}
      rows={2}
      placeholder="Por que marcou? Escreva mais sobre este trecho…"
      className="fonte-leitura mt-2 w-full resize-y rounded-xl border border-[var(--linha)] bg-[var(--papel)] px-3 py-2 text-[0.95em] text-[var(--tinta-forte)] outline-none focus:border-[var(--foco)]"
    />
  )
}

/* ───────────── tags ───────────── */

/** nome de uma tag para mostrar: "P2" para aba:p2, o título para t:u5.gini, o próprio texto se for livre */
export function useRotuloTag() {
  const abas = useMapa((s) => s.abas)
  return (t: string) => {
    const tipo = tipoTag(t)
    if (tipo === 'aba') return abas.find((a) => a.id === t.slice(4))?.nome ?? t.slice(4)
    if (tipo === 'topico') return topicoPorId.get(t.slice(2))?.titulo ?? t.slice(2)
    return t
  }
}

const ICONE_TAG = { livre: '#', aba: '▤', topico: '↔' } as const
const DICA_TAG = {
  livre: 'Tag livre: um texto seu. Maiúsculas e acentos não contam.',
  aba: 'Liga o trecho a uma prova ou recorte da trilha.',
  topico: 'Liga o trecho a outro tópico. Toque no nome para abrir.',
} as const

/** uma tag; tópico relacionado vira link para ele */
export function ChipTag({ tag, remover, filtrar }: { tag: string; remover?: () => void; filtrar?: () => void }) {
  const rotulo = useRotuloTag()
  const selecionar = useMapa((s) => s.selecionar)
  const tipo = tipoTag(tag)
  const acao = filtrar ?? (tipo === 'topico' ? () => selecionar(tag.slice(2)) : undefined)
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--linha)] bg-[var(--papel)] px-2 py-0.5 text-[11px] text-[var(--tinta)]">
      <Dica texto={DICA_TAG[tipo]} className="cursor-help text-[var(--tinta-suave)]">
        <span aria-hidden>{ICONE_TAG[tipo]}</span>
      </Dica>
      {acao ? (
        <button className="hover:underline" onClick={acao} title={tipo === 'topico' && !filtrar ? 'abrir o tópico' : undefined}>
          {rotulo(tag)}
        </button>
      ) : (
        rotulo(tag)
      )}
      {remover && (
        <button className="ml-0.5 text-[var(--tinta-suave)] hover:text-[var(--alerta)]" onClick={remover} aria-label={`tirar a tag ${rotulo(tag)}`}>
          ×
        </button>
      )}
    </span>
  )
}

/**
 * Tags de uma marca: texto livre, trilhas (abas) e tópicos relacionados.
 * Sugere primeiro as tags que você já usa, depois as trilhas e os tópicos ligados a este.
 */
export function TagsDaMarca({ m }: { m: Marca }) {
  const atualizar = useMapa((s) => s.atualizarMarca)
  const todas = useMapa((s) => s.marcas)
  const abas = useMapa((s) => s.abas)
  const rotulo = useRotuloTag()
  const [digitando, setDigitando] = useState<string | null>(null)
  const tags = m.tags ?? []

  const sugestoes = (() => {
    if (digitando === null) return []
    // livres mais usadas primeiro
    const uso = new Map<string, number>()
    for (const x of todas) for (const t of x.tags ?? []) if (tipoTag(t) === 'livre') uso.set(t, (uso.get(t) ?? 0) + 1)
    const livres = [...uso].sort((a, b) => b[1] - a[1]).map(([t]) => t)
    const daAba = abas.filter((a) => a.topicos.includes(m.topico)).map((a) => `aba:${a.id}`)
    const outrasAbas = abas.filter((a) => !a.topicos.includes(m.topico)).map((a) => `aba:${a.id}`)
    const ligados = [...(prereqsDe.get(m.topico) ?? []), ...(dependentesDe.get(m.topico) ?? []), ...parecidosDe(m.topico).map((c) => (c.de === m.topico ? c.para : c.de))].map((id) => `t:${id}`)
    const q = normalTag(digitando)
    const ja = new Set(tags.map(normalTag))
    const todasSug = [...new Set([...livres, ...daAba, ...ligados, ...outrasAbas])]
    return todasSug.filter((t) => !ja.has(normalTag(t)) && (!q || normalTag(rotulo(t)).includes(q))).slice(0, 8)
  })()

  const por = (t: string) => {
    const limpo = t.trim().slice(0, 40)
    if (!limpo || tags.some((x) => normalTag(x) === normalTag(limpo))) return
    atualizar(m.id, { tags: [...tags, limpo] })
  }
  const tirar = (t: string) => atualizar(m.id, { tags: tags.filter((x) => x !== t) })

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-1">
        {tags.map((t) => (
          <ChipTag key={t} tag={t} remover={() => tirar(t)} />
        ))}
        {digitando === null ? (
          <button className="rounded-full px-2 py-0.5 text-[11px] text-[var(--foco)] hover:bg-[var(--foco-claro)]" onClick={() => setDigitando('')}>
            + tag, trilha ou tópico
          </button>
        ) : (
          <input
            autoFocus
            value={digitando}
            maxLength={40}
            onChange={(e) => setDigitando(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                // se o texto é igual ao nome de uma sugestão, usa a sugestão (P2 vira a aba P2)
                const igual = sugestoes.find((t) => normalTag(rotulo(t)) === normalTag(digitando))
                por(igual ?? digitando)
                setDigitando('')
              }
              if (e.key === 'Escape') {
                e.stopPropagation()
                setDigitando(null)
              }
            }}
            onBlur={() => setTimeout(() => setDigitando(null), 150)}
            placeholder="escreva ou escolha…"
            className="min-w-0 flex-1 rounded-full border border-[var(--linha)] bg-[var(--papel)] px-2.5 py-0.5 text-[12px] text-[var(--tinta-forte)] outline-none focus:border-[var(--foco)]"
          />
        )}
      </div>
      {sugestoes.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {sugestoes.map((t) => (
            <button
              key={t}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => por(t)}
              className="rounded-full bg-[var(--papel-2)] px-2 py-0.5 text-[11px] text-[var(--tinta)] hover:bg-[var(--foco-claro)] hover:text-[var(--foco)]"
            >
              <span className="text-[var(--tinta-suave)]">{ICONE_TAG[tipoTag(t)]}</span> {rotulo(t)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function EscolherCor({ atual, escolher }: { atual?: IdCor; escolher: (c: IdCor) => void }) {
  const cores = useMapa((s) => s.coresMarca)
  return (
    <div className="flex flex-wrap gap-1.5">
      {cores.map((c) => (
        <button
          key={c.id}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => escolher(c.id)}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-transform hover:-translate-y-0.5 ${atual === c.id ? 'ring-2 ring-offset-1' : ''}`}
          style={{ background: TINTA[c.id].fundo, color: TINTA[c.id].forte, ['--tw-ring-color' as string]: TINTA[c.id].forte }}
        >
          {c.objetivo || TINTA[c.id].nome}
        </button>
      ))}
    </div>
  )
}

/** Editar o objetivo de cada cor. */
export function EditarCores() {
  const cores = useMapa((s) => s.coresMarca)
  const setObjetivo = useMapa((s) => s.setObjetivoCor)
  return (
    <div className="space-y-1.5">
      {cores.map((c) => (
        <label key={c.id} className="flex items-center gap-2 text-sm">
          <span className="h-5 w-5 shrink-0 rounded-full" style={{ background: TINTA[c.id].fundo, border: `2px solid ${TINTA[c.id].forte}` }} aria-hidden />
          <span className="sr-only">objetivo da cor {TINTA[c.id].nome}</span>
          <input
            value={c.objetivo}
            maxLength={40}
            onChange={(e) => setObjetivo(c.id, e.target.value)}
            placeholder={TINTA[c.id].nome}
            className="min-w-0 flex-1 rounded-lg border border-[var(--linha)] bg-[var(--papel)] px-2 py-1 text-[var(--tinta-forte)]"
          />
        </label>
      ))}
    </div>
  )
}

/* ───────────── dentro do tópico ───────────── */

type Aberto = { tipo: 'nova'; x: number; y: number; camada: string; texto: string; antes: string; depois: string } | { tipo: 'existente'; x: number; y: number; id: string; recem?: boolean }

const camadaDe = (n: Node | null) => (n instanceof Element ? n : n?.parentElement)?.closest<HTMLElement>('[data-marcavel]') ?? null

/** pinta as marcas, ouve seleções e cliques nas marcas. Fica dentro do Topico. */
export function Marcador({ topico, raiz }: { topico: string; raiz: RefObject<HTMLElement | null> }) {
  const marcas = useMapa((s) => s.marcas)
  const adicionar = useMapa((s) => s.adicionarMarca)
  const atualizar = useMapa((s) => s.atualizarMarca)
  const remover = useMapa((s) => s.removerMarca)
  const [aberto, setAberto] = useState<Aberto | null>(null)
  const [apagar, setApagar] = useState(false)
  // onde cada marca está agora (para o clique saber em qual marca caiu)
  const posicoes = useRef(new Map<string, { camada: HTMLElement; a: number; b: number }>())
  const minhas = useMemo(() => marcas.filter((m) => m.topico === topico), [marcas, topico])

  // pintar
  useEffect(() => {
    const el = raiz.current
    if (!el) return
    let quadro = 0
    const pintar = () => {
      posicoes.current.clear()
      const porCor = new Map<IdCor, Range[]>()
      for (const camada of el.querySelectorAll<HTMLElement>('[data-marcavel]')) {
        const daqui = minhas.filter((m) => m.camada === camada.dataset.marcavel)
        if (!daqui.length) continue
        const mapa = mapear(camada)
        for (const m of daqui) {
          const achou = localizar(mapa.texto, m)
          if (!achou) continue
          posicoes.current.set(m.id, { camada, a: achou[0], b: achou[1] })
          const r = rangeDe(mapa, achou[0], achou[1])
          if (r) porCor.set(m.cor, [...(porCor.get(m.cor) ?? []), r])
        }
      }
      if (!temPintura()) return
      for (const id of Object.keys(TINTA) as IdCor[]) {
        const rs = porCor.get(id)
        if (rs?.length) CSS.highlights.set(`marca-${id}`, new Highlight(...rs))
        else CSS.highlights.delete(`marca-${id}`)
      }
    }
    const agendar = () => {
      cancelAnimationFrame(quadro)
      quadro = requestAnimationFrame(pintar)
    }
    agendar()
    const obs = new MutationObserver(agendar)
    obs.observe(el, { childList: true, subtree: true, characterData: true })
    return () => {
      obs.disconnect()
      cancelAnimationFrame(quadro)
      if (temPintura()) for (const id of Object.keys(TINTA)) CSS.highlights.delete(`marca-${id}`)
    }
  }, [raiz, minhas])

  // selecionar texto → oferecer as cores
  useEffect(() => {
    const el = raiz.current
    if (!el) return
    const aoSoltar = () =>
      // espera o navegador terminar a seleção (no toque ela chega depois)
      setTimeout(() => {
        const sel = window.getSelection()
        if (!sel || sel.isCollapsed || !sel.rangeCount) return
        const r = sel.getRangeAt(0)
        const camada = camadaDe(r.startContainer)
        if (!camada || camada !== camadaDe(r.endContainer) || !el.contains(camada)) return
        const mapa = mapear(camada)
        let a = indiceDe(mapa, r.startContainer, r.startOffset)
        let b = indiceDe(mapa, r.endContainer, r.endOffset)
        // sem espaços nas pontas
        while (a < b && /\s/.test(mapa.texto[a])) a++
        while (b > a && /\s/.test(mapa.texto[b - 1])) b--
        if (b - a < 2) return
        const caixa = r.getBoundingClientRect()
        setApagar(false)
        setAberto({ tipo: 'nova', x: caixa.left + caixa.width / 2 + scrollX, y: caixa.bottom + scrollY, camada: camada.dataset.marcavel!, ...recortar(mapa, a, b) })
      }, 10)
    el.addEventListener('mouseup', aoSoltar)
    el.addEventListener('touchend', aoSoltar)
    el.addEventListener('keyup', aoSoltar)
    return () => {
      el.removeEventListener('mouseup', aoSoltar)
      el.removeEventListener('touchend', aoSoltar)
      el.removeEventListener('keyup', aoSoltar)
    }
  }, [raiz])

  // clicar numa marca → abrir a anotação dela
  useEffect(() => {
    const el = raiz.current
    if (!el) return
    const aoClicar = (ev: MouseEvent) => {
      if (!window.getSelection()?.isCollapsed) return
      const camada = camadaDe(ev.target as Node)
      if (!camada) return
      const doc = document as Document & { caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null }
      const pos = doc.caretPositionFromPoint?.(ev.clientX, ev.clientY)
      const r = pos ? null : document.caretRangeFromPoint?.(ev.clientX, ev.clientY)
      const no = pos?.offsetNode ?? r?.startContainer
      const off = pos?.offset ?? r?.startOffset
      if (!no || off === undefined || !camada.contains(no)) return
      const i = indiceDe(mapear(camada), no, off)
      for (const [id, p] of posicoes.current)
        if (p.camada === camada && i >= p.a && i <= p.b) {
          setApagar(false)
          setAberto({ tipo: 'existente', x: ev.clientX + scrollX, y: ev.clientY + scrollY + 8, id })
          return
        }
    }
    el.addEventListener('click', aoClicar)
    return () => el.removeEventListener('click', aoClicar)
  }, [raiz])

  // Esc fecha
  useEffect(() => {
    if (!aberto) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(null)
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [aberto])

  const marca = aberto?.tipo === 'existente' ? marcas.find((m) => m.id === aberto.id) : undefined
  const largura = Math.min(320, window.innerWidth - 24)
  const x = aberto ? Math.max(12 + scrollX, Math.min(aberto.x - largura / 2, scrollX + window.innerWidth - largura - 12)) : 0

  return createPortal(
    <AnimatePresence>
      {aberto && (aberto.tipo === 'nova' || marca) && (
        <>
          <div className="fixed inset-0 z-[44]" onMouseDown={() => setAberto(null)} aria-hidden />
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-label={aberto.tipo === 'nova' ? 'marcar trecho' : 'marca'}
            className="absolute z-[45] rounded-2xl border border-[var(--linha)] bg-[var(--cartao)] p-3 shadow-[0_18px_40px_-16px_rgba(36,34,44,.4)]"
            style={{ left: x, top: aberto.y + 8, width: largura }}
          >
            {aberto.tipo === 'nova' ? (
              <>
                <div className="mb-2 text-xs font-medium text-[var(--tinta-suave)]">🖍 marcar como…</div>
                <EscolherCor
                  escolher={(cor) => {
                    const id = adicionar({ topico, camada: aberto.camada, texto: aberto.texto, antes: aberto.antes, depois: aberto.depois, cor })
                    window.getSelection()?.removeAllRanges()
                    setAberto({ tipo: 'existente', x: aberto.x, y: aberto.y, id, recem: true })
                    // a primeira marca do tópico faz aparecer o cartão de marcas lá em cima e o texto desce: reposiciona
                    setTimeout(() => {
                      const r = rangeDaMarca(raiz.current, aberto)
                      const c = r?.getBoundingClientRect()
                      if (c && c.width) setAberto((a) => (a?.tipo === 'existente' && a.id === id ? { ...a, x: c.left + c.width / 2 + scrollX, y: c.bottom + scrollY } : a))
                    }, 60)
                  }}
                />
              </>
            ) : (
              marca && (
                <>
                  <div className="flex items-center gap-2">
                    <Etiqueta cor={marca.cor} />
                    {aberto.recem && <span className="text-xs text-[var(--menta)]">✓ marcado</span>}
                    <button className="ml-auto text-xs text-[var(--tinta-suave)] hover:underline" onClick={() => setAberto(null)}>
                      fechar
                    </button>
                  </div>
                  <NotaDaMarca key={marca.id} m={marca} foco />
                  <TagsDaMarca m={marca} />
                  <div className="mt-2 text-[11px] text-[var(--tinta-suave)]">trocar a cor:</div>
                  <div className="mt-1">
                    <EscolherCor atual={marca.cor} escolher={(cor) => atualizar(marca.id, { cor })} />
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    {apagar ? (
                      <>
                        <span className="text-[var(--tinta)]">Apagar esta marca{marca.nota ? ' e o que escreveu nela' : ''}?</span>
                        <button
                          className="text-[var(--alerta)] hover:underline"
                          onClick={() => {
                            remover(marca.id)
                            setAberto(null)
                          }}
                        >
                          sim, apagar
                        </button>
                        <button className="text-[var(--tinta-suave)] hover:underline" onClick={() => setApagar(false)}>
                          não
                        </button>
                      </>
                    ) : (
                      <button className="text-[var(--tinta-suave)] hover:text-[var(--alerta)] hover:underline" onClick={() => setApagar(true)}>
                        apagar marca
                      </button>
                    )}
                  </div>
                </>
              )
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/** Lista de marcas com contexto e anotação (no tópico, na folha de anotação e no quadro). */
export function ListaMarcas({
  marcas,
  irPara,
  mostrarTopico = false,
  acoes,
}: {
  marcas: Marca[]
  irPara?: (m: Marca) => void
  mostrarTopico?: boolean
  /** botões extras no pé de cada marca (arquivar, apagar…) */
  acoes?: (m: Marca) => ReactNode
}) {
  const selecionar = useMapa((s) => s.selecionar)
  return (
    <ul className="space-y-3">
      {marcas.map((m) => {
        const tp = topicoPorId.get(m.topico)
        return (
          <li key={m.id} className="rounded-2xl border border-[var(--linha)] bg-[var(--cartao)] px-4 py-3" style={{ borderLeft: `4px solid ${TINTA[m.cor].forte}` }}>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--tinta-suave)]">
              <Etiqueta cor={m.cor} />
              {mostrarTopico && tp ? (
                <button className="font-medium text-[var(--tinta-forte)] hover:underline" onClick={() => selecionar(m.topico)}>
                  {tp.titulo}
                </button>
              ) : null}
              <span>
                {NOME_CAMADA[m.camada] ?? m.camada} · {new Date(m.em).toLocaleDateString('pt-BR')}
              </span>
              {irPara && (
                <button className="ml-auto text-[var(--foco)] hover:underline" onClick={() => irPara(m)}>
                  ver no texto ↓
                </button>
              )}
            </div>
            <Contexto m={m} className="mt-1.5" />
            <NotaDaMarca m={m} />
            <div className="flex flex-wrap items-end justify-end gap-x-3">
              <div className="min-w-[13rem] flex-1">
                <TagsDaMarca m={m} />
              </div>
              {acoes && <div className="mt-2 flex flex-wrap justify-end gap-1">{acoes(m)}</div>}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/** Cartão no topo do tópico: o que você marcou aqui, com o contexto, para retomar. */
export function MarcasDoTopico({ id, irPara }: { id: string; irPara: (m: Marca) => void }) {
  const marcas = useMapa((s) => s.marcas)
  const minhas = marcas.filter((m) => m.topico === id).sort((a, b) => a.em - b.em)
  // recolhido: os trechos já aparecem pintados no texto; a lista é para quando você quer revê-los juntos
  const [aberto, setAberto] = useState(false)
  const [cores, setCores] = useState(false)

  if (!minhas.length) return null

  return (
    <section id="marcas-do-topico" className="mt-12 scroll-mt-24 rounded-3xl border border-[var(--linha)] bg-[var(--papel-2)] px-5 py-4" data-nao-marcar aria-label="suas marcas neste tópico">
      <div className="flex flex-wrap items-center gap-2">
        <button className="text-sm font-semibold text-[var(--tinta-forte)]" onClick={() => setAberto(!aberto)} aria-expanded={aberto}>
          {aberto ? '▾' : '▸'} 🖍 Você marcou {minhas.length} {minhas.length === 1 ? 'trecho' : 'trechos'} aqui
        </button>
        <button className="ml-auto text-xs text-[var(--foco)] hover:underline" onClick={() => setCores(!cores)} aria-expanded={cores}>
          ✎ objetivos das cores
        </button>
      </div>
      {cores && (
        <div className="mt-3 rounded-2xl bg-[var(--cartao)] p-3">
          <EditarCores />
        </div>
      )}
      {aberto && (
        <div className="mt-3">
          <ListaMarcas marcas={minhas} irPara={irPara} />
        </div>
      )}
    </section>
  )
}

function rangeDaMarca(raiz: HTMLElement | null, m: Pick<Marca, 'camada' | 'texto' | 'antes' | 'depois'>) {
  const camada = raiz?.querySelector<HTMLElement>(`[data-marcavel="${m.camada}"]`)
  if (!camada) return null
  const mapa = mapear(camada)
  const achou = localizar(mapa.texto, m)
  return achou && rangeDe(mapa, achou[0], achou[1])
}

/** rola até o trecho marcado (a camada já precisa estar aberta) */
export function rolarAteMarca(raiz: HTMLElement | null, m: Marca) {
  const camada = raiz?.querySelector<HTMLElement>(`[data-marcavel="${m.camada}"]`)
  if (!camada) return
  const r = rangeDaMarca(raiz, m)
  const caixa = (r ?? camada).getBoundingClientRect()
  window.scrollTo({ top: caixa.top + scrollY - window.innerHeight / 3, behavior: 'smooth' })
}
