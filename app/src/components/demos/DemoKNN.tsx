import { useRef, useState, type PointerEvent } from 'react'
import { knn, NOVO_Q3, PONTOS_Q3, type Metrica } from '../../lib/knn'
import { MolduraDemo, Rotulo } from './Passos'
import { C, seletor } from './util'

const ESC = 40 // pixels por unidade
const M = 34
const X = (x: number) => M + x * ESC
const Y = (y: number) => M + (10 - y) * ESC
const COR = { 1: '#60a5fa', 2: '#f87171' }
const NOME = { 1: 'classe 1 (azul)', 2: 'classe 2 (vermelha)' }
const inteiro = (x: number) => Math.abs(x - Math.round(x)) < 1e-9
const fmt = (d: number) => (inteiro(d) ? String(Math.round(d)) : inteiro(d * d) ? `√${Math.round(d * d)} ≈ ${d.toFixed(2).replace('.', ',')}` : d.toFixed(2).replace('.', ','))

export function DemoKNN() {
  const [novo, setNovo] = useState(NOVO_Q3)
  const [k, setK] = useState(3)
  const [metrica, setMetrica] = useState<Metrica>('euclidiana')
  const [arrastando, setArrastando] = useState(false)
  const svg = useRef<SVGSVGElement>(null)
  const r = knn(PONTOS_Q3, novo, k, metrica)

  const mover = (e: PointerEvent) => {
    const el = svg.current
    if (!el) return
    const pt = el.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const p = pt.matrixTransform(el.getScreenCTM()!.inverse())
    // encaixa em meia unidade para as distâncias ficarem legíveis
    const x = Math.min(10, Math.max(0, Math.round(((p.x - M) / ESC) * 2) / 2))
    const y = Math.min(10, Math.max(0, Math.round((10 - (p.y - M) / ESC) * 2) / 2))
    setNovo({ x, y })
  }
  const vizinhos = new Set(r.vizinhos.map((v) => `${v.x},${v.y}`))

  return (
    <MolduraDemo
      principal={
        <>
          <div className="mb-2 flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2 text-slate-300">
              k
              <input type="range" min={1} max={9} value={k} onChange={(e) => setK(Number(e.target.value))} />
              <span className="w-4 tabular-nums">{k}</span>
            </label>
            <select value={metrica} onChange={(e) => setMetrica(e.target.value as Metrica)} className={seletor} aria-label="distância">
              <option value="euclidiana">euclidiana</option>
              <option value="manhattan">Manhattan</option>
            </select>
            <button className="rounded-md bg-tinta/10 px-2 py-1 text-xs" onClick={() => setNovo(NOVO_Q3)}>
              voltar para (5, 2)
            </button>
            <span className="text-xs text-slate-500">clique ou arraste para mover o ponto novo</span>
          </div>
          <svg
            ref={svg}
            viewBox={`0 0 ${M * 2 + 10 * ESC} ${M * 2 + 10 * ESC}`}
            className="max-h-[66vh] w-full touch-none select-none rounded-lg"
            style={{ background: C.fundo }}
            onPointerDown={(e) => {
              setArrastando(true)
              mover(e)
            }}
            onPointerMove={(e) => arrastando && mover(e)}
            onPointerUp={() => setArrastando(false)}
            onPointerLeave={() => setArrastando(false)}
            role="img"
            aria-label="Gráfico da questão 3 com o ponto novo e seus vizinhos"
          >
            {Array.from({ length: 11 }, (_, i) => (
              <g key={i}>
                <line x1={X(i)} y1={Y(0)} x2={X(i)} y2={Y(10)} stroke={C.linha} strokeWidth={i === 0 ? 1.5 : 0.6} />
                <line x1={X(0)} y1={Y(i)} x2={X(10)} y2={Y(i)} stroke={C.linha} strokeWidth={i === 0 ? 1.5 : 0.6} />
                <text x={X(i)} y={Y(0) + 16} fontSize={10} fill={C.fraco} textAnchor="middle">
                  {i}
                </text>
                <text x={X(0) - 10} y={Y(i) + 3.5} fontSize={10} fill={C.fraco} textAnchor="middle">
                  {i}
                </text>
              </g>
            ))}
            {/* região dos k vizinhos: círculo (euclidiana) ou losango (Manhattan) */}
            {metrica === 'euclidiana' ? (
              <circle cx={X(novo.x)} cy={Y(novo.y)} r={r.raio * ESC} fill="#facc1510" stroke="#facc15" strokeDasharray="5 4" />
            ) : (
              <polygon
                points={[
                  [novo.x + r.raio, novo.y],
                  [novo.x, novo.y + r.raio],
                  [novo.x - r.raio, novo.y],
                  [novo.x, novo.y - r.raio],
                ]
                  .map(([x, y]) => `${X(x)},${Y(y)}`)
                  .join(' ')}
                fill="#facc1510"
                stroke="#facc15"
                strokeDasharray="5 4"
              />
            )}
            {r.vizinhos.map((v) => (
              <line key={`l${v.x},${v.y}`} x1={X(novo.x)} y1={Y(novo.y)} x2={X(v.x)} y2={Y(v.y)} stroke={COR[v.classe]} strokeWidth={1.2} opacity={0.7} />
            ))}
            {PONTOS_Q3.map((p) => {
              const viz = vizinhos.has(`${p.x},${p.y}`)
              return (
                <g key={`${p.x},${p.y}`}>
                  {viz && <circle cx={X(p.x)} cy={Y(p.y)} r={11} fill="none" stroke={COR[p.classe]} strokeWidth={2} />}
                  <circle cx={X(p.x)} cy={Y(p.y)} r={6.5} fill={COR[p.classe]} opacity={viz ? 1 : 0.55} />
                </g>
              )
            })}
            <g>
              <rect x={X(novo.x) - 7} y={Y(novo.y) - 7} width={14} height={14} transform={`rotate(45 ${X(novo.x)} ${Y(novo.y)})`} fill={r.classe ? COR[r.classe] : C.forte} stroke={C.forte} strokeWidth={2} />
              <text x={X(novo.x) + 12} y={Y(novo.y) - 10} fontSize={11} fill={C.texto}>
                ({String(novo.x).replace('.', ',')}; {String(novo.y).replace('.', ',')})
              </text>
            </g>
          </svg>
        </>
      }
      lateral={
        <>
          <div className={`rounded-lg px-3 py-2 text-sm ${r.classe ? 'bg-tinta/5' : 'bg-amber-400/10 text-amber-100'}`}>
            {r.classe ? (
              <>
                Com k = {k} ({metrica}): <b style={{ color: COR[r.classe] }}>{NOME[r.classe]}</b>
              </>
            ) : (
              <>Empate nos votos com k = {k}. Por isso se usa k ímpar com duas classes.</>
            )}
            <div className="mt-1 text-xs text-slate-400">
              votos: {r.votos[1]} azul × {r.votos[2]} vermelho
            </div>
            {r.empateDistancia && <div className="mt-1 text-xs text-amber-300">Atenção: o {k}º e o {k + 1}º vizinhos estão à mesma distância; a escolha entre eles pode mudar o resultado.</div>}
          </div>
          <div>
            <Rotulo>Mais próximos</Rotulo>
            <table className="w-full text-xs">
              <tbody>
                {r.ordenados.slice(0, Math.max(k + 3, 6)).map((p, i) => (
                  <tr key={`${p.x},${p.y}`} className={i < k ? 'text-slate-100' : 'text-slate-500'}>
                    <td className="tabular-nums">{i + 1}.</td>
                    <td>
                      <span style={{ color: COR[p.classe] }}>●</span> ({p.x}, {p.y})
                    </td>
                    <td className="text-right tabular-nums">{fmt(p.d)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] leading-snug text-slate-500">
            Q3 da lista 5: com o ponto em (5, 2), k = 1 dá vermelho (o vizinho (6, 2) está a 1) e k = 3 dá azul ((4, 1) e (6, 3) estão a √2). Troque para Manhattan e veja que k = 3 continua azul.
          </p>
        </>
      }
    />
  )
}
