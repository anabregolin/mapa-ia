import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { memo } from 'react'
import type { Nivel } from '../content/tipos'
import type { TipoNo } from '../lib/layout'
import { TAMANHO } from '../lib/layout'

export type EstadoNo = 'normal' | 'foco' | 'ancestral' | 'descendente' | 'parecido' | 'apagado' | 'fantasma'

export type DadosNo = {
  tipo: TipoNo
  titulo: string
  cor: string
  nivel?: Nivel
  estado: EstadoNo
  estudado?: boolean
  naoVisto?: boolean
  semSlide?: boolean
  /** exercícios com resolução ainda não marcados como feitos */
  pendentes?: number
  duvidas?: number
}

export type NoMapaTipo = Node<DadosNo, 'no'>

export const COR_NIVEL: Record<Nivel, string> = { 1: '#4ade80', 2: '#facc15', 3: '#f87171' }
export const NOME_NIVEL: Record<Nivel, string> = { 1: 'básico', 2: 'intermediário', 3: 'avançado' }

const ANEL: Partial<Record<EstadoNo, string>> = {
  foco: '0 0 0 3px var(--tinta), 0 0 28px 4px color-mix(in srgb, var(--tinta) 35%, transparent)',
  ancestral: '0 0 0 2px #22d3ee, 0 0 18px rgba(34,211,238,.45)',
  descendente: '0 0 0 2px #fb923c, 0 0 18px rgba(251,146,60,.45)',
  parecido: '0 0 0 2px #f472b6, 0 0 18px rgba(244,114,182,.45)',
}

const OPACIDADE: Record<EstadoNo, number> = {
  normal: 1,
  foco: 1,
  ancestral: 1,
  descendente: 1,
  parecido: 1,
  apagado: 0.18,
  fantasma: 0.07,
}

const handleOculto = { opacity: 0, width: 1, height: 1, minWidth: 0, minHeight: 0, border: 0 }

function NoMapaBase({ data }: NodeProps<NoMapaTipo>) {
  const { tipo, titulo, cor, nivel, estado, estudado, naoVisto, semSlide, pendentes, duvidas } = data
  const { w, h } = TAMANHO[tipo]
  const cinza = naoVisto ? '#64748b' : cor

  const estilos: Record<TipoNo, string> = {
    raiz: 'text-lg font-bold tracking-wide rounded-2xl',
    unidade: 'text-[15px] font-semibold rounded-xl',
    grupo: 'text-[13px] font-medium uppercase tracking-wider rounded-full',
    topico: 'text-[13px] rounded-lg',
  }

  const fundo =
    tipo === 'raiz'
      ? 'linear-gradient(135deg,#6366f1,#a855f7 55%,#ec4899)'
      : tipo === 'unidade'
        ? `linear-gradient(135deg, ${cor}, ${cor}99)`
        : tipo === 'grupo'
          ? `${cor}22`
          : 'var(--no-fundo)'

  return (
    <div
      className={`relative flex items-center justify-center gap-2 px-3 text-center leading-tight transition-[opacity,box-shadow,transform] duration-300 ${estilos[tipo]} ${
        tipo === 'topico' ? 'cursor-pointer hover:scale-105' : ''
      }`}
      style={{
        width: w,
        height: h,
        background: fundo,
        color: tipo === 'raiz' || tipo === 'unidade' ? '#0b1020' : 'var(--color-slate-200)',
        border: tipo === 'topico' ? `1.5px ${naoVisto ? 'dashed' : semSlide ? 'dotted' : 'solid'} ${cinza}` : tipo === 'grupo' ? `1px solid ${cor}66` : 'none',
        boxShadow: ANEL[estado] ?? (tipo === 'topico' ? `0 0 14px ${cinza}22` : undefined),
        opacity: OPACIDADE[estado],
      }}
    >
      {tipo === 'topico' && nivel && (
        <span className="flex shrink-0 gap-[2px]" title={NOME_NIVEL[nivel]}>
          {[1, 2, 3].map((i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: i <= nivel ? COR_NIVEL[nivel] : 'var(--color-slate-700)' }} />
          ))}
        </span>
      )}
      <span className={naoVisto ? 'text-slate-400' : ''}>{titulo}</span>
      {!!(pendentes || duvidas) && (
        <span
          className={`absolute -left-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-bold ${duvidas ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-slate-200'}`}
          title={`${pendentes ?? 0} exercício(s) pendente(s)${duvidas ? `, ${duvidas} com dúvida` : ''}`}
        >
          {duvidas ? '?' : pendentes}
        </span>
      )}
      {estudado && <span className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-emerald-400 text-[10px] text-slate-900">✓</span>}

      <Handle id="l-t" type="target" position={Position.Left} style={handleOculto} />
      <Handle id="l-s" type="source" position={Position.Left} style={handleOculto} />
      <Handle id="r-t" type="target" position={Position.Right} style={handleOculto} />
      <Handle id="r-s" type="source" position={Position.Right} style={handleOculto} />
    </div>
  )
}

export const NoMapa = memo(NoMapaBase)
