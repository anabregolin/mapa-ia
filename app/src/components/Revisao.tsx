import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { CARTOES, ULTIMA_CAIXA, type Cartao, type Nota, type TipoCartao } from '../content/cartoes'
import { topicoPorId, UNIDADES, unidadePorId } from '../content/topicos'
import type { UnidadeId } from '../content/tipos'
import { useMapa } from '../store/useMapa'
import { Tex } from './FormulaAnimada'
import { Texto } from './Texto'

const TIPOS: { id: TipoCartao | 'todos'; nome: string }[] = [
  { id: 'todos', nome: 'tudo' },
  { id: 'conceito', nome: 'conceitos' },
  { id: 'formula', nome: 'fórmulas' },
  { id: 'cuidado', nome: 'pegadinhas' },
]

const NOTAS: { nota: Nota; rotulo: string; tecla: string; classe: string }[] = [
  { nota: 'errei', rotulo: 'errei', tecla: '1', classe: 'bg-red-400/15 text-red-300 hover:bg-red-400/25' },
  { nota: 'dificil', rotulo: 'difícil', tecla: '2', classe: 'bg-amber-400/15 text-amber-200 hover:bg-amber-400/25' },
  { nota: 'acertei', rotulo: 'acertei', tecla: '3', classe: 'bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25' },
]

export function Revisao() {
  const aberta = useMapa((s) => s.revisaoAberta)
  const fechar = useMapa((s) => s.setRevisaoAberta)
  return <AnimatePresence>{aberta && <Sessao fechar={() => fechar(false)} />}</AnimatePresence>
}

