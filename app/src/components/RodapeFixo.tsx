// Barra fixa no pé da tela (tópico e trilha). Publica a própria altura em --rodape-fixo,
// para o pomodoro, a calculadora e o aviso de pausa ficarem acima dela.
import { useEffect, useRef, type ReactNode } from 'react'

// Na troca de tela, a barra nova monta antes de a antiga sair (a animação de saída segura a antiga).
// Só quem publicou por último pode apagar a variável; senão a antiga, ao sair, apagaria a da nova.
let dono: HTMLElement | null = null

export function RodapeFixo({ rotulo, largura, children }: { rotulo: string; largura: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const raiz = document.documentElement
    const ro = new ResizeObserver(() => {
      dono = el
      raiz.style.setProperty('--rodape-fixo', `${el.offsetHeight}px`)
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
      if (dono === el) {
        dono = null
        raiz.style.removeProperty('--rodape-fixo')
      }
    }
  }, [])
  return (
    <footer
      ref={ref}
      className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--linha)] bg-[var(--papel)]/85 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label={rotulo}
    >
      <div className={`mx-auto flex items-center gap-2 px-4 py-2.5 sm:px-6 ${largura}`}>{children}</div>
    </footer>
  )
}
