// Gravar áudio do microfone e guardar no IndexedDB (lib/gravacoes). Usado na explicação Feynman e no caderno.
import { useEffect, useRef, useState } from 'react'
import { guardarGravacao, type Gravacao } from './gravacoes'

export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

export const podeGravar = () => typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

/** `topico` é a chave onde a gravação fica: o id do tópico, ou "caderno:<página>" */
export function useGravar(topico: string, aoGuardar: (g: Gravacao) => void, limiteS = 10 * 60) {
  const [gravando, setGravando] = useState(false)
  const [segundos, setSegundos] = useState(0)
  const [erro, setErro] = useState('')
  const rec = useRef<MediaRecorder | null>(null)
  const inicio = useRef(0)
  const aoGuardarRef = useRef(aoGuardar)
  useEffect(() => {
    aoGuardarRef.current = aoGuardar
  })

  // saiu da tela gravando: solta o microfone
  useEffect(() => () => rec.current?.stream.getTracks().forEach((t) => t.stop()), [])

  useEffect(() => {
    if (!gravando) return
    const t = setInterval(() => {
      const s = (Date.now() - inicio.current) / 1000
      setSegundos(s)
      if (s >= limiteS) rec.current?.stop()
    }, 250)
    return () => clearInterval(t)
  }, [gravando, limiteS])

  const comecar = async () => {
    setErro('')
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (e) {
      const nome = (e as DOMException).name
      setErro(
        nome === 'NotAllowedError'
          ? 'O navegador não deixou usar o microfone. Libere no cadeado ao lado do endereço e tente de novo.'
          : nome === 'NotFoundError'
            ? 'Não achei nenhum microfone ligado.'
            : 'Não consegui abrir o microfone.',
      )
      return
    }
    const r = new MediaRecorder(stream)
    const pedacos: Blob[] = []
    r.ondataavailable = (ev) => ev.data.size && pedacos.push(ev.data)
    r.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop())
      setGravando(false)
      const duracao = (Date.now() - inicio.current) / 1000
      if (duracao < 1 || !pedacos.length) return
      const g: Gravacao = { id: `g${Date.now().toString(36)}`, topico, em: Date.now(), duracao, blob: new Blob(pedacos, { type: r.mimeType || 'audio/webm' }) }
      try {
        await guardarGravacao(g)
        aoGuardarRef.current(g)
      } catch {
        setErro('Não consegui guardar a gravação (o navegador pode estar sem espaço).')
      }
    }
    rec.current = r
    inicio.current = Date.now()
    setSegundos(0)
    r.start(1000)
    setGravando(true)
  }

  return { gravando, segundos, erro, comecar, parar: () => rec.current?.stop(), suporta: podeGravar() }
}