function Sessao({ fechar }: { fechar: () => void }) {
  const { cartoes, responderCartao, selecionar, zerarCartoes } = useMapa()
  const [unidade, setUnidade] = useState<UnidadeId | 'todas'>('todas')
  const [tipo, setTipo] = useState<TipoCartao | 'todos'>('todos')
  const [inicio, setInicio] = useState(() => Date.now())
  // progresso no começo da sessão: responder não reordena a fila no meio
  const [retrato, setRetrato] = useState(cartoes)
  const [fila, setFila] = useState<string[] | null>(null)
  const [virado, setVirado] = useState(false)
  const [feitos, setFeitos] = useState(0)

  const filtrados = useMemo(
    () => CARTOES.filter((c) => (unidade === 'todas' || c.unidade === unidade) && (tipo === 'todos' || c.tipo === tipo)),
    [unidade, tipo],
  )
  // a fila é montada na hora em que a sessão começa e só muda com as respostas
  const pendentes = useMemo(() => {
    const vencidos = filtrados.filter((c) => retrato[c.id] && retrato[c.id].volta <= inicio).sort((a, b) => retrato[a.id].volta - retrato[b.id].volta)
    const novos = filtrados.filter((c) => !retrato[c.id]).sort((a, b) => a.etapa - b.etapa)
    return [...vencidos, ...novos].map((c) => c.id)
  }, [filtrados, inicio, retrato])
  const filaAtual = fila ?? pendentes
  const cartao: Cartao | undefined = CARTOES.find((c) => c.id === filaAtual[0])

  const porCaixa = Array.from({ length: ULTIMA_CAIXA + 1 }, (_, i) => filtrados.filter((c) => cartoes[c.id]?.caixa === i).length)
  const novos = filtrados.filter((c) => !cartoes[c.id]).length

  const recomecar = () => {
    setFila(null)
    setFeitos(0)
    setVirado(false)
    setInicio(Date.now())
    setRetrato(useMapa.getState().cartoes)
  }
  const filtrar = (f: () => void) => {
    f()
    setFila(null)
    setVirado(false)
  }

  const responder = (nota: Nota) => {
    if (!cartao) return
    responderCartao(cartao.id, nota, Date.now())
    const resto = filaAtual.slice(1)
    // quem errou volta no fim desta sessão
    setFila(nota === 'acertei' ? resto : [...resto, cartao.id])
    setFeitos((n) => n + 1)
    setVirado(false)
  }

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, select, textarea')) return
      if (e.key === 'Escape') fechar()
      else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setVirado((v) => !v)
      } else if (virado) {
        const n = NOTAS.find((x) => x.tecla === e.key)
        if (n) responder(n.nota)
      }
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  })

  const tp = cartao && topicoPorId.get(cartao.topico)
  const cor = cartao ? unidadePorId.get(cartao.unidade)!.cor : '#a78bfa'

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col items-center overflow-auto bg-slate-950/95 p-4 text-slate-200 backdrop-blur">
      <div className="flex w-full max-w-2xl items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-50">Revisão</h2>
        <button className="rounded-md px-3 py-1 hover:bg-tinta/10" onClick={fechar}>
          fechar ✕
        </button>
      </div>

      <div className="mt-3 flex w-full max-w-2xl flex-wrap items-center gap-2 text-xs">
        <select value={unidade} onChange={(e) => filtrar(() => setUnidade(e.target.value as UnidadeId | 'todas'))} className="rounded-md bg-slate-800 px-2 py-1" aria-label="unidade">
          <option value="todas">todas as unidades</option>
          {UNIDADES.map((u) => (
            <option key={u.id} value={u.id}>
              {u.id.toUpperCase()} · {u.titulo}
            </option>
          ))}
        </select>
        <div className="flex rounded-md bg-slate-900 p-0.5">
          {TIPOS.map((t) => (
            <button key={t.id} onClick={() => filtrar(() => setTipo(t.id))} className={`rounded px-2 py-0.5 ${tipo === t.id ? 'bg-tinta/15 text-slate-50' : 'text-slate-400'}`}>
              {t.nome}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 flex w-full max-w-2xl flex-wrap items-center gap-x-3 gap-y-0.5 whitespace-nowrap text-[11px] text-slate-500">
        <span>{filtrados.length} cartões</span>
        <span>· {novos} novos</span>
        {porCaixa.map((n, i) => (
          <span key={i} title={`caixa ${i + 1}`}>
            · caixa {i + 1}: {n}
          </span>
        ))}
        <button
          className="ml-auto text-slate-500 hover:text-red-300"
          onClick={() => {
            if (confirm('Apagar todo o progresso dos cartões?')) {
              zerarCartoes()
              recomecar()
            }
          }}
        >
          zerar
        </button>
      </div>

      <div className="mt-4 w-full max-w-2xl">
        <div className="mb-2 h-1 overflow-hidden rounded-full bg-slate-800">
          <motion.div className="h-full bg-violet-500" animate={{ width: `${(feitos / Math.max(1, feitos + filaAtual.length)) * 100}%` }} />
        </div>

        {cartao && tp ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={cartao.id + feitos}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border bg-slate-900 p-6"
              style={{ borderColor: `${cor}55` }}
            >
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.15em]">
                <span style={{ color: cor }}>
                  {cartao.unidade.toUpperCase()} · {cartao.tipo === 'formula' ? 'fórmula' : cartao.tipo === 'cuidado' ? 'pegadinha' : 'conceito'}
                </span>
                <span className="text-slate-500">{cartoes[cartao.id] ? `caixa ${cartoes[cartao.id].caixa + 1}` : 'novo'}</span>
              </div>
              <p className="mt-3 text-xl font-medium text-slate-50">{cartao.pergunta}</p>

              {virado ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-3 border-t border-tinta/10 pt-4 text-[15px] leading-relaxed text-slate-200">
                  {cartao.latex && (
                    <div className="overflow-x-auto text-lg">
                      <Tex latex={cartao.latex} display />
                    </div>
                  )}
                  {cartao.variaveis && (
                    <ul className="space-y-0.5 text-sm text-slate-400">
                      {cartao.variaveis.map((v) => (
                        <li key={v.simbolo}>
                          <Tex latex={v.simbolo} /> — {v.descricao}
                        </li>
                      ))}
                    </ul>
                  )}
                  {cartao.resposta.split('\n\n').map((par, i) => (
                    <p key={i} className={i > 0 ? 'text-slate-400' : ''}>
                      <Texto>{par}</Texto>
                    </p>
                  ))}
                  <button
                    className="text-xs text-violet-300 hover:underline"
                    onClick={() => {
                      selecionar(cartao.topico)
                      fechar()
                    }}
                  >
                    abrir “{tp.titulo}” no mapa →
                  </button>
                </motion.div>
              ) : (
                <button className="mt-6 w-full rounded-lg bg-tinta/5 py-3 text-sm text-slate-300 hover:bg-tinta/10" onClick={() => setVirado(true)}>
                  mostrar resposta <span className="text-slate-500">(espaço)</span>
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="rounded-2xl border border-tinta/10 bg-slate-900 p-8 text-center">
            <p className="text-lg text-slate-50">{feitos ? 'Sessão concluída.' : 'Nada para revisar agora.'}</p>
            <p className="mt-1 text-sm text-slate-400">
              {feitos ? `${feitos} respostas.` : ''} Os cartões que você acertou voltam em 1, 3, 7 e 15 dias.
            </p>
            <button className="mt-4 rounded-md bg-violet-500/80 px-3 py-1.5 text-sm text-white" onClick={recomecar}>
              conferir de novo
            </button>
          </div>
        )}

        {cartao && virado && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {NOTAS.map((n) => (
              <button key={n.nota} onClick={() => responder(n.nota)} className={`rounded-lg py-2 text-sm font-medium ${n.classe}`}>
                {n.rotulo} <span className="opacity-50">({n.tecla})</span>
              </button>
            ))}
          </div>
        )}
        <p className="mt-3 text-center text-[11px] text-slate-500">
          {filaAtual.length} na fila · errei volta no fim da sessão · acertei sobe uma caixa
        </p>
      </div>
    </motion.div>
  )
}
