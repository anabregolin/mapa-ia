// Slides da aula: prévia dentro do texto do tópico e a galeria completa em Revisão › Slides da aula.
// As imagens são geradas na sua máquina por scripts/slides.mjs e ficam fora do git (public/slides/).
// Você escolhe e fixa as páginas que importam para cada tópico.
import { useEffect, useState, type ReactNode } from 'react'
import { topicoPorId } from '../content/topicos'
import { useMapa } from '../store/useMapa'
import { AnimatePresence, motion } from 'framer-motion'
import { Expande, Fundo } from './Abrir'
import { useSurgir } from '../lib/movimento'

export type Indice = Record<string, number>
/** No site publicado não há slides (ficam fora do git); a dica de "npm run slides" só faz sentido no computador. */
const LOCAL = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
let cache: Promise<Indice | null> | null = null
export const lerIndice = () =>
  (cache ??= fetch(`${import.meta.env.BASE_URL}slides/indice.json`)
    .then((r) => (r.ok ? (r.json() as Promise<Indice>) : null))
    .catch(() => null))

export const img = (arquivo: string, n: number) => `${import.meta.env.BASE_URL}slides/${arquivo}/${n}.jpg`

/** "50-54" → [50, 54]; "45" → [45, 45] */
const faixa = (p?: string): [number, number] | null => {
  if (!p) return null
  const [a, b] = p.split('-').map(Number)
  return Number.isFinite(a) ? [a, Number.isFinite(b) ? b : a] : null
}

function Pagina({ arquivo, n, fixada, alternar }: { arquivo: string; n: number; fixada: boolean; alternar: () => void }) {
  const [ampliada, setAmpliada] = useState(false)
  return (
    <figure className="m-0">
      <button className="block w-full overflow-hidden rounded-xl border border-[var(--linha)] bg-white" onClick={() => setAmpliada(!ampliada)} title={ampliada ? 'diminuir' : 'ampliar'}>
        <img src={img(arquivo, n)} alt={`slide ${n} de ${arquivo}`} loading="lazy" className={`block w-full ${ampliada ? '' : 'max-h-72 object-contain'}`} />
      </button>
      <figcaption className="mt-1 flex items-center gap-2 text-[11px] text-[var(--tinta-suave)]">
        {arquivo} · p. {n}
        <button className={`ml-auto rounded-full px-2 py-0.5 ${fixada ? 'bg-[var(--foco-claro)] text-[var(--foco)]' : 'hover:bg-[var(--papel-2)]'}`} onClick={alternar}>
          📌 {fixada ? 'fixada aqui' : 'fixar neste tópico'}
        </button>
      </figcaption>
    </figure>
  )
}

/** índice dos slides gerados + fontes do tópico que têm pasta + páginas que você fixou */
function useSlidesDoTopico(id: string) {
  const tp = topicoPorId.get(id)!
  const fixadas = useMapa((s) => s.slidesFixados[id]) ?? []
  const [indice, setIndice] = useState<Indice | null | undefined>(undefined)
  useEffect(() => {
    lerIndice().then(setIndice)
  }, [])
  // cada fonte do tópico → pasta de slides renderizada (o nome da fonte é prefixo do arquivo)
  const fontes = tp.fontes
    .map((f) => ({ ...f, pasta: indice ? Object.keys(indice).find((k) => k.startsWith(f.arquivo)) : undefined }))
    .filter((f): f is typeof f & { pasta: string } => !!f.pasta)
  return { indice, fontes, fixadas }
}

/** imagem do slide em tela cheia; clicar ou Esc fecha */
export function Ampliado({ arquivo, n, fechar }: { arquivo: string; n: number; fechar: () => void }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && fechar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [fechar])
  const surgir = useSurgir()
  return (
    <Fundo data-ampliado className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4" onClick={fechar} role="dialog" aria-label={`slide ${n} de ${arquivo}`}>
      <motion.img {...surgir} src={img(arquivo, n)} alt={`slide ${n} de ${arquivo}`} className="max-h-full max-w-full rounded-xl bg-white object-contain shadow-2xl" />
      <span className="absolute bottom-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
        {arquivo} · p. {n} · clique para fechar
      </span>
    </Fundo>
  )
}

