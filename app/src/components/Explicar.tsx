// Técnica de Feynman: explicar o tópico para alguém que sabe menos, escrevendo ou gravando.
// Depois, reler/reouvir com uma lista de conferência. Nada sai do computador.
import { useEffect, useMemo, useRef, useState } from 'react'
import { palavrasDoTopico } from '../content/palavras'
import { topicoPorId } from '../content/topicos'
import { apagarGravacao, extensao, gravacoesDo, guardarGravacao, type Gravacao } from '../lib/gravacoes'
import { useMapa } from '../store/useMapa'

const CONFERIR = [
  'Usei palavras simples (e expliquei cada termo técnico que apareceu)',
  'Dei um exemplo concreto',
  'Expliquei o porquê, não só o quê',
  'Disse quando usar e quando não funciona',
  'Consegui explicar sem olhar o texto',
]

const LIMITE_S = 10 * 60

/** tira acentos, LaTeX e pontuação para comparar palavras */
const normal = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\\[a-z]+|[$^_{}]/gi, ' ')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .toLowerCase()

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

function Gravador({ topico }: { topico: string }) {
  const [lista, setLista] = useState<Gravacao[]>([])
  const [gravando, setGravando] = useState(false)
  const [segundos, setSegundos] = useState(0)
  const [erro, setErro] = useState('')
  const [apagar, setApagar] = useState<string | null>(null)
  const rec = useRef<MediaRecorder | null>(null)
  const inicio = useRef(0)
  const suporta = typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  const recarregar = () =>
    gravacoesDo(topico)
      .then(setLista)
      .catch(() => setErro('Não consegui ler as gravações guardadas neste navegador.'))
  useEffect(() => {
    recarregar()
    return () => rec.current?.stream.getTracks().forEach((t) => t.stop())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topico])

  useEffect(() => {
    if (!gravando) return
    const t = setInterval(() => {
      const s = (Date.now() - inicio.current) / 1000
      setSegundos(s)
      if (s >= LIMITE_S) rec.current?.stop()
    }, 250)
    return () => clearInterval(t)
  }, [gravando])

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
      const blob = new Blob(pedacos, { type: r.mimeType || 'audio/webm' })
      try {
        await guardarGravacao({ id: `g${Date.now().toString(36)}`, topico, em: Date.now(), duracao, blob })
        recarregar()
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

  if (!suporta) return <p className="text-sm text-[var(--tinta-suave)]">Este navegador não grava áudio. Dá para explicar por escrito.</p>

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {gravando ? (
          <button className="flex items-center gap-2 rounded-full bg-[var(--coral)] px-4 py-2 text-sm font-semibold text-white" onClick={() => rec.current?.stop()}>
            <span className="h-2.5 w-2.5 animate-pulse rounded-sm bg-white" /> parar · {mmss(segundos)}
          </button>
        ) : (
          <button className="botao-foco" onClick={comecar}>
            🎙 gravar explicação
          </button>
        )}
        <span className="text-xs text-[var(--tinta-suave)]">{gravando ? `para sozinho em ${mmss(LIMITE_S)}` : 'Fica só neste navegador. Não vai para a internet.'}</span>
      </div>
      {erro && <p className="mt-2 text-sm text-[var(--alerta)]">{erro}</p>}

      {lista.length > 0 && (
        <ul className="mt-4 space-y-3">
          {lista.map((g, i) => (
            <Linha key={g.id} g={g} n={lista.length - i} apagar={apagar === g.id} pedirApagar={(sim) => setApagar(sim ? g.id : null)} apagou={recarregar} topico={topico} />
          ))}
        </ul>
      )}
      {lista.length > 0 && (
        <p className="mt-3 text-[11px] text-[var(--tinta-suave)]">
          ⚠ Os áudios não entram no backup em JSON. Se quiser guardar um, use “baixar”.
        </p>
      )}
    </div>
  )
}

