import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { ALGORITMOS, GRAFOS_BUSCA, rotulo, simular, type Algoritmo } from '../../lib/busca'
import { Controles, Mensagem, MolduraDemo, Rotulo } from './Passos'
import { C, seletor, usePassos } from './util'

export function DemoBusca({ grafoInicial = 'romenia' }: { grafoInicial?: string }) {
  const [idGrafo, setIdGrafo] = useState(grafoInicial)
  const grafo = GRAFOS_BUSCA.find((g) => g.id === idGrafo)!
  const [alg, setAlg] = useState<Algoritmo>('astar')
  const [origem, setOrigem] = useState(grafo.origemPadrao)

  const quadros = useMemo(() => simular(grafo, alg, origem), [grafo, alg, origem])
  const p = usePassos(quadros.length)
  const q = quadros[p.i]
  const info = ALGORITMOS[alg]

  // escala pelo tamanho do viewBox, para o texto ficar do mesmo tamanho em todos os grafos
  const [vx, vy, vw, vh] = grafo.viewBox.split(' ').map(Number)
  const k = vw / 580
  const X = (n: string) => grafo.nos[n][0]
  const Y = (n: string) => grafo.nos[n][1]

  const naFronteira = new Set(q.fronteira.map((n) => n.no))
  const explorados = new Set(q.explorados)
  const caminho = q.solucao?.caminho ?? q.expandido?.caminho ?? []
  const noCaminho = (a: string, b: string) => {
    const i = caminho.indexOf(a)
    return i >= 0 && (caminho[i + 1] === b || caminho[i - 1] === b)
  }
  const prioridade = (n: { g: number; h: number; f: number }) => (alg === 'ucs' ? n.g : alg === 'gulosa' ? n.h : n.f)
  const fronteiraOrdenada = alg === 'bfs' ? q.fronteira : alg === 'dfs' ? [...q.fronteira].reverse() : [...q.fronteira].sort((a, b) => prioridade(a) - prioridade(b))

  const cor = (n: string) => {
    if (q.solucao?.caminho.includes(n)) return C.solucao
    if (q.expandido?.no === n) return C.forte
    if (naFronteira.has(n)) return C.fronteira
    if (explorados.has(n)) return C.explorado
    return C.neutro
  }
  const objetivos = grafo.objetivos.map((o) => rotulo(grafo, o)).filter((o, i, a) => a.indexOf(o) === i)

  const trocar = (f: () => void) => {
    f()
    p.recomecar()
  }

  return (
    <MolduraDemo
      principal={
        <>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
            <select
              value={idGrafo}
              onChange={(e) =>
                trocar(() => {
                  const g = GRAFOS_BUSCA.find((x) => x.id === e.target.value)!
                  setIdGrafo(g.id)
                  setOrigem(g.origemPadrao)
                })
              }
              className={seletor}
              aria-label="grafo"
            >
              {GRAFOS_BUSCA.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nome}
                </option>
              ))}
            </select>
            <select value={alg} onChange={(e) => trocar(() => setAlg(e.target.value as Algoritmo))} className={seletor} aria-label="algoritmo">
              {(Object.keys(ALGORITMOS) as Algoritmo[]).map((a) => (
                <option key={a} value={a}>
                  {ALGORITMOS[a].nome}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-slate-400">
              de
              <select value={origem} onChange={(e) => trocar(() => setOrigem(e.target.value))} className={seletor}>
                {Object.keys(grafo.nos)
                  .filter((n) => !grafo.objetivos.includes(n))
                  .map((n) => (
                    <option key={n} value={n}>
                      {rotulo(grafo, n)}
                    </option>
                  ))}
              </select>
              até <span className="font-medium text-slate-200">{objetivos.join(' / ')}</span>
            </label>
            <span className="text-xs text-slate-500">{info.regra}</span>
          </div>

          <svg viewBox={grafo.viewBox} className="max-h-[70vh] w-full rounded-lg" style={{ background: C.fundo }} role="img" aria-label={`${grafo.nome} com o estado da busca`}>
            <defs>
              <marker id="seta" viewBox="0 0 10 10" refX="10" refY="5" markerWidth={6} markerHeight={6} orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" fill={C.fraco} />
              </marker>
            </defs>
            <rect x={vx} y={vy} width={vw} height={vh} fill="transparent" />
            {grafo.arestas.map(([a, b, custo]) => {
              const ativa = noCaminho(a, b)
              // encurta a seta para não entrar no círculo
              const dx = X(b) - X(a)
              const dy = Y(b) - Y(a)
              const d = Math.hypot(dx, dy) || 1
              const r = grafo.dirigido ? 9 * k : 0
              return (
                <g key={a + b}>
                  <line
                    x1={X(a)}
                    y1={Y(a)}
                    x2={X(b) - (dx / d) * r}
                    y2={Y(b) - (dy / d) * r}
                    stroke={ativa ? (q.solucao ? C.solucao : C.forte) : C.linha}
                    strokeWidth={(ativa ? 3.5 : 2) * k}
                    markerEnd={grafo.dirigido ? 'url(#seta)' : undefined}
                  />
                  <text x={(X(a) + X(b)) / 2 + 4 * k} y={(Y(a) + Y(b)) / 2 - 3 * k} fontSize={9 * k} fill={C.fraco} textAnchor="middle">
                    {custo}
                  </text>
                </g>
              )
            })}
            {Object.keys(grafo.nos).map((n) => {
              const atual = q.expandido?.no === n
              return (
                <g key={n}>
                  {atual && (
                    <motion.circle cx={X(n)} cy={Y(n)} fill="none" stroke={C.forte} strokeWidth={2 * k} initial={{ r: 4 * k, opacity: 0 }} animate={{ r: 12 * k, opacity: 1 }} transition={{ duration: 0.4 }} />
                  )}
                  <circle cx={X(n)} cy={Y(n)} r={6 * k} fill={cor(n)} stroke={C.borda} strokeWidth={1.5 * k} />
                  {grafo.objetivos.includes(n) && <circle cx={X(n)} cy={Y(n)} r={9 * k} fill="none" stroke={C.solucao} strokeWidth={1.2 * k} strokeDasharray={`${2 * k} ${2 * k}`} />}
                  <text x={X(n) + 9 * k} y={Y(n) - 6 * k} fontSize={11 * k} fill={cor(n) === C.neutro ? C.fraco : C.texto}>
                    {rotulo(grafo, n)}
                  </text>
                  {info.precisaH && (
                    <text x={X(n) + 9 * k} y={Y(n) + 8 * k} fontSize={9 * k} fill={C.h}>
                      h={String(grafo.h[n]).replace('.', ',')}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>

          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
            <span>
              <span className="text-slate-50">●</span> expandido agora
            </span>
            <span>
              <span className="text-cyan-400">●</span> fronteira
            </span>
            <span>
              <span className="text-violet-400">●</span> explorado
            </span>
            <span>
              <span className="text-emerald-400">●</span> solução
            </span>
            {info.precisaH && <span className="text-amber-300">{grafo.descricaoH}</span>}
          </div>
        </>
      }
      lateral={
        <>
          <Controles p={p} />
          <Mensagem chave={`${idGrafo}${alg}${origem}${p.i}`} sucesso={!!q.solucao}>
            {q.mensagem}
            {q.solucao && <div className="mt-1 text-xs text-emerald-300/80">{q.solucao.caminho.map((n) => rotulo(grafo, n)).join(' → ')}</div>}
          </Mensagem>

          <div>
            <Rotulo>Fronteira {alg === 'bfs' ? '(fila: sai o primeiro)' : alg === 'dfs' ? '(pilha: sai o primeiro)' : '(sai o menor)'}</Rotulo>
            <table className="w-full text-xs">
              <thead className="text-slate-500">
                <tr>
                  <th className="text-left font-normal">nó</th>
                  <th className="text-right font-normal">g</th>
                  {info.precisaH && <th className="text-right font-normal">h</th>}
                  {alg === 'astar' && <th className="text-right font-normal">f</th>}
                </tr>
              </thead>
              <tbody>
                {fronteiraOrdenada.map((n, i) => (
                  <tr key={n.no} className={i === 0 && !q.solucao ? 'text-cyan-300' : 'text-slate-300'}>
                    <td>{rotulo(grafo, n.no)}</td>
                    <td className="text-right tabular-nums">{n.g}</td>
                    {info.precisaH && <td className="text-right tabular-nums">{String(n.h).replace('.', ',')}</td>}
                    {alg === 'astar' && <td className="text-right tabular-nums">{String(n.f).replace('.', ',')}</td>}
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
            Explorados: <span className="text-slate-300">{q.explorados.map((n) => rotulo(grafo, n)).join(', ') || '—'}</span>
          </div>
          <p className="text-[11px] leading-snug text-slate-500">
            Busca em grafo (não repete nós explorados), vizinhos em ordem alfabética. Fonte: {grafo.fonte}.
            {grafo.dirigido && ' Arestas só de cima para baixo, como na figura.'}
          </p>
        </>
      }
    />
  )
}
