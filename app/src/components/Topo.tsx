import { useEffect, useMemo, useRef, useState } from 'react'
import { TOPICOS, UNIDADES, unidadePorId } from '../content/topicos'
import { useMapa } from '../store/useMapa'
import { COR_NIVEL, NOME_NIVEL } from './NoMapa'

const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

const INDICE = TOPICOS.map((t) => ({ t, texto: normalizar(`${t.titulo} ${t.resumo}`), titulo: normalizar(t.titulo) }))

function Busca() {
  const selecionar = useMapa((s) => s.selecionar)
  const [q, setQ] = useState('')
  const [ativo, setAtivo] = useState(0)
  const campo = useRef<HTMLInputElement>(null)

  const resultados = useMemo(() => {
    const n = normalizar(q.trim())
    if (!n) return []
    return INDICE.filter((i) => i.texto.includes(n))
      .sort((a, b) => Number(b.titulo.includes(n)) - Number(a.titulo.includes(n)))
      .slice(0, 8)
      .map((i) => i.t)
  }, [q])

  useEffect(() => {
    const atalho = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== campo.current) {
        e.preventDefault()
        campo.current?.focus()
      }
    }
    window.addEventListener('keydown', atalho)
    return () => window.removeEventListener('keydown', atalho)
  }, [])

  const escolher = (id: string) => {
    selecionar(id)
    setQ('')
    campo.current?.blur()
  }

  return (
    <div className="relative w-full max-w-xs">
      <input
        ref={campo}
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setAtivo(0)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') setAtivo((a) => Math.min(a + 1, resultados.length - 1))
          if (e.key === 'ArrowUp') setAtivo((a) => Math.max(a - 1, 0))
          if (e.key === 'Enter' && resultados[ativo]) escolher(resultados[ativo].id)
          if (e.key === 'Escape') setQ('')
        }}
        placeholder="Buscar tópico…  /"
        className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-400/60 focus:outline-none"
      />
      {resultados.length > 0 && (
        <ul className="absolute left-0 right-0 top-full mt-1 overflow-hidden rounded-lg border border-white/10 bg-slate-900/95 shadow-xl backdrop-blur">
          {resultados.map((t, i) => (
            <li key={t.id}>
              <button
                onMouseEnter={() => setAtivo(i)}
                onClick={() => escolher(t.id)}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${i === ativo ? 'bg-white/10' : ''}`}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: unidadePorId.get(t.unidade)!.cor }} />
                <span className="truncate text-slate-200">{t.titulo}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function Topo() {
  const { corPor, setCorPor, estudados } = useMapa()
  const total = TOPICOS.filter((t) => !t.naoVisto).length
  const feitos = TOPICOS.filter((t) => !t.naoVisto && estudados[t.id]).length

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-start gap-3 p-3 sm:p-4">
      <div className="pointer-events-auto rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 backdrop-blur">
        <h1 className="text-sm font-bold text-white">Mapa de IA</h1>
        <div className="text-[11px] text-slate-400">
          PUCRS · 2026/2 · {feitos}/{total} estudados
        </div>
      </div>

      <div className="pointer-events-auto flex-1 sm:flex-none">
        <Busca />
      </div>

      <div className="pointer-events-auto ml-auto hidden rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-slate-300 backdrop-blur md:block">
        <div className="mb-1.5 flex gap-1">
          {(['unidade', 'nivel'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCorPor(c)}
              className={`rounded px-2 py-0.5 ${corPor === c ? 'bg-white/15 text-white' : 'text-slate-400 hover:bg-white/5'}`}
            >
              cor por {c === 'nivel' ? 'nível' : 'unidade'}
            </button>
          ))}
        </div>
        <ul className="space-y-0.5">
          {corPor === 'unidade'
            ? UNIDADES.map((u) => (
                <li key={u.id} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: u.cor }} />
                  {u.id.toUpperCase()} · {u.titulo}
                </li>
              ))
            : ([1, 2, 3] as const).map((n) => (
                <li key={n} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: COR_NIVEL[n] }} />
                  {NOME_NIVEL[n]}
                </li>
              ))}
        </ul>
        <div className="mt-1.5 space-y-0.5 border-t border-white/10 pt-1.5 text-[11px] text-slate-400">
          <div><span className="text-cyan-300">━</span> precisa de · <span className="text-orange-300">━</span> leva a · <span className="text-pink-300">┅</span> parecido</div>
          <div>borda pontilhada = sem slide · tracejada = não visto</div>
        </div>
      </div>
    </header>
  )
}
