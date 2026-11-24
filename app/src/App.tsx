import { ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { TelaCaderno } from './components/Caderno'
import { TelaConfiguracoes } from './components/Configuracoes'
import { SECOES_CONFIG, type SecaoConfig } from './lib/configuracoes'
import { Mapa } from './components/Mapa'
import { Pomodoro } from './components/Pomodoro'
import { Paineis } from './components/Ajustes'
import { TelaRevisao } from './components/Revisao'
import { Topico } from './components/Topico'
import { Trilha } from './components/Trilha'
import { TelaQuadro } from './components/Quadro'
import { ResolverCalculo, TelaTreino, treinoExiste } from './components/Treino'
import { DesenvolvimentoLivre } from './components/Desenvolvimento'
import { Calculadora } from './components/Calculadora'
import { RodapeGeral } from './components/RodapeGeral'
import { topicoPorId } from './content/topicos'
import { useMapa } from './store/useMapa'
import { aplicarLeitura } from './lib/leitura'
import { ABAS_REVISAO, lembrarDeOnde, usePainel, type AbaRevisao } from './lib/paineis'

type Rota = { tela: 'trilha' } | { tela: 'topico'; id: string } | { tela: 'mapa' } | { tela: 'treino' } | { tela: 'quadro' } | { tela: 'calculo'; id: string; livre?: boolean } | { tela: 'caderno'; id?: string } | { tela: 'revisao'; aba: AbaRevisao; topico?: string } | { tela: 'anotacoes' } | { tela: 'config'; secao?: SecaoConfig }

function lerRota(): Rota {
  const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''))
  if (h === 'mapa') return { tela: 'mapa' }
  if (h === 'treino') return { tela: 'treino' }
  if (h === 'quadro') return { tela: 'quadro' }
  if (h === 'anotacoes') return { tela: 'anotacoes' }
  if (h === 'revisao' || h.startsWith('revisao/')) {
    // #/revisao/slides/u2.astar: a aba e, opcional, o assunto já escolhido nela
    const [aba, topico] = h.slice(8).split('/') as [AbaRevisao, string?]
    return { tela: 'revisao', aba: ABAS_REVISAO.includes(aba) ? aba : 'cartoes', topico: topico && topicoPorId.has(topico) ? topico : undefined }
  }
  if (h === 'configuracoes' || h.startsWith('configuracoes/')) {
    const secao = SECOES_CONFIG.find((s) => s.id === h.slice(14))?.id
    return { tela: 'config', secao }
  }
  if (h === 'caderno') return { tela: 'caderno' }
  if (h.startsWith('caderno/')) return { tela: 'caderno', id: h.slice(8) }
  if (h.startsWith('treino/')) {
    const [id, modo] = h.slice(7).split('/')
    if (treinoExiste(id)) return { tela: 'calculo', id, livre: modo === 'livre' }
  }
  // aceita #/t/u2.astar e o formato antigo #u2.astar
  const id = h.startsWith('t/') ? h.slice(2) : h
  if (topicoPorId.has(id)) return { tela: 'topico', id }
  return { tela: 'trilha' }
}

function useRota() {
  const [rota, setRota] = useState(lerRota)
  const aoMudar = useMapa((s) => s._aoMudarRota)
  useEffect(() => {
    const ouvir = (e: HashChangeEvent) => {
      lembrarDeOnde(new URL(e.oldURL).hash)
      usePainel.getState().fechar()
      const r = lerRota()
      setRota((antes) => {
        // trocar de aba dentro da revisão não sobe a página nem remonta a sessão de cartões
        if (!(antes.tela === 'revisao' && r.tela === 'revisao')) window.scrollTo({ top: 0 })
        return r
      })
    }
    window.addEventListener('hashchange', ouvir)
    return () => window.removeEventListener('hashchange', ouvir)
  }, [])
  useEffect(() => aoMudar(rota.tela === 'topico' ? rota.id : null), [rota, aoMudar])
  return rota
}

function TelaMapa() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-x-0 top-0 bg-[var(--papel)]" style={{ bottom: 'var(--rodape-fixo, 0px)' }}>
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
        {rota.tela === 'quadro' && <TelaQuadro key="anotacoes" aba="quadro" />}
        {rota.tela === 'anotacoes' && <TelaQuadro key="anotacoes" aba="tudo" />}
        {rota.tela === 'revisao' && <TelaRevisao key="revisao" aba={rota.aba} topico={rota.topico} />}
        {rota.tela === 'calculo' && (rota.livre ? <DesenvolvimentoLivre key={`${rota.id}-livre`} id={rota.id} /> : <ResolverCalculo key={rota.id} id={rota.id} />)}
        {rota.tela === 'caderno' && <TelaCaderno key="caderno" paginaId={rota.id} />}
        {rota.tela === 'config' && <TelaConfiguracoes key="config" secao={rota.secao} />}
      </AnimatePresence>
      {/* todas as páginas têm rodapé: trilha e tópico o próprio, as outras este */}
      {rota.tela !== 'trilha' && rota.tela !== 'topico' && <RodapeGeral />}
      <Paineis />
      {/* o rodapé tem os botões do pomodoro e da calculadora: comprimidos, eles somem para lá */}
      <Pomodoro telaMapa={rota.tela === 'mapa'} semBotao />
      <Calculadora semBotao />
    </>
  )
}
