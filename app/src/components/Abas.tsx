// Abas da trilha (Geral, P1, P2, E1…): barra, edição e o atalho dentro do tópico.
import { useState } from 'react'
import { GERAL, type Aba } from '../lib/abas'
import { MODULOS, unidade } from '../lib/trilha'
import { useMapa } from '../store/useMapa'

/** Barra de abas no topo da trilha. */
export function BarraAbas({ editar }: { editar: (id: string) => void }) {
  const abas = useMapa((s) => s.abas)
  const atual = useMapa((s) => s.abaAtual)
  const setAtual = useMapa((s) => s.setAbaAtual)
  const criar = useMapa((s) => s.criarAba)
  const estudados = useMapa((s) => s.estudados)

  const botao = (id: string, nome: string, titulo: string, feitos?: number, total?: number) => (
    <button
      key={id}
      role="tab"
      aria-selected={atual === id}
      title={titulo}
      onClick={() => setAtual(id)}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
        atual === id ? 'bg-[var(--tinta-forte)] text-[var(--papel)]' : 'bg-[var(--cartao)] text-[var(--tinta)] hover:bg-[var(--papel-2)]'
      }`}
    >
      {nome}
      {total !== undefined && total > 0 && (
        <span className={`ml-1.5 text-xs ${atual === id ? 'opacity-70' : 'text-[var(--tinta-suave)]'}`}>
          {feitos}/{total}
        </span>
      )}
    </button>
  )

  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div role="tablist" aria-label="recortes da trilha" className="flex items-center gap-1.5 pb-1">
        {botao(GERAL, 'Geral', 'a trilha inteira')}
        {abas.map((a) => botao(a.id, a.nome, a.descricao || a.nome, a.topicos.filter((t) => estudados[t]).length, a.topicos.length))}
        <button
          onClick={() => editar(criar('Nova aba'))}
          className="shrink-0 rounded-full border border-dashed border-[var(--linha)] px-3 py-1.5 text-sm text-[var(--tinta-suave)] hover:border-[var(--foco)] hover:text-[var(--foco)]"
          title="criar uma aba sua (outra prova, um trabalho, um resumo…)"
        >
          ＋ aba
        </button>
      </div>
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

  return (
    <section className="mt-4 rounded-3xl border-2 border-[var(--foco)] bg-[var(--cartao)] p-5 shadow-[var(--sombra)]" aria-label={`editar aba ${aba.nome}`}>
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
      {aberto && (
        <span className="absolute left-0 top-full z-20 mt-1 flex w-56 flex-col gap-0.5 rounded-2xl border border-[var(--linha)] bg-[var(--cartao)] p-2 shadow-[var(--sombra)]">
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
        </span>
      )}
    </span>
  )
}
