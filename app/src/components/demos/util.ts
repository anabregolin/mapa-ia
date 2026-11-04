import { useEffect, useState } from 'react'

/** Estado de uma animação passo a passo: índice, autoplay e recomeço. */
export function usePassos(total: number, ms = 900) {
  const [i, setI] = useState(0)
  const [tocando, setTocando] = useState(false)
  const atual = Math.min(i, Math.max(total - 1, 0))
  const ultimo = atual >= total - 1
  const tocandoAgora = tocando && !ultimo

  useEffect(() => {
    if (!tocandoAgora) return
    const t = setTimeout(() => setI((x) => x + 1), ms)
    return () => clearTimeout(t)
  }, [tocandoAgora, i, ms])

  const recomecar = () => {
    setI(0)
    setTocando(false)
  }
  return { i: atual, setI, ultimo, total, tocandoAgora, setTocando, recomecar }
}

export type Passos = ReturnType<typeof usePassos>

export const seletor = 'rounded-md bg-slate-800 px-2 py-1 text-slate-200'

/** Cores do SVG via variáveis do tema (trocam no tema claro). */
export const C = {
  fundo: 'var(--color-slate-950)',
  linha: 'var(--color-slate-800)',
  neutro: 'var(--color-slate-700)',
  texto: 'var(--color-slate-200)',
  fraco: 'var(--color-slate-500)',
  forte: 'var(--color-slate-50)',
  borda: 'var(--color-slate-900)',
  fronteira: '#22d3ee',
  explorado: '#a78bfa',
  solucao: '#34d399',
  h: 'var(--cor-h)',
  poda: '#f87171',
}
