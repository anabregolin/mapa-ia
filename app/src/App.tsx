import { ReactFlowProvider } from '@xyflow/react'
import { lazy, Suspense, useEffect } from 'react'
import '@xyflow/react/dist/style.css'
import { BarraTempo } from './components/BarraTempo'
import { Mapa } from './components/Mapa'
import { Painel } from './components/Painel'
import { Revisao } from './components/Revisao'
import { Topo } from './components/Topo'
import { useLinkDireto } from './lib/useLinkDireto'
import { useMapa } from './store/useMapa'

// o Three.js só é baixado quando a galáxia aparece
const Galaxia = lazy(() => import('./components/Galaxia'))

export default function App() {
  const tema = useMapa((s) => s.tema)
  const visao = useMapa((s) => s.visao)
  useLinkDireto()
  useEffect(() => {
    // o espaço é escuro: na galáxia o tema claro fica só para o mapa 2D
    document.documentElement.dataset.theme = tema === 'claro' && visao === '2d' ? 'light' : 'dark'
  }, [tema, visao])

  return (
    <ReactFlowProvider>
      <div className="relative h-dvh w-full overflow-hidden bg-[var(--fundo)] text-slate-100">
        <div className="absolute inset-x-0 bottom-[92px] top-0">
          {visao === '3d' ? (
            <Suspense fallback={<div className="grid h-full place-items-center bg-[#03040c] text-sm text-slate-400">abrindo a galáxia…</div>}>
              <Galaxia />
            </Suspense>
          ) : (
            <Mapa />
          )}
        </div>
        <Topo />
        <Painel />
        <BarraTempo />
        <Revisao />
      </div>
    </ReactFlowProvider>
  )
}
