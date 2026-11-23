import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { topicoPorId } from '../content/topicos'
import type { Topico } from '../content/tipos'
import { prereqsDe } from '../lib/grafo'
import { LINHA, NOME_NIVEL, ORDEM, unidade, type Modulo } from '../lib/trilha'
import { useMapa } from '../store/useMapa'
import { useTreinosHoje } from './Treino'
import { topicosQueVoltam } from '../lib/revisita'

export type Status = 'novo' | 'andamento' | 'entendi' | 'voltar'

export function useStatus() {
  const { estudados, voltar, profundidade } = useMapa()
  return (id: string): Status => (voltar[id] ? 'voltar' : estudados[id] ? 'entendi' : profundidade[id] !== undefined ? 'andamento' : 'novo')
}

/** Bolinha de status: vazia, meia, check ou bandeira. */
export function IconeStatus({ status, cor }: { status: Status; cor: string }) {
  const base = 'grid h-7 w-7 shrink-0 place-items-center rounded-full text-[13px] font-bold transition-colors'
  if (status === 'entendi') return <span className={base} style={{ background: 'var(--menta)', color: '#fff' }}>✓</span>
  if (status === 'voltar') return <span className={base} style={{ background: 'var(--alerta-claro)', color: 'var(--alerta)', boxShadow: 'inset 0 0 0 2px var(--alerta)' }}>⚑</span>
  if (status === 'andamento')
    return <span className={base} style={{ background: `conic-gradient(${cor} 0 50%, var(--cartao) 50% 100%)`, boxShadow: `inset 0 0 0 2px ${cor}` }} />
  return <span className={base} style={{ background: 'var(--cartao)', boxShadow: 'inset 0 0 0 2px var(--linha)' }} />
}

function PontosNivel({ nivel, cor }: { nivel: 1 | 2 | 3; cor: string }) {
  return (
    <span className="flex items-center gap-1 text-[11px] text-[var(--tinta-suave)]" title={`profundidade: ${NOME_NIVEL[nivel]}`}>
      <span className="flex gap-0.5">
        {[1, 2, 3].map((n) => (
          <span key={n} className="h-1.5 w-1.5 rounded-full" style={{ background: n <= nivel ? cor : 'var(--linha)' }} />
        ))}
      </span>
      {NOME_NIVEL[nivel]}
    </span>
  )
}

function LinhaTopico({ tp, ultimo, cor }: { tp: Topico; ultimo: boolean; cor: string }) {
  const selecionar = useMapa((s) => s.selecionar)
  const status = useStatus()(tp.id)
  const precisa = prereqsDe.get(tp.id)!.map((p) => topicoPorId.get(p)!.titulo)
  return (
    <li className="relative">
      {/* o caminho que liga um tópico ao próximo */}
      {!ultimo && <span className="absolute left-[13px] top-9 bottom-[-6px] w-0.5 rounded-full" style={{ background: status === 'entendi' ? 'var(--menta)' : 'var(--linha)' }} />}
      <button
        onClick={() => selecionar(tp.id)}
        className="group flex w-full items-start gap-3 rounded-2xl px-0 py-1.5 text-left transition-colors hover:bg-[var(--papel-2)]/70"
      >
        <IconeStatus status={status} cor={cor} />
        <span className="min-w-0 flex-1 pt-0.5">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className={`font-medium ${status === 'entendi' ? 'text-[var(--tinta-suave)]' : 'text-[var(--tinta-forte)]'}`}>{tp.titulo}</span>
            {tp.naoVisto && <span className="rounded-full bg-[var(--papel-2)] px-2 text-[11px] text-[var(--tinta-suave)]">extra · não visto em aula</span>}
            {tp.semSlide && <span className="rounded-full bg-[var(--papel-2)] px-2 text-[11px] text-[var(--tinta-suave)]">complementar</span>}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <PontosNivel nivel={tp.nivel} cor={cor} />
            {precisa.length > 0 && (
              <span className="truncate text-[11px] text-[var(--tinta-suave)]">
                precisa de: {precisa.slice(0, 3).join(', ')}
                {precisa.length > 3 && ` +${precisa.length - 3}`}
              </span>
            )}
          </span>
        </span>
        <span className="mt-1 text-[var(--tinta-suave)] opacity-0 transition-opacity group-hover:opacity-100">→</span>
      </button>
    </li>
  )
}

