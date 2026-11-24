// Transições de abrir e fechar, iguais no app todo.
// Expande: uma parte que cresce para baixo (sanfona). Surge: algo que aparece por cima (janela, balão).
// No modo calmo nada se mexe: a parte só aparece e some.
import { AnimatePresence, motion, type HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'
import { SUAVE, useCalmo, useSurgir } from '../lib/movimento'

/**
 * Sanfona: abre de cima para baixo e fecha do mesmo jeito.
 * O overflow fica escondido só durante o movimento; aberta, nada é cortado (sombras, balões, foco).
 */
export function Expande({ aberto, children, className = '', id }: { aberto: boolean; children: ReactNode; className?: string; id?: string }) {
  const calmo = useCalmo()
  return (
    <AnimatePresence initial={false}>
      {aberto && (
        <motion.div
          id={id}
          key="expande"
          className={className}
          style={{ overflow: 'hidden' }}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1, transitionEnd: { overflow: 'visible' } }}
          exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
          transition={calmo ? { duration: 0 } : { height: { duration: 0.26, ease: SUAVE }, opacity: { duration: 0.18 } }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Janela ou balão por cima da tela: aparece crescendo um pouco e some do mesmo jeito. Use dentro de um AnimatePresence. */
export function Surge({ children, de = 'centro', ...resto }: { children: ReactNode; de?: 'centro' | 'baixo' | 'cima' } & HTMLMotionProps<'div'>) {
  return (
    <motion.div {...useSurgir(de)} {...resto}>
      {children}
    </motion.div>
  )
}

/** Fundo escuro de uma janela: entra e sai em fade. */
export function Fundo(props: HTMLMotionProps<'div'>) {
  const calmo = useCalmo()
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: calmo ? 0 : 0.18 }} {...props} />
}
