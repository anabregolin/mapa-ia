import { Fragment } from 'react'
import { Tex } from './FormulaAnimada'

/** Texto corrido com $latex$ inline e **negrito**. */
export function Texto({ children }: { children: string }) {
  const partes = children.split(/(\$[^$]+\$|\*\*[^*]+\*\*)/g)
  return (
    <>
      {partes.map((p, i) => {
        if (p.startsWith('$') && p.endsWith('$') && p.length > 2) return <Tex key={i} latex={p.slice(1, -1)} />
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="font-semibold text-slate-50">{p.slice(2, -2)}</strong>
        return <Fragment key={i}>{p}</Fragment>
      })}
    </>
  )
}
