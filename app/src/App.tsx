import { ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Mapa } from './components/Mapa'
import { Pomodoro } from './components/Pomodoro'
import { Revisao } from './components/Revisao'
import { Topico } from './components/Topico'
import { Trilha } from './components/Trilha'
import { TelaQuadro } from './components/Quadro'
import { ResolverCalculo, TelaTreino, treinoExiste } from './components/Treino'
import { topicoPorId } from './content/topicos'
import { useMapa } from './store/useMapa'
import { aplicarLeitura } from './lib/leitura'

type Rota = { tela: 'trilha' } | { tela: 'topico'; id: string } | { tela: 'mapa' } | { tela: 'treino' } | { tela: 'quadro' } | { tela: 'calculo'; id: string }

function lerRota(): Rota {
  const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''))
  if (h === 'mapa') return { tela: 'mapa' }
  if (h === 'treino') return { tela: 'treino' }
  if (h === 'quadro') return { tela: 'quadro' }
  if (h.startsWith('treino/') && treinoExiste(h.slice(7))) return { tela: 'calculo', id: h.slice(7) }
  // aceita #/t/u2.astar e o formato antigo #u2.astar
  const id = h.startsWith('t/') ? h.slice(2) : h
  if (topicoPorId.has(id)) return { tela: 'topico', id }
  return { tela: 'trilha' }
}

function useRota() {
  const [rota, setRota] = useState(lerRota)
  const aoMudar = useMapa((s) => s._aoMudarRota)
  useEffect(() => {
    const ouvir = () => {
      const r = lerRota()
      setRota(r)
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', ouvir)
    return () => window.removeEventListener('hashchange', ouvir)
  }, [])
  useEffect(() => aoMudar(rota.tela === 'topico' ? rota.id : null), [rota, aoMudar])
  return rota
}

function TelaMapa() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-[var(--papel)]">
      <ReactFlowProvider>
        <Mapa />
      </ReactFlowProvider>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2 p-4">
        <a href="#/" className="botao-suave pointer-events-auto shadow-[var(--sombra)]">
          ← trilha
        </a>
        <span className="pointer-events-auto rounded-full bg-[var(--cartao)]/90 px-3 py-1 text-xs text-[var(--tinta-suave)] shadow-[var(--sombra)]">
          visão geral das conexões · clique num tópico para estudar
        </span>
      </div>
    </motion.div>
  )
}

export default function App() {
  const rota = useRota()
  const leitura = useMapa((s) => s.leitura)
  useEffect(() => aplicarLeitura(leitura), [leitura])
  useEffect(() => {
    // os componentes herdados (fórmulas, exercícios, mapa) usam a escala clara
    document.documentElement.dataset.theme = 'light'
  }, [])

  return (
    <>
      <AnimatePresence mode="wait">
        {rota.tela === 'trilha' && <Trilha key="trilha" />}
        {rota.tela === 'topico' && <Topico key={rota.id} id={rota.id} />}
        {rota.tela === 'mapa' && <TelaMapa key="mapa" />}
        {rota.tela === 'treino' && <TelaTreino key="treino" />}
        {rota.tela === 'quadro' && <TelaQuadro key="quadro" />}
        {rota.tela === 'calculo' && <ResolverCalculo key={rota.id} id={rota.id} />}
      </AnimatePresence>
      <Revisao />
      <Pomodoro telaMapa={rota.tela === 'mapa'} />
    </>
  )
}
