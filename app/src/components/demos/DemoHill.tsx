import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { ARESTAS_HC, hHC, NOS_HC, OBJETIVO_HC, subir } from '../../lib/hill'
import { Controles, Mensagem, MolduraDemo, Rotulo } from './Passos'
import { C, usePassos } from './util'

const fmt = (x: number) => String(x).replace('.', ',')

export function DemoHill() {
  const [inicio, setInicio] = useState('n18')
  const [tentativas, setTentativas] = useState<{ inicio: string; fim: string; ok: boolean }[]>([])
  const passos = useMemo(() => subir(inicio), [inicio])
  const p = usePassos(passos.length, 1000)
  const q = passos[p.i]
  const X = (n: string) => NOS_HC[n][0]
  const Y = (n: string) => NOS_HC[n][1]

  const comecar = (n: string) => {
    if (n === OBJETIVO_HC) return
    const ult = passos.at(-1)!
    // guarda a tentativa anterior se ela chegou ao fim
    if (p.ultimo) setTentativas((t) => [...t, { inicio, fim: ult.atual, ok: ult.fim === 'objetivo' }])
    setInicio(n)
    p.recomecar()
  }
  const aleatorio = () => {
    const usados = new Set([inicio, ...tentativas.map((t) => t.inicio)])
    const livres = Object.keys(NOS_HC).filter((n) => n !== OBJETIVO_HC && !usados.has(n))
    const opcoes = livres.length ? livres : Object.keys(NOS_HC).filter((n) => n !== OBJETIVO_HC)
    comecar(opcoes[Math.floor(Math.random() * opcoes.length)])
  }

  const noCaminho = (a: string, b: string) => {
    const i = q.caminho.indexOf(a)
    return i >= 0 && (q.caminho[i + 1] === b || q.caminho[i - 1] === b)
  }
  const avaliados = new Set(q.vizinhos.map((v) => v.no))
  const cor = (n: string) => {
    if (n === q.atual) return q.fim === 'preso' ? C.poda : q.fim === 'objetivo' ? C.solucao : C.forte
    if (n === q.melhor) return C.solucao
    if (avaliados.has(n)) return C.fronteira
    if (q.caminho.includes(n)) return C.explorado
    return C.neutro
  }

  return (
    <MolduraDemo
      principal={
        <>
          <div className="mb-2 text-sm text-slate-400">
            Clique em um nó para começar dali. Objetivo: <span className="text-amber-300">★ n0</span>. h = distância em linha reta até n0, medida na figura.
          </div>
          <svg viewBox="225 305 485 345" className="max-h-[66vh] w-full rounded-lg" style={{ background: C.fundo }} role="img" aria-label="Rede da questão 11 com o Hill Climbing">
            {ARESTAS_HC.map(([a, b, peso]) => (
              <g key={a + b}>
                <line x1={X(a)} y1={Y(a)} x2={X(b)} y2={Y(b)} stroke={noCaminho(a, b) ? C.explorado : C.linha} strokeWidth={noCaminho(a, b) ? 3.5 : 2} />
                {peso && (
                  <text x={(X(a) + X(b)) / 2 + (X(a) === X(b) ? -10 : 0)} y={(Y(a) + Y(b)) / 2 + (X(a) === X(b) ? 4 : -5)} fontSize={10} fill={C.fraco} textAnchor="middle">
                    {peso}
                  </text>
                )}
              </g>
            ))}
            {Object.keys(NOS_HC).map((n) => {
              const objetivo = n === OBJETIVO_HC
              return (
                <g key={n} onClick={() => comecar(n)} className={objetivo ? '' : 'cursor-pointer'}>
                  {n === q.atual && <motion.circle cx={X(n)} cy={Y(n)} fill="none" stroke={cor(n)} strokeWidth={2} initial={{ r: 10, opacity: 0 }} animate={{ r: 22, opacity: 1 }} transition={{ duration: 0.35 }} />}
                  <circle cx={X(n)} cy={Y(n)} r={15} fill={objetivo ? '#facc15' : C.fundo} stroke={objetivo ? '#facc15' : cor(n)} strokeWidth={2.2} />
                  <text x={X(n)} y={Y(n) + 4} textAnchor="middle" fontSize={objetivo ? 15 : 10.5} fontWeight={600} fill={objetivo ? '#0b1020' : C.texto}>
                    {objetivo ? '★' : n}
                  </text>
                  {!objetivo && (
                    <text x={X(n) + 17} y={Y(n) - 12} fontSize={9} fill={C.h}>
                      {fmt(hHC(n))}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
            <span>
              <span className="text-slate-50">●</span> atual
            </span>
            <span>
              <span className="text-cyan-400">●</span> vizinhos avaliados
            </span>
            <span>
              <span className="text-emerald-400">●</span> melhor vizinho
            </span>
            <span>
              <span className="text-red-400">●</span> preso (mínimo local)
            </span>
            <span className="text-amber-300">número pequeno = h</span>
          </div>
        </>
      }
      lateral={
        <>
          <Controles p={p} />
          <Mensagem chave={`${inicio}${p.i}`} sucesso={q.fim === 'objetivo'}>
            {q.fim === 'objetivo' ? (
              <>Chegou em n0: {q.caminho.join(' → ')}.</>
            ) : q.fim === 'preso' ? (
              <>
                Em {q.atual} (h = {fmt(hHC(q.atual))}) nenhum vizinho é melhor: <b>mínimo local</b>. Caminho: {q.caminho.join(' → ')}. Use o reinício aleatório.
              </>
            ) : (
              <>
                Em {q.atual} (h = {fmt(hHC(q.atual))}): o melhor vizinho é {q.melhor} (h = {fmt(hHC(q.melhor!))}). Move para lá.
              </>
            )}
          </Mensagem>
          {q.vizinhos.length > 0 && (
            <div>
              <Rotulo>Vizinhos de {q.atual}</Rotulo>
              <table className="w-full text-xs">
                <tbody>
                  {[...q.vizinhos]
                    .sort((a, b) => a.h - b.h)
                    .map((v) => (
                      <tr key={v.no} className={v.no === q.melhor ? 'text-emerald-300' : 'text-slate-300'}>
                        <td>{v.no}</td>
                        <td className="text-right tabular-nums">{fmt(v.h)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
          <button className="rounded-md bg-amber-400/20 px-3 py-1.5 text-sm text-amber-200 hover:bg-amber-400/30" onClick={aleatorio}>
            reinício aleatório
          </button>
          {tentativas.length > 0 && (
            <div className="text-xs text-slate-400">
              <Rotulo>Tentativas anteriores</Rotulo>
              {tentativas.map((t, i) => (
                <div key={i}>
                  {t.inicio} → … → {t.fim} {t.ok ? '✓' : '(preso)'}
                </div>
              ))}
            </div>
          )}
          <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-[11px] leading-snug text-amber-100/80">
            Gabarito: n18→n13→n8→n3 (preso) e n19→n14→n9→n4→n3 (preso) batem com a figura. Já o exemplo n6→n1→n0 não bate: na figura n7 está mais perto de n0 do que n1, então o Hill Climbing vai de n6 para n7. Só começando em n1 ou n5 se chega a n0.
          </p>
        </>
      }
    />
  )
}