function CartaoModulo({ m, aberto, alternar }: { m: Modulo; aberto: boolean; alternar: () => void }) {
  const status = useStatus()
  const extras = useMapa((s) => s.mostrarExtras)
  const u = unidade(m.unidade)
  const tps = m.topicos.filter((t) => extras || !t.naoVisto)
  const feitos = tps.filter((t) => status(t.id) === 'entendi').length
  const completo = feitos === tps.length

  return (
    <section className="overflow-hidden rounded-3xl border border-[var(--linha)] bg-[var(--cartao)] shadow-[var(--sombra)]">
      <button onClick={alternar} className="flex w-full items-center gap-3 px-5 py-4 text-left" aria-expanded={aberto}>
        <span className="h-9 w-1.5 rounded-full" style={{ background: u.cor }} />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: u.cor }}>
            {u.id.toUpperCase()} · {u.titulo}
          </span>
          <span className="block text-lg font-semibold text-[var(--tinta-forte)]">{m.titulo}</span>
        </span>
        <span className="text-right text-xs text-[var(--tinta-suave)]">
          <span className={completo ? 'font-semibold text-[var(--menta)]' : ''}>
            {completo ? '✓ ' : ''}
            {feitos}/{tps.length}
          </span>
          <span className="block">aula {m.aulas}</span>
        </span>
        <span className={`text-[var(--tinta-suave)] transition-transform ${aberto ? 'rotate-90' : ''}`}>▸</span>
      </button>
      <div className="mx-5 h-1 overflow-hidden rounded-full bg-[var(--papel-2)]">
        <motion.div className="h-full rounded-full" style={{ background: u.cor }} initial={false} animate={{ width: `${(feitos / Math.max(1, tps.length)) * 100}%` }} />
      </div>
      <AnimatePresence initial={false}>
        {aberto && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="space-y-1 overflow-hidden px-5 pt-3"
          >
            {tps.map((t, i) => (
              <LinhaTopico key={t.id} tp={t} ultimo={i === tps.length - 1} cor={u.cor} />
            ))}
            <li className="h-3" />
          </motion.ul>
        )}
      </AnimatePresence>
      {!aberto && <div className="h-4" />}
    </section>
  )
}

