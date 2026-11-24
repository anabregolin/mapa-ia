// Tempo de estudo por tópico. Só conta enquanto a aba está visível e você mexeu (rolou, clicou,
// digitou) nos últimos 2 minutos: deixar o tópico aberto e sair não infla o número.

import { useEffect } from 'react'
import { useMapa } from '../store/useMapa'

const PARADO_MS = 2 * 60_000
const PASSO_MS = 5_000
const GRAVAR_MS = 30_000

export function useCronometro(id: string) {
  useEffect(() => {
    let ultimoMexer = Date.now()
    let acumulado = 0
    const mexeu = () => {
      ultimoMexer = Date.now()
    }
    const gravar = () => {
      if (acumulado > 0) useMapa.getState().somarTempo(id, acumulado)
      acumulado = 0
    }
    const eventos = ['pointerdown', 'keydown', 'scroll', 'wheel', 'touchstart', 'pointermove'] as const
    eventos.forEach((e) => window.addEventListener(e, mexeu, { passive: true }))
    const tique = setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - ultimoMexer < PARADO_MS) acumulado += PASSO_MS
      if (acumulado >= GRAVAR_MS) gravar()
    }, PASSO_MS)
    const escondeu = () => document.visibilityState === 'hidden' && gravar()
    document.addEventListener('visibilitychange', escondeu)
    window.addEventListener('pagehide', gravar)
    return () => {
      clearInterval(tique)
      eventos.forEach((e) => window.removeEventListener(e, mexeu))
      document.removeEventListener('visibilitychange', escondeu)
      window.removeEventListener('pagehide', gravar)
      gravar()
    }
  }, [id])
}

/** "1 h 20 min", "35 min", "menos de 1 min" */
export function formatarTempo(ms: number) {
  const min = Math.floor(ms / 60_000)
  if (min < 1) return 'menos de 1 min'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const resto = min % 60
  return resto ? `${h} h ${resto} min` : `${h} h`
}

export const tempoTotal = (tempo: Record<string, { ms: number }>, ids: string[]) => ids.reduce((s, id) => s + (tempo[id]?.ms ?? 0), 0)
