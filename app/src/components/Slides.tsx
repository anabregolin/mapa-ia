// Slides da aula dentro do tópico. As imagens são geradas na sua máquina por scripts/slides.mjs
// e ficam fora do git (public/slides/). Você escolhe e fixa as páginas que importam para cada tópico.
import { useEffect, useState } from 'react'
import { topicoPorId } from '../content/topicos'
import { useMapa } from '../store/useMapa'

type Indice = Record<string, number>
let cache: Promise<Indice | null> | null = null
const lerIndice = () =>
  (cache ??= fetch(`${import.meta.env.BASE_URL}slides/indice.json`)
    .then((r) => (r.ok ? (r.json() as Promise<Indice>) : null))
    .catch(() => null))

const img = (arquivo: string, n: number) => `${import.meta.env.BASE_URL}slides/${arquivo}/${n}.jpg`

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

export function Slides({ id }: { id: string }) {
  const tp = topicoPorId.get(id)!
  const fixadas = useMapa((s) => s.slidesFixados[id]) ?? []
  const alternar = useMapa((s) => s.alternarSlide)
  const [indice, setIndice] = useState<Indice | null | undefined>(undefined)
  const [aberto, setAberto] = useState(false)
  const [atual, setAtual] = useState<{ arquivo: string; n: number } | null>(null)

  useEffect(() => {
    lerIndice().then(setIndice)
  }, [])

  // cada fonte do tópico → pasta de slides renderizada (o nome da fonte é prefixo do arquivo)
  const fontes = tp.fontes
    .map((f) => ({ ...f, pasta: indice ? Object.keys(indice).find((k) => k.startsWith(f.arquivo)) : undefined }))
    .filter((f): f is typeof f & { pasta: string } => !!f.pasta)

  if (indice === undefined || (!fontes.length && !fixadas.length)) return null
  if (indice === null)
    return (
      <p className="mt-6 text-xs text-[var(--tinta-suave)]">
        📄 Os slides ainda não foram gerados nesta máquina. No terminal, dentro de <code>app/</code>: <code>npm run slides</code>
      </p>
    )

  const total = atual ? indice[atual.arquivo] : 0
  const abrir = (arquivo: string, n: number) => setAtual({ arquivo, n: Math.min(Math.max(1, n), indice[arquivo]) })
  const chave = (arquivo: string, n: number) => `${arquivo}#${n}`
  const fixadaLista = fixadas.map((k) => {
    const [arquivo, n] = k.split('#')
    return { arquivo, n: Number(n), k }
  })

  return (
    <section className="mt-8 rounded-3xl border border-[var(--linha)] bg-[var(--cartao)] shadow-[var(--sombra)]" aria-label="slides da aula">
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

      {aberto && (
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
      )}
    </section>
  )
}
