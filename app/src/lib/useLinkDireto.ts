import { useEffect } from 'react'
import { topicoPorId } from '../content/topicos'
import { useMapa } from '../store/useMapa'

/** Link direto: #u2.astar abre o tópico; a seleção atualiza o endereço. Vale para as duas visões. */
export function useLinkDireto() {
  const selecionado = useMapa((s) => s.selecionado)
  const selecionar = useMapa((s) => s.selecionar)
  useEffect(() => {
    const doHash = () => {
      const id = decodeURIComponent(location.hash.slice(1))
      if (topicoPorId.has(id)) selecionar(id)
    }
    doHash()
    window.addEventListener('hashchange', doHash)
    return () => window.removeEventListener('hashchange', doHash)
  }, [selecionar])
  useEffect(() => {
    const alvo = selecionado ? `#${selecionado}` : location.pathname + location.search
    if (location.hash !== (selecionado ? `#${selecionado}` : '')) history.replaceState(null, '', alvo)
  }, [selecionado])
}
