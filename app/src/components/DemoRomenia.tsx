import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { ALGORITMOS, CIDADES, ESTRADAS, H_BUCHAREST, NOMES, simular, type Algoritmo, type Cidade } from '../lib/romenia'

// coordenadas do livro têm y para cima; o SVG tem y para baixo
const X = (c: Cidade) => CIDADES[c][0]
const Y = (c: Cidade) => 610 - CIDADES[c][1]

export function DemoRomenia() {
  const [alg, setAlg] = useState<Algoritmo>('astar')
  const [origem, setOrigem] = useState<Cidade>('Arad')
  const [i, setI] = useState(0)
  const [tocando, setTocando] = useState(false)

  const quadros = useMemo(() => simular(alg, origem), [alg, origem])
  const q = quadros[Math.min(i, quadros.length - 1)]
  const ultimo = i >= quadros.length - 1
  const info = ALGORITMOS[alg]

  const tocandoAgora = tocando && !ultimo
  useEffect(() => {
    if (!tocandoAgora) return
    const t = setTimeout(() => setI((x) => x + 1), 900)
    return () => clearTimeout(t)
  }, [tocandoAgora, i])

  const recomecar = () => {
    setI(0)
    setTocando(false)
  }

  const naFronteira = new Set(q.fronteira.map((n) => n.cidade))
  const explorados = new Set(q.explorados)
  const caminho = q.solucao?.caminho ?? q.expandido?.caminho ?? []
  const noCaminho = (a: Cidade, b: Cidade) => {
    const k = caminho.indexOf(a)
    return k >= 0 && (caminho[k + 1] === b || caminho[k - 1] === b)
  }
  const prioridade = (n: { g: number; h: number; f: number }) => (alg === 'ucs' ? n.g : alg === 'gulosa' ? n.h : alg === 'astar' ? n.f : 0)
  const fronteiraOrdenada = alg === 'bfs' || alg === 'dfs' ? (alg === 'dfs' ? [...q.fronteira].reverse() : q.fronteira) : [...q.fronteira].sort((a, b) => prioridade(a) - prioridade(b))

  const corCidade = (c: Cidade) => {
    if (q.solucao && q.solucao.caminho.includes(c)) return '#34d399'
    if (q.expandido?.cidade === c) return '#ffffff'
    if (naFronteira.has(c)) return '#22d3ee'
    if (explorados.has(c)) return '#a78bfa'
    return '#334155'
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto rounded-xl bg-slate-950 p-4 text-slate-200 lg:flex-row" onClick={(e) => e.stopPropagation()}>
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
          <select value={alg} onChange={(e) => {
              setAlg(e.target.value as Algoritmo)
              recomecar()
            }} className="rounded-md bg-slate-800 px-2 py-1">
            {(Object.keys(ALGORITMOS) as Algoritmo[]).map((a) => (
              <option key={a} value={a}>
                {ALGORITMOS[a].nome}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-slate-400">
            de
            <select value={origem} onChange={(e) => {
                setOrigem(e.target.value as Cidade)
                recomecar()
              }} className="rounded-md bg-slate-800 px-2 py-1 text-slate-200">
              {NOMES.filter((c) => c !== 'Bucharest').map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            até <span className="font-medium text-slate-200">Bucharest</span>
          </label>
          <span className="text-xs text-slate-500">{info.regra}</span>
        </div>

        <svg viewBox="40 20 580 380" className="w-full rounded-lg bg-[#070b1a]" role="img" aria-label="Mapa da Romênia com o estado da busca">
          {ESTRADAS.map(([a, b, km]) => {
            const ativa = noCaminho(a, b)
            return (
              <g key={a + b}>
                <line x1={X(a)} y1={Y(a)} x2={X(b)} y2={Y(b)} stroke={ativa ? (q.solucao ? '#34d399' : '#f8fafc') : '#1e293b'} strokeWidth={ativa ? 3.5 : 2} />
                <text x={(X(a) + X(b)) / 2} y={(Y(a) + Y(b)) / 2 - 3} fontSize={9} fill="#64748b" textAnchor="middle">
                  {km}
                </text>
              </g>
            )
          })}
          {NOMES.map((c) => {
            const atual = q.expandido?.cidade === c
            return (
              <g key={c}>
                {atual && (
                  <motion.circle cx={X(c)} cy={Y(c)} r={9} fill="none" stroke="#fff" strokeWidth={2} initial={{ r: 4, opacity: 0 }} animate={{ r: 12, opacity: 1 }} transition={{ duration: 0.4 }} />
                )}
                <circle cx={X(c)} cy={Y(c)} r={6} fill={corCidade(c)} stroke="#0f172a" strokeWidth={1.5} />
                <text x={X(c) + 9} y={Y(c) - 6} fontSize={11} fill={corCidade(c) === '#334155' ? '#94a3b8' : '#e2e8f0'}>
                  {c}
                </text>
                {info.precisaH && (
                  <text x={X(c) + 9} y={Y(c) + 8} fontSize={9} fill="#fbbf24">
                    h={H_BUCHAREST[c]}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
          <span><span className="text-white">●</span> expandido agora</span>
          <span><span className="text-cyan-400">●</span> fronteira</span>
          <span><span className="text-violet-400">●</span> explorado</span>
          <span><span className="text-emerald-400">●</span> solução</span>
          {info.precisaH && <span className="text-amber-300">h = linha reta até Bucharest</span>}
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col gap-3 lg:w-72">
        <div className="flex gap-1.5">
          <button className="rounded-md bg-white/10 px-2.5 py-1 text-sm disabled:opacity-30" onClick={() => setI((x) => x - 1)} disabled={i === 0}>◀</button>
          <button className="flex-1 rounded-md bg-violet-500/80 px-2.5 py-1 text-sm font-medium text-white disabled:opacity-40" onClick={() => setI((x) => x + 1)} disabled={ultimo}>
            próximo passo
          </button>
          <button className="rounded-md bg-white/10 px-2.5 py-1 text-sm disabled:opacity-30" onClick={() => setTocando(!tocandoAgora)} disabled={ultimo}>
            {tocandoAgora ? '❚❚' : '▶▶'}
          </button>
          <button className="rounded-md bg-white/10 px-2.5 py-1 text-sm" onClick={recomecar}>↺</button>
        </div>
        <div className="text-xs text-slate-500">
          passo {Math.min(i, quadros.length - 1)} de {quadros.length - 1}
        </div>

        <motion.div key={`${alg}${origem}${i}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className={`rounded-lg px-3 py-2 text-sm ${q.solucao ? 'bg-emerald-400/10 text-emerald-200' : 'bg-white/5'}`}>
          {q.mensagem}
          {q.solucao && <div className="mt-1 text-xs text-emerald-300/80">{q.solucao.caminho.join(' → ')}</div>}
        </motion.div>

        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
            Fronteira {alg === 'bfs' ? '(fila: sai o primeiro)' : alg === 'dfs' ? '(pilha: sai o primeiro)' : '(sai o menor)'}
          </div>
          <table className="w-full text-xs">
            <thead className="text-slate-500">
              <tr>
                <th className="text-left font-normal">cidade</th>
                <th className="text-right font-normal">g</th>
                {info.precisaH && <th className="text-right font-normal">h</th>}
                {alg === 'astar' && <th className="text-right font-normal">f</th>}
              </tr>
            </thead>
            <tbody>
              {fronteiraOrdenada.map((n, k) => (
                <tr key={n.cidade} className={k === 0 && !q.solucao ? 'text-cyan-300' : 'text-slate-300'}>
                  <td>{n.cidade}</td>
                  <td className="text-right tabular-nums">{n.g}</td>
                  {info.precisaH && <td className="text-right tabular-nums">{n.h}</td>}
                  {alg === 'astar' && <td className="text-right tabular-nums">{n.f}</td>}
                </tr>
              ))}
              {!fronteiraOrdenada.length && (
                <tr>
                  <td className="text-slate-500">vazia</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="text-xs text-slate-500">
          Explorados: <span className="text-slate-300">{q.explorados.join(', ') || '—'}</span>
        </div>
        <p className="text-[11px] leading-snug text-slate-500">
          Busca em grafo (não repete cidades exploradas), vizinhos em ordem alfabética. Distâncias e h do livro-texto (AIMA), as mesmas dos slides.
        </p>
      </div>
    </div>
  )
}
