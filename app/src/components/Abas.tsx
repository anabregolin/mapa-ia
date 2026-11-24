// Abas da trilha (Geral, P1, P2, E1…): barra, edição e o atalho dentro do tópico.
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useSurgir } from '../lib/movimento'
import { GERAL, type Aba } from '../lib/abas'
import { MODULOS, unidade } from '../lib/trilha'
import { useMapa } from '../store/useMapa'

/**
 * Escolher a prova ou recorte da trilha (Geral, P1, P2, E1… e as suas): um botão pequeno que abre a lista para cima,
 * porque mora no rodapé fixo. Criar e editar aba ficam no fim da lista.
 */
/** abaixo: no cabeçalho a lista abre para baixo; no rodapé, para cima */
export function SeletorAba({ editar, abaixo = false }: { editar: (id: string) => void; abaixo?: boolean }) {
  const abas = useMapa((s) => s.abas)
  const atual = useMapa((s) => s.abaAtual)
  const setAtual = useMapa((s) => s.setAbaAtual)
  const criar = useMapa((s) => s.criarAba)
  const estudados = useMapa((s) => s.estudados)
  const [aberto, setAberto] = useState(false)
  const surgir = useSurgir(abaixo ? 'cima' : 'baixo')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return
    const fora = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setAberto(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false)
    document.addEventListener('pointerdown', fora)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', fora)
      document.removeEventListener('keydown', esc)
    }
  }, [aberto])

  const daAba = abas.find((a) => a.id === atual)
  const contagem = (a: Aba) => `${a.topicos.filter((t) => estudados[t]).length}/${a.topicos.length}`
  const escolher = (id: string) => {
    setAtual(id)
    setAberto(false)
  }
  const item = (id: string, nome: string, descricao: string, conta?: string) => (
    <button
      key={id}
      role="option"
      aria-selected={atual === id}
      onClick={() => escolher(id)}
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm ${
        atual === id ? 'bg-[var(--foco)] text-white' : 'text-[var(--tinta)] hover:bg-[var(--papel-2)]'
      }`}
    >
      <span className="shrink-0 font-medium">{nome}</span>
      <span className={`min-w-0 flex-1 truncate text-xs ${atual === id ? 'text-white/75' : 'text-[var(--tinta-suave)]'}`}>{descricao}</span>
      {conta && <span className={`shrink-0 text-xs tabular-nums ${atual === id ? 'text-white/75' : 'text-[var(--tinta-suave)]'}`}>{conta}</span>}
    </button>
  )

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        className="botao-suave flex items-center gap-1.5"
        onClick={() => setAberto(!aberto)}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        title="escolher a prova ou recorte da trilha"
      >
        <span className="max-w-[6rem] truncate font-medium text-[var(--tinta-forte)] sm:max-w-[10rem]">{daAba ? daAba.nome : 'Geral'}</span>
        {daAba && daAba.topicos.length > 0 && <span className="text-xs tabular-nums text-[var(--tinta-suave)]">{contagem(daAba)}</span>}
        <span className="text-xs text-[var(--tinta-suave)]" aria-hidden>
          {aberto === abaixo ? '▴' : '▾'}
        </span>
      </button>
      <AnimatePresence>
        {aberto && (
          <motion.div
            {...surgir}
            style={{ transformOrigin: abaixo ? 'top left' : 'bottom left' }}
            className={`absolute left-0 z-30 w-72 ${abaixo ? 'top-full mt-2' : 'bottom-full mb-2'} max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--linha)] bg-[var(--cartao)] p-1.5 shadow-[var(--sombra)]`}
          >
            <div className="px-2.5 pb-1 pt-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--tinta-suave)]">provas e recortes</div>
            <div role="listbox" aria-label="provas e recortes da trilha" className="max-h-[50vh] overflow-y-auto">
              {item(GERAL, 'Geral', 'a trilha inteira')}
              {abas.map((a) => item(a.id, a.nome, a.descricao, a.topicos.length ? contagem(a) : undefined))}
            </div>
            <div className="mt-1 flex items-center gap-1 border-t border-[var(--linha)] pt-1.5 text-sm">
              {daAba && (
                <button
                  className="rounded-lg px-2.5 py-1 text-[var(--foco)] hover:bg-[var(--papel-2)]"
                  onClick={() => {
                    editar(daAba.id)
                    setAberto(false)
                  }}
                >
                  ✎ editar {daAba.nome}
                </button>
              )}
              <button
                className="ml-auto rounded-lg px-2.5 py-1 text-[var(--tinta-suave)] hover:bg-[var(--papel-2)] hover:text-[var(--foco)]"
                title="criar uma aba sua (outra prova, um trabalho, um resumo…)"
                onClick={() => {
                  editar(criar('Nova aba'))
                  setAberto(false)
                }}
              >
                ＋ nova aba
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Editar uma aba: nome, descrição e quais tópicos entram. */
export function EditarAba({ aba, fechar }: { aba: Aba; fechar: () => void }) {
  const editar = useMapa((s) => s.editarAba)
  const remover = useMapa((s) => s.removerAba)
  const alternar = useMapa((s) => s.alternarTopicoNaAba)
  const restaurar = useMapa((s) => s.restaurarAbasPadrao)
  const extras = useMapa((s) => s.mostrarExtras)
  const [apagar, setApagar] = useState(false)
  const [restaurarPergunta, setRestaurarPergunta] = useState(false)
  const dentro = new Set(aba.topicos)
  const caixa = useRef<HTMLElement>(null)
  // abre pelo rodapé, com a página rolada lá para baixo: trazer o editor para a vista
  // (chaves de propósito: em navegadores novos scrollIntoView devolve uma Promise, e o efeito não pode devolver nada)
  useEffect(() => {
    caixa.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <section
      ref={caixa}
      className="mt-4 scroll-mt-20 rounded-3xl border-2 border-[var(--foco)] bg-[var(--cartao)] p-5 shadow-[var(--sombra)]"
      aria-label={`editar aba ${aba.nome}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-[var(--tinta-forte)]">✎ Editar aba</span>
        <button className="botao-foco ml-auto" onClick={fechar}>
          pronto
        </button>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[8rem_1fr]">
        <label className="text-sm text-[var(--tinta)]">
          nome
          <input
            value={aba.nome}
            maxLength={16}
            onChange={(e) => editar(aba.id, { nome: e.target.value })}
            className="mt-1 w-full rounded-lg border border-[var(--linha)] bg-[var(--papel)] px-2 py-1.5 text-[var(--tinta-forte)]"
          />
        </label>
        <label className="text-sm text-[var(--tinta)]">
          o que cobre
          <input
            value={aba.descricao}
            maxLength={80}
            placeholder="ex.: prova de recuperação, só U4"
            onChange={(e) => editar(aba.id, { descricao: e.target.value })}
            className="mt-1 w-full rounded-lg border border-[var(--linha)] bg-[var(--papel)] px-2 py-1.5 text-[var(--tinta-forte)]"
          />
        </label>
      </div>

      <p className="mt-4 text-xs text-[var(--tinta-suave)]">
        Marque os tópicos que entram ({aba.topicos.length} agora). Também dá para mudar de dentro de cada tópico, no botão 📑.
      </p>
      <div className="mt-2 max-h-[55vh] space-y-3 overflow-y-auto pr-1">
        {MODULOS.map((m) => {
          const tps = m.topicos.filter((t) => extras || !t.naoVisto || dentro.has(t.id))
          const todos = tps.every((t) => dentro.has(t.id))
          const u = unidade(m.unidade)
          return (
            <div key={m.id}>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: u.cor }}>
                {u.id.toUpperCase()} · {m.titulo}
                <button
                  className="ml-auto text-[11px] font-normal normal-case tracking-normal text-[var(--foco)] hover:underline"
                  onClick={() => tps.forEach((t) => dentro.has(t.id) === todos && alternar(aba.id, t.id))}
                >
                  {todos ? 'tirar todos' : 'marcar todos'}
                </button>
              </div>
              <div className="mt-1 grid gap-x-3 sm:grid-cols-2">
                {tps.map((t) => (
                  <label key={t.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-sm text-[var(--tinta)] hover:bg-[var(--papel-2)]">
                    <input type="checkbox" checked={dentro.has(t.id)} onChange={() => alternar(aba.id, t.id)} className="h-4 w-4 accent-[var(--foco)]" />
                    {t.titulo}
                  </label>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--linha)] pt-3 text-xs">
        {apagar ? (
          <span className="flex flex-wrap items-center gap-2">
            Apagar a aba “{aba.nome}”? Os tópicos e o seu progresso neles não somem.
            <button className="text-[var(--alerta)] hover:underline" onClick={() => remover(aba.id)}>
              sim, apagar
            </button>
            <button className="text-[var(--tinta-suave)] hover:underline" onClick={() => setApagar(false)}>
              não
            </button>
          </span>
        ) : (
          <button className="text-[var(--tinta-suave)] hover:text-[var(--alerta)] hover:underline" onClick={() => setApagar(true)}>
            apagar esta aba
          </button>
        )}
        {aba.padrao &&
          (restaurarPergunta ? (
            <span className="flex flex-wrap items-center gap-2">
              Voltar P1, P2, E1, E2 e E3 à divisão do programa? Suas abas próprias ficam.
              <button
                className="text-[var(--foco)] hover:underline"
                onClick={() => {
                  restaurar()
                  setRestaurarPergunta(false)
                }}
              >
                sim
              </button>
              <button className="text-[var(--tinta-suave)] hover:underline" onClick={() => setRestaurarPergunta(false)}>
                não
              </button>
            </span>
          ) : (
            <button className="text-[var(--tinta-suave)] hover:underline" onClick={() => setRestaurarPergunta(true)}>
              voltar à divisão do programa
            </button>
          ))}
      </div>
    </section>
  )
}

/** Dentro do tópico: em quais abas ele está, com troca rápida. */
export function AbasDoTopico({ id }: { id: string }) {
  const abas = useMapa((s) => s.abas)
  const alternar = useMapa((s) => s.alternarTopicoNaAba)
  const [aberto, setAberto] = useState(false)
  const surgir = useSurgir('cima')
  const em = abas.filter((a) => a.topicos.includes(id))
  return (
    <span className="relative">
      <button
        onClick={() => setAberto(!aberto)}
        aria-expanded={aberto}
        className="rounded-full px-2.5 py-0.5 text-[var(--tinta-suave)] hover:bg-[var(--papel-2)]"
        title="em quais abas da trilha este tópico aparece"
      >
        📑 {em.length ? em.map((a) => a.nome).join(' · ') : 'sem aba'}
      </button>
      <AnimatePresence>
        {aberto && (
          <motion.span
            {...surgir}
            style={{ transformOrigin: 'top left' }}
            className="absolute left-0 top-full z-20 mt-1 flex w-56 flex-col gap-0.5 rounded-2xl border border-[var(--linha)] bg-[var(--cartao)] p-2 shadow-[var(--sombra)]"
          >
            <span className="px-1 pb-1 text-[11px] text-[var(--tinta-suave)]">Aparece nas abas:</span>
            {abas.map((a) => (
              <label key={a.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-sm text-[var(--tinta)] hover:bg-[var(--papel-2)]">
                <input type="checkbox" checked={a.topicos.includes(id)} onChange={() => alternar(a.id, id)} className="h-4 w-4 accent-[var(--foco)]" />
                <span className="font-medium">{a.nome}</span>
                <span className="truncate text-[11px] text-[var(--tinta-suave)]">{a.descricao}</span>
              </label>
            ))}
            <button className="mt-1 self-end text-xs text-[var(--foco)] hover:underline" onClick={() => setAberto(false)}>
              fechar
            </button>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
