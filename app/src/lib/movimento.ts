// Movimento de abrir e fechar, igual no app todo. No modo calmo nada se mexe: só aparece e some.
import { useMapa } from '../store/useMapa'

export const SUAVE = [0.4, 0, 0.2, 1] as const

export function useCalmo() {
  return useMapa((s) => s.leitura.calmo)
}

/** Props de movimento para algo que aparece por cima (janela, balão, menu). Use num motion.* dentro de um AnimatePresence. */
export function useSurgir(de: 'centro' | 'baixo' | 'cima' = 'centro') {
  const calmo = useCalmo()
  const y = de === 'baixo' ? 8 : de === 'cima' ? -6 : 0
  const fora = calmo ? { opacity: 0 } : { opacity: 0, scale: 0.97, y }
  return { initial: fora, animate: { opacity: 1, scale: 1, y: 0 }, exit: fora, transition: calmo ? { duration: 0 } : { duration: 0.18, ease: SUAVE } }
}
