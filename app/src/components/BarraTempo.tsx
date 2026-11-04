import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { ETAPAS, unidadePorId } from '../content/topicos'
import { ULTIMA_ETAPA, useMapa } from '../store/useMapa'

const pct = (pos: number) => (pos / ULTIMA_ETAPA) * 100

export function BarraTempo() {
  const { etapa, revelar, setEtapa, setRevelar } = useMapa()
  const trilho = useRef<HTMLDivElement>(null)
  const [arrastando, setArrastando] = useState(false)
  const atual = ETAPAS.find((e) => e.pos === etapa)!

  const posDoPonteiro = (clientX: number) => {
    const r = trilho.current!.getBoundingClientRect()
    const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width))
    return Math.round(f * ULTIMA_ETAPA)
  }

  const mover = (clientX: number) => {
    const p = posDoPonteiro(clientX)
    if (p !== useMapa.getState().etapa) setEtapa(p, 'barra')
  }

  // ← / → andam uma etapa (fora de campos de texto)
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input:not([type=checkbox]), textarea, select') || useMapa.getState().revisaoAberta) return
      const atualPos = useMapa.getState().etapa
      if (e.key === 'ArrowRight' && atualPos < ULTIMA_ETAPA) setEtapa(atualPos + 1, 'barra')
      if (e.key === 'ArrowLeft' && atualPos > 0) setEtapa(atualPos - 1, 'barra')
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [setEtapa])

  const corDe = (u?: string) => (u ? unidadePorId.get(u as never)!.cor : 'var(--color-slate-200)')

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 border-t border-tinta/10 bg-slate-950/85 px-4 pb-3 pt-2 backdrop-blur-md sm:px-8">
      <div className="mb-1 flex items-center gap-3 text-sm">
        <button
          className="rounded px-2 py-0.5 text-slate-300 hover:bg-tinta/10 disabled:opacity-30"
          onClick={() => setEtapa(etapa - 1, 'barra')}
          disabled={etapa === 0}
          aria-label="Etapa anterior"
        >
          ◀
        </button>
        <motion.div key={etapa} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="min-w-0 flex-1 truncate">
          <span className="font-semibold" style={{ color: corDe(atual.unidade) }}>
            {atual.unidade ? `${atual.unidade.toUpperCase()} · ` : ''}
            {atual.titulo}
          </span>
          <span className="ml-2 text-slate-400">{atual.aulas === '—' ? 'avaliação' : `aula ${atual.aulas}`}</span>
        </motion.div>
        <button
          className="rounded px-2 py-0.5 text-slate-300 hover:bg-tinta/10 disabled:opacity-30"
          onClick={() => setEtapa(etapa + 1, 'barra')}
          disabled={etapa === ULTIMA_ETAPA}
          aria-label="Próxima etapa"
        >
          ▶
        </button>
        <label className="flex cursor-pointer select-none items-center gap-1.5 text-xs text-slate-300" title="Esconde o que vem depois da etapa atual">
          <input type="checkbox" checked={revelar} onChange={(e) => setRevelar(e.target.checked)} className="accent-violet-400" />
          revelar aos poucos
        </label>
        <button className="rounded border border-tinta/15 px-2 py-0.5 text-xs text-slate-300 hover:bg-tinta/10" onClick={() => setEtapa(ULTIMA_ETAPA, 'barra')}>
          ver tudo
        </button>
      </div>

      <div
        ref={trilho}
        className="relative mx-2 h-9 cursor-pointer touch-none select-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          setArrastando(true)
          mover(e.clientX)
        }}
        onPointerMove={(e) => arrastando && mover(e.clientX)}
        onPointerUp={() => setArrastando(false)}
        role="slider"
        aria-label="Linha do tempo das aulas"
        aria-valuemin={0}
        aria-valuemax={ULTIMA_ETAPA}
        aria-valuenow={etapa}
        aria-valuetext={atual.titulo}
      >
        {/* trilho com as cores das unidades */}
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-800" />
        {ETAPAS.slice(1).map((e, i) => (
          <div
            key={e.pos}
            className="absolute top-1/2 h-1 -translate-y-1/2"
            style={{
              left: `${pct(ETAPAS[i].pos)}%`,
              width: `${pct(1)}%`,
              background: e.avaliacao ? 'var(--color-slate-600)' : corDe(e.unidade),
              opacity: e.pos <= etapa ? 0.9 : 0.25,
            }}
          />
        ))}

        {ETAPAS.map((e) => (
          <div
            key={e.pos}
            className="group absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pct(e.pos)}%` }}
          >
            <div
              className={e.avaliacao ? 'h-3 w-3 rotate-45 border-2 bg-slate-950' : 'h-2.5 w-2.5 rounded-full'}
              style={{
                borderColor: e.avaliacao ? '#fbbf24' : undefined,
                background: e.avaliacao ? undefined : e.pos <= etapa ? corDe(e.unidade) : 'var(--color-slate-700)',
              }}
            />
            <div className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-200 group-hover:block">
              {e.titulo}
            </div>
          </div>
        ))}

        <motion.div
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_16px_rgba(255,255,255,.6)]"
          style={{ background: corDe(atual.unidade) }}
          initial={false}
          animate={{ left: `${pct(etapa)}%`, scale: arrastando ? 1.25 : 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        />
      </div>
    </div>
  )
}
