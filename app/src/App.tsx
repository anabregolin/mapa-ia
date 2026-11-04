import { ReactFlowProvider } from '@xyflow/react'
import { useEffect } from 'react'
import '@xyflow/react/dist/style.css'
import { BarraTempo } from './components/BarraTempo'
import { Mapa } from './components/Mapa'
import { Painel } from './components/Painel'
import { Revisao } from './components/Revisao'
import { Topo } from './components/Topo'
import { useMapa } from './store/useMapa'

export default function App() {
  const tema = useMapa((s) => s.tema)
  useEffect(() => {
    document.documentElement.dataset.theme = tema === 'claro' ? 'light' : 'dark'
  }, [tema])

  return (
    <ReactFlowProvider>
      <div className="relative h-dvh w-full overflow-hidden bg-[var(--fundo)] text-slate-100">
        <div className="absolute inset-x-0 bottom-[92px] top-0">
          <Mapa />
        </div>
        <Topo />
        <Painel />
        <BarraTempo />
        <Revisao />
      </div>
    </ReactFlowProvider>
  )
}
