import { ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { BarraTempo } from './components/BarraTempo'
import { Mapa } from './components/Mapa'
import { Painel } from './components/Painel'
import { Topo } from './components/Topo'

export default function App() {
  return (
    <ReactFlowProvider>
      <div className="relative h-dvh w-full overflow-hidden bg-[#050816] text-slate-100">
        <div className="absolute inset-x-0 bottom-[92px] top-0">
          <Mapa />
        </div>
        <Topo />
        <Painel />
        <BarraTempo />
      </div>
    </ReactFlowProvider>
  )
}