function Linha({ g, n, apagar, pedirApagar, apagou, topico }: { g: Gravacao; n: number; apagar: boolean; pedirApagar: (sim: boolean) => void; apagou: () => void; topico: string }) {
  const url = useMemo(() => URL.createObjectURL(g.blob), [g.blob])
  useEffect(() => () => URL.revokeObjectURL(url), [url])
  const quando = new Date(g.em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  const nome = `explicacao-${topico}-${n}.${extensao(g.blob.type)}`
  return (
    <li className="rounded-2xl bg-[var(--papel-2)] px-3 py-2.5">
      <div className="mb-1.5 flex flex-wrap items-center gap-x-3 text-xs text-[var(--tinta-suave)]">
        <span className="font-medium text-[var(--tinta)]">Gravação {n}</span>
        <span>{quando}</span>
        <span>{mmss(g.duracao)}</span>
        <a className="ml-auto text-[var(--foco)] hover:underline" href={url} download={nome}>
          baixar
        </a>
        {apagar ? (
          <span className="flex gap-2">
            apagar mesmo?
            <button className="text-[var(--alerta)] hover:underline" onClick={() => apagarGravacao(g.id).then(apagou)}>
              sim
            </button>
            <button className="hover:underline" onClick={() => pedirApagar(false)}>
              não
            </button>
          </span>
        ) : (
          <button className="hover:text-[var(--alerta)] hover:underline" onClick={() => pedirApagar(true)}>
            apagar
          </button>
        )}
      </div>
      <audio controls preload="metadata" src={url} className="h-9 w-full" />
    </li>
  )
}

/** Seção "Explique para alguém que sabe menos", no fim do tópico. */
export function Explicar({ id, cor }: { id: string; cor: string }) {
  const f = useMapa((s) => s.feynman[id])
  const salvar = useMapa((s) => s.salvarFeynman)
  const [aberto, setAberto] = useState(!!f?.texto)
  const [modo, setModo] = useState<'texto' | 'audio'>('texto')
  const palavras = useMemo(() => palavrasDoTopico(id, 8), [id])
  const texto = f?.texto ?? ''
  const conferido = f?.conferido ?? {}
  const tp = topicoPorId.get(id)!

  const presentes = useMemo(() => {
    const t = ` ${normal(texto)} `
    return new Set(palavras.filter((p) => normal(p) && t.includes(` ${normal(p)} `)))
  }, [texto, palavras])
  const nPalavras = texto.trim() ? texto.trim().split(/\s+/).length : 0
  const marcar = (item: string) => {
    const novo = { ...conferido }
    if (novo[item]) delete novo[item]
    else novo[item] = true
    salvar(id, { conferido: novo })
  }

  return (
    <section className="mt-8 rounded-3xl border border-[var(--linha)] bg-[var(--cartao)] shadow-[var(--sombra)]" aria-label="explicar o tópico">
      <button className="flex w-full items-center gap-3 px-5 py-4 text-left sm:px-8" onClick={() => setAberto(!aberto)} aria-expanded={aberto}>
        <span className="text-2xl">🗣</span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-[var(--tinta-forte)]">Explique para alguém que sabe menos</span>
          <span className="block text-sm text-[var(--tinta-suave)]">{f?.texto ? 'Você já começou uma explicação aqui.' : 'Onde você travar é exatamente o que falta estudar.'}</span>
        </span>
        <span className={`text-[var(--tinta-suave)] transition-transform ${aberto ? 'rotate-90' : ''}`}>▸</span>
      </button>

      {aberto && (
        <div className="border-t border-[var(--linha)] px-5 pb-6 pt-4 sm:px-8">
          <p className="fonte-leitura text-[var(--tinta)]">
            Imagine uma colega do primeiro semestre que nunca ouviu falar de <strong>{tp.titulo}</strong>. Feche o texto acima e explique para ela: o que é, para que serve e um exemplo.
          </p>

          <div role="tablist" className="mt-4 inline-flex rounded-full bg-[var(--papel-2)] p-1 text-sm">
            {(['texto', 'audio'] as const).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={modo === m}
                onClick={() => setModo(m)}
                className={`rounded-full px-3.5 py-1 ${modo === m ? 'bg-[var(--cartao)] font-medium text-[var(--tinta-forte)] shadow-sm' : 'text-[var(--tinta-suave)]'}`}
              >
                {m === 'texto' ? '✍ escrever' : '🎙 falar'}
              </button>
            ))}
          </div>

          <div className="mt-3">
            {modo === 'texto' ? (
              <>
                <textarea
                  value={texto}
                  onChange={(e) => salvar(id, { texto: e.target.value })}
                  rows={7}
                  placeholder="Sabe quando…? Então, isso é…"
                  className="fonte-leitura w-full resize-y rounded-2xl border border-[var(--linha)] bg-[var(--papel)] px-4 py-3 text-[var(--tinta-forte)] focus:border-[var(--foco)] focus:outline-none"
                />
                <div className="mt-1 text-[11px] text-[var(--tinta-suave)]">{nPalavras} palavras · salva sozinho</div>
              </>
            ) : (
              <Gravador topico={id} />
            )}
          </div>

          <div className="mt-6">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--tinta-suave)]">Ao reler ou reouvir, confira</div>
            <ul className="mt-2 space-y-1">
              {CONFERIR.map((item) => (
                <li key={item}>
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-lg px-1 py-1 text-sm text-[var(--tinta)] hover:bg-[var(--papel-2)]">
                    <input type="checkbox" checked={!!conferido[item]} onChange={() => marcar(item)} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--foco)]" />
                    {item}
                  </label>
                </li>
              ))}
            </ul>

            {palavras.length > 0 && (
              <div className="mt-4">
                <div className="text-sm text-[var(--tinta)]">
                  Ideias-chave que costumam aparecer numa boa explicação
                  {modo === 'texto' && texto.trim() && (
                    <span className="text-[var(--tinta-suave)]">
                      {' '}
                      · {presentes.size} de {palavras.length} no seu texto
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {palavras.map((p) => {
                    const chave = `palavra:${p}`
                    const ok = (modo === 'texto' && presentes.has(p)) || !!conferido[chave]
                    return (
                      <button
                        key={p}
                        onClick={() => marcar(chave)}
                        title={modo === 'texto' && presentes.has(p) ? 'apareceu no seu texto' : 'clique se você falou disso'}
                        className="rounded-full px-2.5 py-0.5 text-[13px] transition-colors"
                        style={ok ? { background: `color-mix(in srgb, ${cor} 22%, var(--cartao))`, color: 'var(--tinta-forte)' } : { background: 'var(--papel-2)', color: 'var(--tinta-suave)' }}
                      >
                        {ok ? '✓ ' : ''}
                        {p}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-1.5 text-[11px] text-[var(--tinta-suave)]">
                  Não precisa usar as mesmas palavras: dizer a ideia com as suas conta. No texto eu só acho a palavra exata; marque à mão o que você disse de outro jeito.
                </p>
              </div>
            )}

            <label className="mt-5 block text-sm text-[var(--tinta)]">
              Onde travei ou fiquei enrolando
              <textarea
                value={f?.travei ?? ''}
                onChange={(e) => salvar(id, { travei: e.target.value })}
                rows={2}
                placeholder="ex.: não soube dizer por que a heurística precisa ser admissível"
                className="mt-1 w-full resize-y rounded-xl border border-[var(--linha)] bg-[var(--papel)] px-3 py-2 text-sm text-[var(--tinta-forte)] focus:border-[var(--foco)] focus:outline-none"
              />
            </label>
          </div>
        </div>
      )}
    </section>
  )
}
