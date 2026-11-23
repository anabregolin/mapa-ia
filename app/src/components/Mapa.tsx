import { Background, BackgroundVariant, Controls, MiniMap, ReactFlow, useReactFlow, type Edge, type Viewport } from '@xyflow/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ETAPAS, GRUPOS, TOPICOS, UNIDADES, topicoPorId, unidadePorId } from '../content/topicos'
import { EXERCICIOS, temResolucao } from '../content/exercicios'
import { PARECIDOS, PREREQS, ancestrais, descendentes } from '../lib/grafo'
import { TAMANHO, calcularLayout, idGrupo, type NoLayout } from '../lib/layout'
import { ULTIMA_ETAPA, useMapa } from '../store/useMapa'
import { COR_NIVEL, NoMapa, type EstadoNo, type NoMapaTipo } from './NoMapa'

const LAYOUT = calcularLayout()
const nodeTypes = { no: NoMapa }

const tituloDe = (n: NoLayout): string => {
  if (n.tipo === 'raiz') return 'Inteligência Artificial'
  if (n.tipo === 'unidade') return `${n.unidade!.toUpperCase()} · ${unidadePorId.get(n.unidade!)!.titulo}`
  if (n.tipo === 'grupo') return GRUPOS.find((g) => idGrupo(g.id) === n.id)!.titulo
  return topicoPorId.get(n.id)!.titulo
}

/** Lado do nó por onde a aresta sai/entra, para não cruzar o próprio nó. */
function handles(de: NoLayout, para: NoLayout) {
  const direita = para.x >= de.x
  return { sourceHandle: direita ? 'r-s' : 'l-s', targetHandle: direita ? 'l-t' : 'r-t' }
}

/** Quais nós enquadrar quando a barra para numa etapa. */
function nosDaEtapa(pos: number): string[] {
  const etapa = ETAPAS.find((e) => e.pos === pos)!
  if (pos === 0) return ['raiz', ...UNIDADES.map((u) => `un:${u.id}`)]
  let alvo: (t: (typeof TOPICOS)[number]) => boolean = (t) => t.etapa === pos
  if (etapa.avaliacao) {
    // avaliação: enquadra o bloco de aulas desde a avaliação anterior
    const anterior = Math.max(0, ...ETAPAS.filter((e) => e.avaliacao && e.pos < pos).map((e) => e.pos))
    alvo = (t) => t.etapa > anterior && t.etapa < pos
  }
  const ids = TOPICOS.filter(alvo).map((t) => t.id)
  const grupos = new Set(TOPICOS.filter(alvo).map((t) => idGrupo(t.grupo)))
  return [...ids, ...grupos]
}