export function Trilha() {
  const { ultimo, estudados, voltar, revisitas, mostrarExtras, setMostrarExtras, selecionar, setRevisaoAberta } = useMapa()
  const status = useStatus()
  const treinosHoje = useTreinosHoje()
  const visiveis = ORDEM.filter((t) => !t.naoVisto)
  const feitos = visiveis.filter((t) => estudados[t.id]).length
  const paraVoltar = Object.keys(voltar).filter((id) => topicoPorId.has(id))
  const [agora] = useState(() => Date.now())
  const revisitarHoje = topicosQueVoltam(estudados, revisitas, agora)

  // continuar: o último aberto se ainda não foi entendido; senão o primeiro pendente da trilha
  const proximo = (ultimo && !estudados[ultimo] && topicoPorId.get(ultimo)) || visiveis.find((t) => status(t.id) !== 'entendi') || null
  const moduloDoProximo = proximo?.grupo
  const [abertos, setAbertos] = useState<Record<string, boolean>>(() => (moduloDoProximo ? { [moduloDoProximo]: true } : {}))

  return (
    <motion.main
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-2xl px-4 pb-24 pt-6 sm:px-6"
    >
      <nav className="mb-8 flex flex-wrap items-center gap-2">
        <span className="mr-auto text-sm font-semibold text-[var(--tinta-forte)]">
          Mapa de IA <span className="font-normal text-[var(--tinta-suave)]">· PUCRS 2026/2</span>
        </span>
        <button className="botao-suave" onClick={() => setRevisaoAberta(true)}>
          🗂 cartões
        </button>
        <a className="botao-suave relative" href="#/treino">
          🧮 treino
          {treinosHoje > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--coral)] px-1 text-[11px] font-semibold text-white" title={`${treinosHoje} para hoje`}>
              {treinosHoje}
            </span>
          )}
        </a>
        <a className="botao-suave" href="#/quadro">
          💭 quadro
        </a>
        <a className="botao-suave" href="#/mapa">
          🕸 conexões
        </a>
      </nav>

      <h1 className="text-3xl font-semibold leading-tight text-[var(--tinta-forte)] sm:text-4xl">
        {feitos === 0 ? 'Bora começar pelo começo.' : feitos === visiveis.length ? 'Você passou por tudo! 🎉' : 'Bom te ver de volta!'}
      </h1>
      <p className="mt-2 text-[var(--tinta-suave)]">Um tópico de cada vez, do básico ao avançado. Cada um abre em camadas: você só aprofunda quando quiser.</p>

      {/* progresso geral */}
      <div className="mt-6">
        <div className="mb-1.5 flex justify-between text-sm">
          <span className="text-[var(--tinta)]">
            <strong className="text-[var(--tinta-forte)]">{feitos}</strong> de {visiveis.length} tópicos entendidos
          </span>
          {paraVoltar.length > 0 && <span className="text-[var(--alerta)]">⚑ {paraVoltar.length} para voltar</span>}
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-[var(--papel-2)]">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, var(--foco), var(--coral), var(--sol))' }}
            initial={{ width: 0 }}
            animate={{ width: `${(feitos / visiveis.length) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* continuar */}
      {proximo && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={() => selecionar(proximo.id)}
          className="group mt-6 flex w-full items-center gap-4 rounded-3xl p-5 text-left text-white shadow-[0_18px_40px_-20px_var(--foco)] transition-transform hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, var(--foco), #8f7cf5)' }}
        >
          <span className="min-w-0 flex-1">
            <span className="block text-xs uppercase tracking-[0.16em] text-white/75">{ultimo === proximo.id ? 'continuar de onde parei' : 'próximo passo'}</span>
            <span className="mt-0.5 block truncate text-xl font-semibold">{proximo.titulo}</span>
            <span className="block text-sm text-white/80">{unidade(proximo.unidade).titulo}</span>
          </span>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-white/20 text-xl transition-transform group-hover:translate-x-1">→</span>
        </motion.button>
      )}

      {paraVoltar.length > 0 && (
        <div className="mt-4 rounded-2xl bg-[var(--alerta-claro)] px-4 py-3 text-sm">
          <div className="mb-1.5 font-medium text-[var(--alerta)]">⚑ Você marcou para voltar:</div>
          <div className="flex flex-wrap gap-1.5">
            {paraVoltar.map((id) => (
              <button key={id} onClick={() => selecionar(id)} className="rounded-full bg-white px-2.5 py-0.5 text-[var(--tinta)] hover:shadow">
                {topicoPorId.get(id)!.titulo}
              </button>
            ))}
          </div>
        </div>
      )}

      {revisitarHoje.length > 0 && (
        <div className="mt-4 rounded-2xl bg-[color-mix(in_srgb,var(--foco-claro)_70%,var(--cartao))] px-4 py-3 text-sm">
          <div className="mb-0.5 font-medium text-[var(--foco)]">↻ Hora de revisitar</div>
          <p className="mb-2 text-xs text-[var(--tinta-suave)]">Você entendeu estes há alguns dias. Uma olhada rápida agora segura a memória.</p>
          <div className="flex flex-wrap gap-1.5">
            {revisitarHoje.map((t) => (
              <button key={t.id} onClick={() => selecionar(t.id)} className="rounded-full bg-white px-2.5 py-0.5 text-[var(--tinta)] hover:shadow">
                {t.titulo}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-3 mt-10 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--tinta-suave)]">A trilha</h2>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--tinta-suave)]">
          <input type="checkbox" checked={mostrarExtras} onChange={(e) => setMostrarExtras(e.target.checked)} className="accent-[var(--foco)]" />
          mostrar extras (não vistos em aula)
        </label>
      </div>
      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--tinta-suave)]">
        <span>○ não comecei</span>
        <span>◐ comecei</span>
        <span className="text-[var(--menta)]">✓ entendi</span>
        <span className="text-[var(--alerta)]">⚑ voltar depois</span>
        <span>●○○ base · ●●○ aprofunda · ●●● avançado</span>
      </div>

      <div className="space-y-3">
        {LINHA.map((item) =>
          'tipo' in item ? (
            <div key={item.titulo} className="flex items-center gap-3 px-2 py-2 text-sm">
              <span className="text-lg">🏁</span>
              <span className="font-semibold text-[var(--tinta-forte)]">{item.titulo}</span>
              <span className="h-px flex-1 bg-[var(--linha)]" />
              <span className="text-xs text-[var(--tinta-suave)]">avaliação</span>
            </div>
          ) : (
            <CartaoModulo key={item.id} m={item} aberto={!!abertos[item.id]} alternar={() => setAbertos((a) => ({ ...a, [item.id]: !a[item.id] }))} />
          ),
        )}
      </div>
    </motion.main>
  )
}
