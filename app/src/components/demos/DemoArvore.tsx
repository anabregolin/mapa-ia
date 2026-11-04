import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { ARVORES, descrever, estadoApos, executar, fmtInf, inverterRaiz, posicoes, todosNos, type NoJogo } from '../../lib/arvore'
import { Controles, Mensagem, MolduraDemo, Rotulo } from './Passos'
import { C, seletor, usePassos } from './util'

const DX = 46
const DY = 78
const M = 30

export function DemoArvore({ arvoreInicial = 'l2-q22' }: { arvoreInicial?: string }) {
  const [idArvore, setIdArvore] = useState(arvoreInicial)
  const [poda, setPoda] = useState(true)
  const [invertida, setInvertida] = useState(false)
  const arvore = ARVORES.find((a) => a.id === idArvore)!
  const raiz = useMemo(() => (invertida ? inverterRaiz(arvore.raiz) : arvore.raiz), [arvore, invertida])
  const nos = useMemo(() => todosNos(raiz), [raiz])
  const layout = useMemo(() => posicoes(raiz), [raiz])
  const eventos = useMemo(() => executar(raiz, poda), [raiz, poda])
  const p = usePassos(eventos.length + 1, 700)
  const s = estadoApos(eventos, p.i)
  const ev = p.i > 0 ? eventos[p.i - 1] : null

  const porId = new Map(nos.map((n) => [n.id, n]))
  const nome = (id: string) => {
    const n = porId.get(id)!
    return n.tipo === 'FOLHA' ? `folha ${fmtInf(n.valor!)}` : n.nome!
  }
  const X = (id: string) => M + layout.pos[id].x * DX
  const Y = (id: string) => M + layout.pos[id].y * DY
  const largura = M * 2 + (layout.colunas - 1) * DX
  const altura = M * 2 + (layout.niveis - 1) * DY + 18

  const totalPodados = useMemo(() => new Set(eventos.flatMap((e) => (e.tipo === 'poda' ? e.podados : []))), [eventos])
  const folhasPodadas = nos.filter((n) => n.tipo === 'FOLHA' && totalPodados.has(n.id)).length
  const folhas = nos.filter((n) => n.tipo === 'FOLHA').length

  const trocar = (f: () => void) => {
    f()
    p.recomecar()
  }

  const corNo = (n: NoJogo) => {
    if (s.podados.has(n.id)) return C.poda
    if (s.atual === n.id) return C.forte
    if (s.abertos.has(n.id)) return C.fronteira
    if (n.id in s.valores) return C.explorado
    return C.neutro
  }

  const caminhoFinal = useMemo(() => {
    // jogada escolhida: segue o filho com o mesmo valor do pai
    const val: Record<string, number> = {}
    executar(raiz, false).forEach((e) => {
      if (e.tipo === 'retorna' || e.tipo === 'folha') val[e.id] = e.valor
    })
    const ids: string[] = []
    let n: NoJogo | undefined = raiz
    while (n?.filhos) {
      const alvo: number = val[n.id]
      const prox: NoJogo | undefined = n.filhos.find((c) => val[c.id] === alvo)
      if (!prox) break
      ids.push(n.id + '>' + prox.id)
      n = prox
    }
    return new Set(ids)
  }, [raiz])
  const fim = ev?.tipo === 'fim'

  return (
    <MolduraDemo
      principal={
        <>
          <div className="mb-2 flex flex-wrap items-center gap-3 text-sm">
            <select value={idArvore} onChange={(e) => trocar(() => setIdArvore(e.target.value))} className={seletor} aria-label="árvore">
              {ARVORES.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-slate-300">
              <input type="checkbox" checked={poda} onChange={(e) => trocar(() => setPoda(e.target.checked))} /> poda alfa-beta
            </label>
            <label className="flex items-center gap-1.5 text-slate-300" title="Inverte só a ordem dos filhos da raiz, como no gabarito da Q22">
              <input type="checkbox" checked={invertida} onChange={(e) => trocar(() => setInvertida(e.target.checked))} /> raiz da direita para a esquerda
            </label>
          </div>

          <svg viewBox={`0 0 ${largura} ${altura}`} className="max-h-[68vh] w-full rounded-lg" style={{ background: C.fundo }} role="img" aria-label={`Árvore de jogo ${arvore.nome}`}>
            {nos.flatMap((n) =>
              (n.filhos ?? []).map((c) => {
                const escolhida = fim && caminhoFinal.has(n.id + '>' + c.id)
                const podada = s.podados.has(c.id)
                return (
                  <line
                    key={n.id + c.id}
                    x1={X(n.id)}
                    y1={Y(n.id)}
                    x2={X(c.id)}
                    y2={Y(c.id)}
                    stroke={escolhida ? C.solucao : podada ? C.poda : C.linha}
                    strokeWidth={escolhida ? 3.5 : 1.8}
                    strokeDasharray={podada ? '4 4' : undefined}
                    opacity={podada ? 0.6 : 1}
                  />
                )
              }),
            )}
            {nos.map((n) => {
              const x = X(n.id)
              const y = Y(n.id)
              const cor = corNo(n)
              const valor = s.valores[n.id]
              const parcial = s.parciais[n.id]
              const atual = s.atual === n.id && !fim
              const ab = s.ab[n.id]
              return (
                <g key={n.id}>
                  {atual && <motion.circle cx={x} cy={y} fill="none" stroke={C.forte} strokeWidth={2} initial={{ r: 10, opacity: 0 }} animate={{ r: 22, opacity: 1 }} transition={{ duration: 0.35 }} />}
                  {n.tipo === 'MAX' && <rect x={x - 15} y={y - 15} width={30} height={30} rx={4} fill={C.fundo} stroke={cor} strokeWidth={2.2} />}
                  {n.tipo === 'MIN' && <circle cx={x} cy={y} r={16} fill={C.fundo} stroke={cor} strokeWidth={2.2} />}
                  {n.tipo === 'FOLHA' && <rect x={x - 13} y={y - 11} width={26} height={22} rx={3} fill={s.podados.has(n.id) ? 'transparent' : C.linha} stroke={cor} strokeWidth={1.5} />}
                  <text x={x} y={y + 4.5} textAnchor="middle" fontSize={13} fontWeight={600} fill={n.tipo === 'FOLHA' ? C.texto : valor !== undefined ? C.forte : C.fraco}>
                    {n.tipo === 'FOLHA' ? fmtInf(n.valor!) : valor !== undefined ? fmtInf(valor) : parcial !== undefined ? `${n.tipo === 'MAX' ? '≥' : '≤'}${fmtInf(parcial)}` : ''}
                  </text>
                  {n.tipo === 'FOLHA' && s.podados.has(n.id) && (
                    <text x={x} y={y + 30} textAnchor="middle" fontSize={16} fontWeight={700} fill={C.poda}>
                      ✕
                    </text>
                  )}
                  {n.nome && (
                    <text x={x + (n.tipo === 'MAX' ? 19 : 20)} y={y - 12} fontSize={10.5} fill={C.fraco}>
                      {n.nome}
                    </text>
                  )}
                  {poda && ab && s.abertos.has(n.id) && (
                    <text x={x} y={y + 29} textAnchor="middle" fontSize={9} fill={C.h}>
                      α {fmtInf(ab[0])} · β {fmtInf(ab[1])}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>

          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
            <span>□ MAX</span>
            <span>○ MIN</span>
            <span>
              <span className="text-cyan-400">●</span> aberto (ainda calculando)
            </span>
            <span>
              <span className="text-violet-400">●</span> valor definido
            </span>
            <span>
              <span className="text-red-400">✕</span> podado
            </span>
            <span>
              <span className="text-emerald-400">━</span> jogada escolhida
            </span>
          </div>
        </>
      }
      lateral={
        <>
          <Controles p={p} />
          <Mensagem chave={`${idArvore}${poda}${invertida}${p.i}`} sucesso={fim}>
            {ev ? descrever(ev, nome) : `Busca em profundidade, filhos da esquerda para a direita${invertida ? ' (raiz invertida)' : ''}. MAX quer o maior valor, MIN o menor.`}
          </Mensagem>
          {poda && (
            <div className="rounded-lg bg-tinta/5 px-3 py-2 text-xs text-slate-300">
              <Rotulo>Resultado da poda</Rotulo>
              {folhasPodadas} de {folhas} folhas não precisam ser olhadas.
              <div className="mt-1 text-slate-400">
                Galhos podados:{' '}
                {eventos
                  .flatMap((e) => (e.tipo === 'poda' ? [e.diretos.map((id) => porId.get(id)!.nome ?? `folha ${fmtInf(porId.get(id)!.valor!)}`).join(', ')] : []))
                  .join(' | ') || 'nenhum'}
              </div>
            </div>
          )}
          <p className="text-[11px] leading-snug text-slate-500">
            α = melhor valor garantido para MAX no caminho até a raiz; β = melhor para MIN. Quando β ≤ α, o resto dos filhos não muda a escolha. Fonte: {arvore.fonte}.
          </p>
        </>
      }
    />
  )
}
