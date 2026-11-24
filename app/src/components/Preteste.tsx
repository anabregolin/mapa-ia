import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { pretestePara } from '../content/preteste'
import { useMapa } from '../store/useMapa'
import { Tex } from './FormulaAnimada'

/** Antes de ler um tópico novo: chute 1 ou 2 respostas. Errar faz parte. */
export function Preteste({ id, terminar }: { id: string; terminar: () => void }) {
  const perguntas = useMemo(() => pretestePara(id), [id])
  const registrar = useMapa((s) => s.registrarPreteste)
  const [atual, setAtual] = useState(0)
  const [escolhas, setEscolhas] = useState<number[]>([])

  if (!perguntas.length) return null
  const p = perguntas[atual]
  const escolha = escolhas[atual]
  const respondeu = escolha !== undefined
  const ultima = atual === perguntas.length - 1

  const seguir = () => {
    if (!ultima) return setAtual(atual + 1)
    registrar(id, escolhas.filter((e, i) => e === perguntas[i].certa).length, perguntas.length)
    terminar()
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-10 rounded-3xl border-2 border-dashed border-[var(--linha)] bg-[var(--cartao)] px-5 py-6 sm:px-8"
      aria-label="pré-teste"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--tinta-suave)]">
          antes de ler · chute {atual + 1} de {perguntas.length}
        </div>
        <button className="text-xs text-[var(--tinta-suave)] hover:underline" onClick={terminar}>
          pular
        </button>
      </div>
      {atual === 0 && !respondeu && (
        <p className="mt-2 text-sm text-[var(--tinta-suave)]">Você ainda não leu isto, então errar é normal. Tentar adivinhar antes ajuda a prestar atenção na resposta quando ela aparecer.</p>
      )}

      <p className="fonte-leitura mt-4 font-medium text-[var(--tinta-forte)]">{p.enunciado}</p>
      <div className="mt-3 space-y-2">
        {p.opcoes.map((o, i) => {
          const certa = i === p.certa
          const estilo = !respondeu
            ? 'border-[var(--linha)] hover:border-[var(--foco)] hover:bg-[var(--foco-claro)]'
            : certa
              ? 'border-[var(--menta)] bg-[var(--menta-claro)]'
              : i === escolha
                ? 'border-[var(--alerta)] bg-[var(--alerta-claro)]'
                : 'border-[var(--linha)] opacity-60'
          return (
            <button
              key={i}
              disabled={respondeu}
              onClick={() => setEscolhas((e) => Object.assign([...e], { [atual]: i }))}
              className={`block w-full overflow-x-auto rounded-2xl border-2 px-4 py-3 text-left text-[0.95em] leading-relaxed text-[var(--tinta)] transition-colors ${estilo}`}
            >
              {p.tipo === 'tex' ? <Tex latex={o} /> : o}
              {respondeu && certa && <span className="ml-2 font-semibold text-[var(--menta)]">← esta</span>}
            </button>
          )
        })}
      </div>

      {respondeu && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
          <p className="text-sm text-[var(--tinta)]">
            {escolha === p.certa ? 'Acertou no chute! ' : 'Tudo bem, ainda não era para saber. '}
            {p.depois}
          </p>
          <button className="botao-foco mt-3" onClick={seguir}>
            {ultima ? 'Agora sim, ler o tópico ↓' : 'Próximo chute →'}
          </button>
        </motion.div>
      )}
    </motion.section>
  )
}
