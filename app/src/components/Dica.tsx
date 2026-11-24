// Dica: explicação curta de um ícone ou tag. Aparece ao passar o mouse, ao focar pelo teclado
// e, no celular (onde não existe "passar o mouse"), ao tocar no ícone.
// Vai num portal com posição fixa: assim não é cortada por cartões com overflow escondido.
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useCalmo } from '../lib/movimento'
import { formatarEstimativa, partesEstimativa, type Estimativa } from '../lib/estimativa'

const MEIA_LARGURA = 124 // metade da largura máxima (15rem) + folga, para não sair da tela

export function Dica({
  texto,
  children,
  toque = true,
  className = '',
}: {
  texto: ReactNode
  children: ReactNode
  /** false quando o filho já faz algo ao tocar (um botão): no celular o toque segue para ele e a dica não aparece */
  toque?: boolean
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const id = useId()
  const [pos, setPos] = useState<{ x: number; y: number; acima: boolean } | null>(null)
  const porToque = useRef(false)
  const calmo = useCalmo()

  const mostrar = () => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const acima = r.top > 90
    setPos({ x: Math.min(Math.max(r.left + r.width / 2, MEIA_LARGURA), window.innerWidth - MEIA_LARGURA), y: acima ? r.top - 6 : r.bottom + 6, acima })
  }
  const esconder = () => setPos(null)

  useEffect(() => {
    if (!pos) return
    const fora = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setPos(null)
    }
    const sair = () => setPos(null)
    document.addEventListener('pointerdown', fora)
    window.addEventListener('scroll', sair, true)
    window.addEventListener('resize', sair)
    return () => {
      document.removeEventListener('pointerdown', fora)
      window.removeEventListener('scroll', sair, true)
      window.removeEventListener('resize', sair)
    }
  }, [pos])

  return (
    <span
      ref={ref}
      className={`inline-flex ${className}`}
      aria-describedby={pos ? id : undefined}
      onPointerEnter={(e) => e.pointerType === 'mouse' && mostrar()}
      onPointerLeave={(e) => e.pointerType === 'mouse' && esconder()}
      onPointerDown={(e) => {
        porToque.current = e.pointerType !== 'mouse'
      }}
      onClick={(e) => {
        if (!toque || !porToque.current) return
        // no celular, tocar no ícone mostra a dica em vez de acionar a linha em volta
        e.preventDefault()
        e.stopPropagation()
        if (pos) esconder()
        else mostrar()
      }}
      onFocus={mostrar}
      onBlur={esconder}
    >
      {children}
      {createPortal(
        <AnimatePresence>
          {pos && (
            <motion.span
              key="dica"
              role="tooltip"
              id={id}
              initial={{ opacity: 0, scale: calmo ? 1 : 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: calmo ? 0 : 0.14 }}
              className="pointer-events-none fixed z-[70] w-max max-w-[15rem] rounded-xl border border-[var(--linha)] bg-[var(--cartao)] px-3 py-2 text-left text-xs font-normal leading-snug text-[var(--tinta)] shadow-[0_8px_24px_-8px_rgba(36,34,44,.25)]"
              style={{ left: pos.x, top: pos.y, x: '-50%', y: pos.acima ? '-100%' : '0%', transformOrigin: pos.acima ? 'bottom center' : 'top center' }}
            >
              {texto}
            </motion.span>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </span>
  )
}

/** Corpo de dica com título, bullets e uma nota em cinza: o mesmo formato na trilha e no tópico. */
export function DicaLista({ titulo, itens, extra, nota }: { titulo: string; itens: [string, string][]; extra?: [string, string]; nota?: string }) {
  return (
    <span className="block min-w-[11rem]">
      <span className="block font-semibold text-[var(--tinta-forte)]">{titulo}</span>
      {itens.length > 0 && (
        <span className="mt-1.5 block space-y-0.5">
          {itens.map(([nome, valor]) => (
            <span key={nome} className="flex items-baseline gap-2">
              <span className="h-1 w-1 shrink-0 translate-y-[-2px] rounded-full bg-[var(--foco)]" aria-hidden />
              <span className="flex-1">{nome}</span>
              <span className="tabular-nums text-[var(--tinta-forte)]">{valor}</span>
            </span>
          ))}
        </span>
      )}
      {/* extra: um número seu (não do palpite), separado da conta */}
      {extra && (
        <span className="mt-1.5 flex items-baseline gap-2 border-t border-[var(--linha)] pt-1.5 font-medium text-[var(--tinta-forte)]">
          <span className="flex-1">{extra[0]}</span>
          <span className="tabular-nums">{extra[1]}</span>
        </span>
      )}
      {nota && <span className="mt-1.5 block border-t border-[var(--linha)] pt-1.5 text-[11px] text-[var(--tinta-suave)]">{nota}</span>}
    </span>
  )
}

/** A conta do tempo esperado de um tópico, em bullets. */
export function DicaEstimativa({ e, extra }: { e: Estimativa; extra?: [string, string] }) {
  return (
    <DicaLista titulo={`Tempo esperado ${formatarEstimativa(e.min)}`} itens={partesEstimativa(e)} extra={extra} nota="Palpite, não medida. Arredondado de 5 em 5 (mínimo 5 min)." />
  )
}
