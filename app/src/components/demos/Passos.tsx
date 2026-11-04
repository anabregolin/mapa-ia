import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import type { Passos } from './util'


export function Controles({ p }: { p: Passos }) {
  return (
    <div>
      <div className="flex gap-1.5">
        <button className="rounded-md bg-tinta/10 px-2.5 py-1 text-sm disabled:opacity-30" onClick={() => p.setI(p.i - 1)} disabled={p.i === 0} aria-label="passo anterior">
          ◀
        </button>
        <button className="flex-1 rounded-md bg-violet-500/80 px-2.5 py-1 text-sm font-medium text-white disabled:opacity-40" onClick={() => p.setI(p.i + 1)} disabled={p.ultimo}>
          próximo passo
        </button>
        <button className="rounded-md bg-tinta/10 px-2.5 py-1 text-sm disabled:opacity-30" onClick={() => p.setTocando(!p.tocandoAgora)} disabled={p.ultimo} aria-label="tocar">
          {p.tocandoAgora ? '❚❚' : '▶▶'}
        </button>
        <button className="rounded-md bg-tinta/10 px-2.5 py-1 text-sm" onClick={p.recomecar} aria-label="recomeçar">
          ↺
        </button>
      </div>
      <div className="mt-1 text-xs text-slate-500">
        passo {p.i} de {p.total - 1}
      </div>
    </div>
  )
}

export function Mensagem({ chave, sucesso, children }: { chave: string; sucesso?: boolean; children: ReactNode }) {
  return (
    <motion.div key={chave} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className={`rounded-lg px-3 py-2 text-sm ${sucesso ? 'bg-emerald-400/10 text-emerald-200' : 'bg-tinta/5'}`}>
      {children}
    </motion.div>
  )
}

export function Rotulo({ children }: { children: ReactNode }) {
  return <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">{children}</div>
}

/** Caixa padrão das demos: área principal à esquerda, controles à direita. */
export function MolduraDemo({ principal, lateral }: { principal: ReactNode; lateral: ReactNode }) {
  return (
    <div className="flex h-full flex-col gap-3 overflow-auto rounded-xl bg-slate-950 p-4 text-slate-200 lg:flex-row" onClick={(e) => e.stopPropagation()}>
      <div className="min-w-0 flex-1">{principal}</div>
      <div className="flex w-full shrink-0 flex-col gap-3 lg:w-72">{lateral}</div>
    </div>
  )
}