/**
 * "Como aparece no slide": dentro da explicação, as páginas que você fixou ou, sem nenhuma fixada,
 * as páginas da aula onde o tópico está. Só aparece se houver página conhecida (não chuta a aula inteira).
 */
export function SlidesNoTexto({ id }: { id: string }) {
  const { indice, fontes, fixadas } = useSlidesDoTopico(id)
  const [grande, setGrande] = useState<{ arquivo: string; n: number } | null>(null)
  if (!indice) return null
  const paginas: { arquivo: string; n: number }[] = fixadas.length
    ? fixadas.map((k) => ({ arquivo: k.split('#')[0], n: Number(k.split('#')[1]) }))
    : fontes.flatMap((f) => {
        const r = faixa(f.paginas)
        if (!r) return []
        return Array.from({ length: Math.min(r[1], indice[f.pasta]) - r[0] + 1 }, (_, i) => ({ arquivo: f.pasta, n: r[0] + i }))
      })
  if (!paginas.length) return null
  const mostrar = paginas.slice(0, 6)
  return (
    <div className="mt-6">
      <div className="rotulo-formula mb-2 flex items-baseline gap-2">
        📄 Como aparece no slide
        <span className="font-normal normal-case tracking-normal">{fixadas.length ? 'as páginas que você fixou' : 'páginas da aula sobre isto'}</span>
      </div>
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
        {mostrar.map((p) => (
          <button
            key={`${p.arquivo}#${p.n}`}
            onClick={() => setGrande(p)}
            className="shrink-0 snap-start overflow-hidden rounded-xl border border-[var(--linha)] bg-white text-left"
            title="ampliar"
          >
            <img src={img(p.arquivo, p.n)} alt={`slide ${p.n} de ${p.arquivo}`} loading="lazy" className="block h-36 w-auto max-w-none sm:h-44" />
            <span className="block bg-[var(--cartao)] px-2 py-1 text-[10px] text-[var(--tinta-suave)]">p. {p.n}</span>
          </button>
        ))}
      </div>
      {paginas.length > mostrar.length && (
        <p className="text-xs text-[var(--tinta-suave)]">
          +{paginas.length - mostrar.length} páginas em{' '}
          <a className="font-medium text-[var(--foco)] hover:underline" href={`#/revisao/slides/${id}`}>
            Revisão › Slides da aula
          </a>
          .
        </p>
      )}
      <AnimatePresence>{grande && <Ampliado key="ampliado" {...grande} fechar={() => setGrande(null)} />}</AnimatePresence>
    </div>
  )
}