export function Mapa() {
  const { selecionado, hover, etapa, origemEtapa, corPor, revelar, estudados, exercicios, tema, selecionar, setHover, setEtapa } = useMapa()
  const rf = useReactFlow()
  const caixa = useRef<HTMLDivElement>(null)
  // as animações de câmera só valem depois que o React Flow fez o enquadramento inicial
  const [pronto, setPronto] = useState(false)
  const etapaAnterior = useRef<number | null>(null)

  const foco = hover ?? selecionado
  const destaque = useMemo(() => {
    if (!foco || !topicoPorId.has(foco)) return null
    const parecidos = new Set(PARECIDOS.filter((c) => c.de === foco || c.para === foco).map((c) => (c.de === foco ? c.para : c.de)))
    return { anc: ancestrais(foco), desc: descendentes(foco), parecidos }
  }, [foco])

  // por tópico: exercícios praticáveis que faltam fazer, e quantos estão com dúvida
  const pendencias = useMemo(() => {
    const r = new Map<string, { pendentes: number; duvidas: number }>()
    for (const ex of EXERCICIOS) {
      if (!temResolucao(ex)) continue
      const p = exercicios[ex.id]
      for (const id of ex.topicos) {
        const atual = r.get(id) ?? { pendentes: 0, duvidas: 0 }
        if (p !== 'feito') atual.pendentes++
        if (p === 'duvida') atual.duvidas++
        r.set(id, atual)
      }
    }
    return r
  }, [exercicios])

  const nodes: NoMapaTipo[] = useMemo(() => {
    return [...LAYOUT.values()].map((n) => {
      const tp = n.tipo === 'topico' ? topicoPorId.get(n.id)! : undefined
      const corUnidade = n.unidade ? unidadePorId.get(n.unidade)!.cor : '#a855f7'
      const cor = tp && corPor === 'nivel' ? COR_NIVEL[tp.nivel] : corUnidade

      let estado: EstadoNo = 'normal'
      if (revelar && n.etapa > etapa) estado = 'fantasma'
      else if (destaque) {
        if (n.id === foco) estado = 'foco'
        else if (destaque.anc.has(n.id)) estado = 'ancestral'
        else if (destaque.desc.has(n.id)) estado = 'descendente'
        else if (destaque.parecidos.has(n.id)) estado = 'parecido'
        else estado = 'apagado'
      }

      const { w, h } = TAMANHO[n.tipo]
      return {
        id: n.id,
        type: 'no',
        position: { x: n.x - w / 2, y: n.y - h / 2 },
        width: w,
        height: h,
        draggable: false,
        selectable: n.tipo === 'topico',
        zIndex: estado === 'foco' ? 10 : 1,
        data: {
          tipo: n.tipo,
          titulo: tituloDe(n),
          cor,
          nivel: tp?.nivel,
          estado,
          estudado: !!estudados[n.id],
          naoVisto: tp?.naoVisto,
          semSlide: tp?.semSlide,
          pendentes: pendencias.get(n.id)?.pendentes,
          duvidas: pendencias.get(n.id)?.duvidas,
        },
      }
    })
  }, [corPor, revelar, etapa, destaque, foco, estudados, pendencias])

  const edges: Edge[] = useMemo(() => {
    const lista: Edge[] = []
    for (const n of LAYOUT.values()) {
      if (!n.pai) continue
      const pai = LAYOUT.get(n.pai)!
      const cor = n.unidade ? unidadePorId.get(n.unidade)!.cor : '#a855f7'
      const fantasma = revelar && n.etapa > etapa
      const ligado = destaque && (n.id === foco || destaque.anc.has(n.id) || destaque.desc.has(n.id)) && (pai.id === foco || destaque.anc.has(pai.id) || destaque.desc.has(pai.id))
      lista.push({
        id: `arv:${n.id}`,
        source: pai.id,
        target: n.id,
        ...handles(pai, n),
        style: { stroke: cor, strokeWidth: n.tipo === 'topico' ? 1.5 : 2.5, opacity: fantasma ? 0.05 : destaque && !ligado ? 0.06 : 0.55 },
      })
    }
    if (!destaque || !foco) return lista

    // pré-requisitos (azul, chegando no foco) e dependentes (laranja, saindo)
    const cadeiaAnc = new Set([...destaque.anc, foco])
    const cadeiaDesc = new Set([...destaque.desc, foco])
    for (const c of PREREQS) {
      const anc = cadeiaAnc.has(c.de) && cadeiaAnc.has(c.para)
      const desc = cadeiaDesc.has(c.de) && cadeiaDesc.has(c.para)
      if (!anc && !desc) continue
      const de = LAYOUT.get(c.de)!
      const para = LAYOUT.get(c.para)!
      lista.push({
        id: `pre:${c.de}>${c.para}`,
        source: c.de,
        target: c.para,
        ...handles(de, para),
        animated: true,
        zIndex: 5,
        style: { stroke: anc ? '#22d3ee' : '#fb923c', strokeWidth: 2 },
        label: c.nota,
      })
    }
    for (const c of PARECIDOS) {
      if (c.de !== foco && c.para !== foco) continue
      const de = LAYOUT.get(c.de)!
      const para = LAYOUT.get(c.para)!
      lista.push({
        id: `par:${c.de}~${c.para}`,
        source: c.de,
        target: c.para,
        ...handles(de, para),
        type: 'default',
        zIndex: 5,
        style: { stroke: '#f472b6', strokeWidth: 2, strokeDasharray: '6 5' },
        label: c.nota,
        labelStyle: { fill: 'var(--color-pink-200)', fontSize: 12 },
        labelBgStyle: { fill: 'var(--rotulo-fundo)', fillOpacity: 0.9 },
        labelBgPadding: [6, 3],
        labelBgBorderRadius: 4,
      })
    }
    return lista
  }, [destaque, foco, revelar, etapa])

  // A barra mandou mudar de etapa → a câmera voa até lá.
  useEffect(() => {
    if (!pronto) return
    const primeira = etapaAnterior.current === null
    etapaAnterior.current = etapa
    if (origemEtapa !== 'barra') return
    // abrindo por link direto, quem manda na câmera é o tópico selecionado
    if (primeira && useMapa.getState().selecionado) return
    const ids = etapa === ULTIMA_ETAPA && !revelar ? null : nosDaEtapa(etapa)
    const t = setTimeout(() => {
      if (ids) rf.fitView({ nodes: ids.map((id) => ({ id })), duration: 800, padding: 0.3, maxZoom: 1.1 })
      else rf.fitView({ duration: 800, padding: 0.05 })
    }, 30)
    return () => clearTimeout(t)
  }, [etapa, origemEtapa, revelar, rf, pronto])

  // Clicar num tópico "mergulha": zoom animado até ele, deixando espaço para o painel.
  useEffect(() => {
    if (!selecionado || !pronto) return
    const n = LAYOUT.get(selecionado)
    if (!n) return
    const zoom = 1.25
    const largura = caixa.current?.clientWidth ?? 1200
    const deslocamento = largura > 900 ? 220 / zoom : 0
    const t = setTimeout(() => rf.setCenter(n.x + deslocamento, n.y, { zoom, duration: 700 }), 40)
    return () => clearTimeout(t)
  }, [selecionado, rf, pronto])

  // O usuário arrastou o mapa → a barra acompanha o tópico mais perto do centro.
  const aoMover = useCallback(
    (evento: MouseEvent | TouchEvent | null, vp: Viewport) => {
      if (!evento || !caixa.current) return
      const cx = (caixa.current.clientWidth / 2 - vp.x) / vp.zoom
      const cy = (caixa.current.clientHeight / 2 - vp.y) / vp.zoom
      let melhor: NoLayout | null = null
      let dist = Infinity
      for (const n of LAYOUT.values()) {
        if (n.tipo !== 'topico') continue
        const d = (n.x - cx) ** 2 + (n.y - cy) ** 2
        if (d < dist) {
          dist = d
          melhor = n
        }
      }
      if (melhor && melhor.etapa !== useMapa.getState().etapa) setEtapa(melhor.etapa, 'mapa')
    },
    [setEtapa],
  )

  return (
    <div ref={caixa} className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.05 }}
        minZoom={0.08}
        maxZoom={2.5}
        nodesConnectable={false}
        nodesDraggable={false}
        elementsSelectable
        onlyRenderVisibleElements={false}
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, n) => topicoPorId.has(n.id) && selecionar(n.id)}
        onNodeMouseEnter={(_, n) => topicoPorId.has(n.id) && setHover(n.id)}
        onNodeMouseLeave={() => setHover(null)}
        onMoveEnd={aoMover}
        onInit={() => setPronto(true)}
        colorMode={tema === 'claro' ? 'light' : 'dark'}
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={1.2} color="var(--color-slate-800)" />
        <Controls showInteractive={false} position="bottom-left" style={{ bottom: 16 }} />
        <MiniMap
          position="bottom-right"
          className="!hidden sm:!block"
          style={{ bottom: 16, background: 'var(--fundo-2)' }}
          pannable
          zoomable
          nodeColor={(n) => (n as NoMapaTipo).data.cor}
          maskColor={tema === 'claro' ? 'rgba(148,163,184,.35)' : 'rgba(2,6,23,.7)'}
        />
      </ReactFlow>
    </div>
  )
}
