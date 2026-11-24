// Janelinhas flutuantes que você arrasta (pomodoro, calculadora). A posição fica salva neste aparelho
// e presa ao canto mais próximo: assim, ao abrir ou comprimir, ela cresce para longe da borda.
import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent as ME, type PointerEvent as PE } from 'react'

export interface Ancora {
  lado: 'esq' | 'dir'
  /** distância da borda esquerda ou direita */
  x: number
  borda: 'cima' | 'baixo'
  /** distância da borda de cima ou de baixo */
  y: number
}

const MARGEM = 8
const LIMIAR = 4

function ler(chave: string): Ancora | null {
  try {
    const a = JSON.parse(localStorage.getItem(chave) ?? 'null') as Ancora | null
    return a && typeof a.x === 'number' && typeof a.y === 'number' ? a : null
  } catch {
    return null
  }
}

function gravar(chave: string, a: Ancora | null) {
  try {
    if (a) localStorage.setItem(chave, JSON.stringify(a))
    else localStorage.removeItem(chave)
  } catch {
    /* sem armazenamento: a posição vale só até recarregar */
  }
}

const tela = () => ({ w: window.innerWidth, h: window.innerHeight })

export function useFlutuante(chave: string, padrao: Ancora) {
  const el = useRef<HTMLDivElement | null>(null)
  const [salva, setSalva] = useState(() => ler(chave))
  const [tam, setTam] = useState({ w: 0, h: 0 })
  const [vp, setVp] = useState(tela)
  /** posição durante o arraste (canto de cima à esquerda) */
  const [vivo, setVivo] = useState<{ x: number; y: number } | null>(null)
  const arrastou = useRef(false)

  useEffect(() => {
    const aoMudarTela = () => setVp(tela())
    window.addEventListener('resize', aoMudarTela)
    return () => window.removeEventListener('resize', aoMudarTela)
  }, [])

  // tamanho da janelinha (muda ao abrir/comprimir); ref de callback porque ela pode aparecer e sumir
  const ref = useCallback((no: HTMLDivElement | null) => {
    el.current = no
    if (!no) return
    const medir = () => setTam({ w: no.offsetWidth, h: no.offsetHeight })
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(no)
    return () => ro.disconnect()
  }, [])

  const a = salva ?? padrao
  // nunca sai da tela: se não couber, encosta na borda
  const x = Math.max(MARGEM, Math.min(a.x, vp.w - tam.w - MARGEM))
  const y = Math.max(MARGEM, Math.min(a.y, vp.h - tam.h - MARGEM))
  const estilo: CSSProperties = vivo
    ? { left: vivo.x, top: vivo.y }
    : {
        [a.lado === 'esq' ? 'left' : 'right']: x,
        // embaixo, sobe acima do rodapé fixo quando a tela tem um (--rodape-fixo já inclui a área segura)
        [a.borda === 'cima' ? 'top' : 'bottom']: a.borda === 'baixo' ? `calc(${y}px + var(--rodape-fixo, env(safe-area-inset-bottom, 0px)))` : y,
      }

  const aoApertar = useCallback(
    (e: PE<HTMLElement>) => {
      if (e.button !== 0 || !el.current) return
      const r = el.current.getBoundingClientRect()
      const ini = { px: e.clientX, py: e.clientY }
      let movendo = false
      arrastou.current = false
      const posDe = (ev: PointerEvent) => {
        const v = tela()
        return {
          x: Math.max(MARGEM, Math.min(r.left + ev.clientX - ini.px, v.w - r.width - MARGEM)),
          y: Math.max(MARGEM, Math.min(r.top + ev.clientY - ini.py, v.h - r.height - MARGEM)),
        }
      }
      const mover = (ev: PointerEvent) => {
        if (!movendo && Math.hypot(ev.clientX - ini.px, ev.clientY - ini.py) < LIMIAR) return
        movendo = true
        arrastou.current = true
        setVivo(posDe(ev))
      }
      const soltar = (ev: PointerEvent) => {
        window.removeEventListener('pointermove', mover)
        window.removeEventListener('pointerup', soltar)
        window.removeEventListener('pointercancel', soltar)
        if (!movendo) return
        const p = posDe(ev)
        const v = tela()
        // prende ao canto mais próximo do centro da janelinha
        const nova: Ancora = {
          lado: p.x + r.width / 2 < v.w / 2 ? 'esq' : 'dir',
          x: p.x + r.width / 2 < v.w / 2 ? p.x : v.w - p.x - r.width,
          borda: p.y + r.height / 2 < v.h / 2 ? 'cima' : 'baixo',
          y: p.y + r.height / 2 < v.h / 2 ? p.y : v.h - p.y - r.height,
        }
        setSalva(nova)
        gravar(chave, nova)
        setVivo(null)
      }
      window.addEventListener('pointermove', mover)
      window.addEventListener('pointerup', soltar)
      window.addEventListener('pointercancel', soltar)
    },
    [chave],
  )

  /** Props da parte por onde se arrasta. O clique que termina um arraste não conta como clique. */
  const alca = {
    onPointerDown: aoApertar,
    onClickCapture: (e: ME) => {
      if (!arrastou.current) return
      arrastou.current = false
      e.preventDefault()
      e.stopPropagation()
    },
    style: { touchAction: 'none', userSelect: 'none', cursor: vivo ? 'grabbing' : 'grab' } as CSSProperties,
  }

  const voltarAoLugar = () => {
    setSalva(null)
    gravar(chave, null)
  }

  return { ref, estilo, alca, arrastando: !!vivo, voltarAoLugar, movida: !!salva }
}