export function Slides({
  id,
  aberto: abertoFora,
  setAberto: setAbertoFora,
  vazio = null,
}: {
  id: string
  aberto?: boolean
  setAberto?: (a: boolean) => void
  /** o que mostrar quando o assunto não tem aula ligada nem página fixada */
  vazio?: ReactNode
}) {
  const { indice, fontes, fixadas } = useSlidesDoTopico(id)
  const alternar = useMapa((s) => s.alternarSlide)
  const [abertoDentro, setAbertoDentro] = useState(false)
  const aberto = abertoFora ?? abertoDentro
  const setAberto = setAbertoFora ?? setAbertoDentro
  const [atual, setAtual] = useState<{ arquivo: string; n: number } | null>(null)

  if (indice === undefined) return null
  if (indice && !fontes.length && !fixadas.length) return <>{vazio}</>
  if (indice === null)
    return LOCAL ? (
      <p className="mt-6 text-xs text-[var(--tinta-suave)]">
        📄 Os slides ainda não foram gerados nesta máquina. No terminal, dentro de <code>app/</code>: <code>npm run slides</code>
      </p>
    ) : (
      <p className="mt-6 text-xs text-[var(--tinta-suave)]">📄 Os slides da aula só aparecem no app do seu computador: eles não vão para o site.</p>
    )

  const total = atual ? indice[atual.arquivo] : 0
  const abrir = (arquivo: string, n: number) => setAtual({ arquivo, n: Math.min(Math.max(1, n), indice[arquivo]) })
  const chave = (arquivo: string, n: number) => `${arquivo}#${n}`
  const fixadaLista = fixadas.map((k) => {
    const [arquivo, n] = k.split('#')
    return { arquivo, n: Number(n), k }
  })

  return (
    <section id="slides-da-aula" className="mt-8 scroll-mt-24 rounded-3xl border border-[var(--linha)] bg-[var(--cartao)] shadow-[var(--sombra)]" aria-label="slides da aula">
      <button className="flex w-full items-center gap-3 px-5 py-4 text-left sm:px-8" onClick={() => setAberto(!aberto)} aria-expanded={aberto}>
        <span className="text-2xl">📄</span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-[var(--tinta-forte)]">Slides da aula</span>
          <span className="block text-sm text-[var(--tinta-suave)]">
            {fixadas.length ? `${fixadas.length} ${fixadas.length === 1 ? 'página fixada' : 'páginas fixadas'} por você` : 'Só na sua máquina. Fixe as páginas que ajudam.'}
          </span>
        </span>
        <span className={`text-[var(--tinta-suave)] transition-transform ${aberto ? 'rotate-90' : ''}`}>▸</span>
      </button>

      {/* as fixadas aparecem mesmo com a seção fechada: são as imagens que você escolheu */}
      {fixadaLista.length > 0 && (
        <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2 sm:px-8">
          {fixadaLista.map((p) => (
            <Pagina key={p.k} arquivo={p.arquivo} n={p.n} fixada alternar={() => alternar(id, p.k)} />
          ))}
        </div>
      )}

      <Expande aberto={aberto}>
        <div className="border-t border-[var(--linha)] px-5 pb-6 pt-4 sm:px-8">
          <div className="flex flex-wrap gap-2 text-sm">
            {fontes.map((f) => {
              const r = faixa(f.paginas)
              return (
                <button key={f.pasta + f.paginas} className="botao-suave" onClick={() => abrir(f.pasta, r ? r[0] : 1)}>
                  {f.arquivo}
                  {r ? ` · p. ${f.paginas}` : ` · ${indice[f.pasta]} p.`}
                </button>
              )
            })}
          </div>
          {!fontes.some((f) => f.paginas) && (
            <p className="mt-2 text-xs text-[var(--tinta-suave)]">Ainda não sei em que páginas este tópico aparece. Folheie a aula e fixe as que valem.</p>
          )}

          {atual && (
            <div className="mt-4">
              <div className="mb-2 flex items-center gap-2 text-sm">
                <button className="botao-suave" disabled={atual.n <= 1} onClick={() => abrir(atual.arquivo, atual.n - 1)} aria-label="página anterior">
                  ←
                </button>
                <label className="flex items-center gap-1 text-[var(--tinta-suave)]">
                  p.
                  <input
                    type="number"
                    min={1}
                    max={total}
                    value={atual.n}
                    onChange={(e) => abrir(atual.arquivo, Number(e.target.value) || 1)}
                    className="w-16 rounded-lg border border-[var(--linha)] bg-[var(--papel)] px-2 py-1 text-right text-[var(--tinta-forte)]"
                  />
                  de {total}
                </label>
                <button className="botao-suave" disabled={atual.n >= total} onClick={() => abrir(atual.arquivo, atual.n + 1)} aria-label="próxima página">
                  →
                </button>
              </div>
              <Pagina arquivo={atual.arquivo} n={atual.n} fixada={fixadas.includes(chave(atual.arquivo, atual.n))} alternar={() => alternar(id, chave(atual.arquivo, atual.n))} />
            </div>
          )}
        </div>
      </Expande>
    </section>
  )
}
