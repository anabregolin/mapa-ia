import { AnimatePresence, motion } from 'framer-motion'
import { useState, type ReactNode } from 'react'
import { topicoPorId } from '../content/topicos'
import type { Topico } from '../content/tipos'
import { prereqsDe } from '../lib/grafo'
import { LINHA, ORDEM, unidade, type Modulo } from '../lib/trilha'
import { useMapa } from '../store/useMapa'
import { topicosQueVoltam } from '../lib/revisita'
import { BotoesPaineis } from './Ajustes'
import { LembreteBackup } from './Backup'
import { EditarAba, SeletorAba } from './Abas'
import { BotaoPomodoro } from './Pomodoro'
import { BotaoCalculadora } from './Calculadora'
import { RodapeFixo } from './RodapeFixo'
import { Dica, DicaEstimativa, DicaLista } from './Dica'
import { contarCamadas, percentVisto } from '../lib/camadas'
import { GERAL } from '../lib/abas'
import { TesteDaAba } from './Teste'
import { chaveTeste } from '../lib/teste'
import { estimarTopico, estimarTopicos, explicarEstimativa, formatarEstimativa } from '../lib/estimativa'
import { formatarTempo, tempoTotal } from '../lib/tempo'
import { useNuvem } from '../lib/nuvem'

export type Status = 'novo' | 'andamento' | 'entendi' | 'voltar'

export function useStatus() {
  const { estudados, voltar, profundidade } = useMapa()
  return (id: string): Status => (voltar[id] ? 'voltar' : estudados[id] ? 'entendi' : profundidade[id] !== undefined ? 'andamento' : 'novo')
}

/** Bolinha de status: vazia, meia, check ou bandeira. */
export function IconeStatus({ status, cor, fracao = 0.5 }: { status: Status; cor: string; fracao?: number }) {
  const base = 'grid h-7 w-7 shrink-0 place-items-center rounded-full text-[13px] font-bold transition-colors'
  if (status === 'entendi')
    return (
      <span className={base} style={{ background: 'var(--menta)', color: '#fff' }}>
        ✓
      </span>
    )
  if (status === 'voltar')
    return (
      <span
        className={base}
        style={{
          background: 'var(--alerta-claro)',
          color: 'var(--alerta)',
          boxShadow: 'inset 0 0 0 2px var(--alerta)',
        }}
      >
        ⚑
      </span>
    )
  if (status === 'andamento')
    return (
      <span
        className={base}
        style={{
          background: `conic-gradient(${cor} 0 ${Math.round(fracao * 100)}%, var(--cartao) ${Math.round(fracao * 100)}% 100%)`,
          boxShadow: `inset 0 0 0 2px ${cor}`,
        }}
      />
    )
  return (
    <span
      className={base}
      style={{
        background: 'var(--cartao)',
        boxShadow: 'inset 0 0 0 2px var(--linha)',
      }}
    />
  )
}

const NOME_STATUS: Record<Status, string> = {
  novo: 'não comecei',
  andamento: 'comecei, ainda não marquei como entendido',
  entendi: 'entendi',
  voltar: 'marcado para voltar depois (⚑ ainda confuso)',
}

/* Linha de tópico: cada tipo de informação tem um só jeito de aparecer.
 *  - rótulo do tópico (extra, sem slide): etiqueta pequena colada ao título, porque fala do conteúdo;
 *  - números seus (% lido, tempo, base que falta): texto discreto à direita, separado por "·";
 *  - resultado do teste: a única pílula colorida, na ponta, porque é o que pede ação.
 *  As cores passam de 4,5:1 em 11px (as antigas em menta e âmbar ficavam em 2,5 e 3,2). */
const TOM_ROTULO = {
  sol: { background: '#fff3d1', color: '#855600' },
  neutro: { background: '#f1ece3', color: '#5c5866' },
} as const
const TOM_RESULTADO = {
  menta: {
    background: '#e2f5ec',
    color: '#11704d',
    boxShadow: 'inset 0 0 0 1px #c4ead8',
  },
  coral: {
    background: '#ffeee8',
    color: '#b4401f',
    boxShadow: 'inset 0 0 0 1px #ffd6c9',
  },
} as const

/** Etiqueta do tópico (extra, sem slide). */
function Rotulo({ nome, dica, tom }: { nome: string; dica: string; tom: keyof typeof TOM_ROTULO }) {
  return (
    <Dica texto={dica} className="cursor-help align-[1px]">
      <span className="whitespace-nowrap rounded-md px-1.5 py-px text-[10px] font-semibold uppercase leading-4 tracking-[0.06em]" style={TOM_ROTULO[tom]}>
        {nome}
      </span>
      <span className="sr-only">: {dica}</span>
    </Dica>
  )
}

/** Número discreto (% lido, tempo, base): mesmo tom do texto secundário. */
function Medida({ texto, dica, leitura, destaque }: { texto: string; dica: ReactNode; leitura?: string; destaque?: boolean }) {
  // leitura: a dica em texto corrido, para leitor de tela, quando a dica visual é uma lista
  const falado = leitura ?? (typeof dica === 'string' ? dica : '')
  return (
    <Dica texto={dica} className="cursor-help">
      <span className={`whitespace-nowrap ${destaque ? 'font-medium text-[#855600]' : ''}`}>{texto}</span>
      {falado && <span className="sr-only">: {falado}</span>}
    </Dica>
  )
}

function LinhaTopico({ tp, ultimo, acima, cor }: { tp: Topico; ultimo: boolean; acima: string[]; cor: string }) {
  const selecionar = useMapa((s) => s.selecionar)
  const st = useStatus()
  const status = st(tp.id)
  const precisa = prereqsDe.get(tp.id)!
  const faltam = status === 'entendi' ? [] : precisa.filter((p) => st(p) !== 'entendi')
  // base que falta e está acima neste mesmo módulo: a própria ordem já diz isso, não repete em toda linha.
  // Só avisa quando ela está em outro módulo, que é o caso que passa despercebido.
  const faltaFora = faltam.some((p) => !acima.includes(p))
  const ms = useMapa((s) => s.tempo[tp.id]?.ms ?? 0)
  const teste = useMapa((s) => s.testes[`t:${tp.id}:fechamento`])
  const prof = useMapa((s) => s.profundidade[tp.id])
  const visto = percentVisto(tp.id, prof)
  const nCamadas = contarCamadas(tp.id)
  const estimativa = estimarTopico(tp.id)
  const passou = teste && teste.acertos / Math.max(1, teste.total) >= 0.7

  const rotulos = [
    tp.naoVisto && <Rotulo key="extra" nome="extra" tom="sol" dica="Está no programa, mas não foi visto em aula." />,
    tp.semSlide && <Rotulo key="sem-slide" nome="sem slide" tom="neutro" dica="Escrito a partir de listas e provas: não tem slide próprio da aula." />,
  ].filter(Boolean)

  const medidas = [
    faltaFora && (
      <Medida
        key="base"
        destaque
        texto={faltam.length === 1 ? 'falta 1 base' : `faltam ${faltam.length} bases`}
        dica={
          <DicaLista
            titulo={faltam.length === 1 ? 'Falta 1 base' : `Faltam ${faltam.length} bases`}
            itens={faltam.map((p) => [topicoPorId.get(p)!.titulo, ''] as [string, string])}
            nota={`Ainda não marcados como entendidos. Dá para seguir, mas ${faltam.length === 1 ? 'ele ajuda' : 'eles ajudam'} a entender este.`}
          />
        }
        leitura={`Ele usa ${faltam.map((p) => topicoPorId.get(p)!.titulo).join(', ')}, que você ainda não marcou como entendido.`}
      />
    ),
    status !== 'entendi' && visto > 0 && (
      <Medida
        key="visto"
        texto={visto >= 100 ? 'tudo lido' : `${visto}% lido`}
        dica={
          <DicaLista
            titulo={visto >= 100 ? 'Tudo lido' : `${visto}% lido`}
            itens={[['partes abertas', `${Math.min(nCamadas, (prof ?? 0) + 1)} de ${nCamadas}`]]}
            nota="Conta a parte mais funda que você abriu. A bolinha à esquerda enche junto."
          />
        }
        leitura={`Você já abriu ${visto}% das partes deste tópico.`}
      />
    ),
    // tempo: tópico nunca aberto mostra o esperado; a partir do momento em que você abre, só o que você levou
    status === 'novo' ? (
      <Medida key="tempo" texto={formatarEstimativa(estimativa.min)} dica={<DicaEstimativa e={estimativa} />} leitura={explicarEstimativa(estimativa)} />
    ) : (
      ms >= 60_000 && (
        <Medida
          key="tempo"
          texto={formatarTempo(ms)}
          dica={
            <DicaLista
              titulo={`Você estudou ${formatarTempo(ms)}`}
              itens={[['tempo esperado', formatarEstimativa(estimativa.min)]]}
              nota="Só conta com a aba visível e você mexendo."
            />
          }
          leitura={`Você estudou ${formatarTempo(ms)} neste tópico; o esperado era ${formatarEstimativa(estimativa.min)}.`}
        />
      )
    ),
  ].filter(Boolean)

  return (
    <li className="relative">
      {/* a linha liga um tópico ao próximo na ordem das aulas (não é dependência) */}
      {!ultimo && (
        <span
          className="absolute left-[13px] top-[38px] bottom-[-6px] w-0.5 rounded-full"
          style={{
            background: status === 'entendi' ? 'var(--menta)' : 'var(--linha)',
          }}
        />
      )}
      <button
        onClick={() => selecionar(tp.id)}
        className="group flex w-full items-start gap-3 rounded-2xl py-2 pr-2 text-left transition-colors hover:bg-[var(--papel-2)]/70 sm:items-center"
      >
        <Dica texto={NOME_STATUS[status]} className="cursor-help">
          <IconeStatus status={status} cor={cor} fracao={Math.max(0.15, visto / 100)} />
        </Dica>
        <span className="sr-only">{NOME_STATUS[status]}:</span>
        {/* tela estreita: números e teste descem para baixo do título; larga: ficam à direita */}
        {/* no celular a bolinha fica no topo (título em 2 linhas não a desloca para cima da linha vertical) */}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 pt-[3px] sm:flex-row sm:items-center sm:gap-4 sm:pt-0">
          <span className="min-w-0 flex-1 leading-snug">
            <span className={`font-medium ${status === 'entendi' ? 'text-[var(--tinta-suave)]' : 'text-[var(--tinta-forte)]'}`}>{tp.titulo}</span>
            {rotulos.length > 0 && <span className="ml-2 inline-flex gap-1 align-middle">{rotulos}</span>}
          </span>
          {(medidas.length > 0 || teste) && (
            <span className="flex flex-wrap items-center gap-x-1.5 text-xs tabular-nums text-[var(--tinta-suave)] sm:shrink-0 sm:justify-end">
              {medidas.flatMap((m, k) =>
                k
                  ? [
                      <span key={`p${k}`} aria-hidden className="opacity-50">
                        ·
                      </span>,
                      m,
                    ]
                  : [m],
              )}
              {teste && (
                <Dica
                  texto={`Último teste do fim do tópico: ${teste.acertos} de ${teste.total}.${passou ? '' : ' Abaixo de 70%: o tópico está em Pontos fracos.'}`}
                  className={`cursor-help ${medidas.length ? 'ml-1' : ''}`}
                >
                  <span className="whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold leading-tight" style={TOM_RESULTADO[passou ? 'menta' : 'coral']}>
                    {passou ? '✓' : '!'} teste {teste.acertos}/{teste.total}
                  </span>
                </Dica>
              )}
            </span>
          )}
        </span>
        <span className="text-[var(--tinta-suave)] opacity-0 transition-opacity group-hover:opacity-100" aria-hidden>
          →
        </span>
      </button>
    </li>
  )
}

function CartaoModulo({ m, aberto, alternar, filtro }: { m: Modulo; aberto: boolean; alternar: () => void; filtro: Set<string> | null }) {
  const status = useStatus()
  const extras = useMapa((s) => s.mostrarExtras)
  const u = unidade(m.unidade)
  const tps = m.topicos.filter((t) => (filtro ? filtro.has(t.id) : extras || !t.naoVisto))
  const feitos = tps.filter((t) => status(t.id) === 'entendi').length
  const completo = feitos === tps.length
  const origem = `${u.id.toUpperCase()} · ${u.titulo}${m.aulas ? ` · aula ${m.aulas}` : ''}`
  // tempo esperado do módulo: soma dos palpites de todos os tópicos visíveis nele
  const esperado = estimarTopicos(tps.map((t) => t.id))
  const faltaMin = estimarTopicos(tps.filter((t) => status(t.id) !== 'entendi').map((t) => t.id))
  const gasto = useMapa((s) =>
    tempoTotal(
      s.tempo,
      tps.map((t) => t.id),
    ),
  )

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--linha)] bg-[var(--cartao)]">
      {/* fechado: só cor da unidade, título e quantos foram; unidade e aula aparecem ao abrir */}
      <button onClick={alternar} className="flex w-full items-center gap-3 px-4 py-3 text-left" aria-expanded={aberto} title={origem}>
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: u.cor }} aria-hidden />
        {/* no celular o tempo desce para baixo do título, para o nome do módulo não ser cortado */}
        <span className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center sm:gap-3">
          <span className="min-w-0 truncate font-semibold text-[var(--tinta-forte)] sm:flex-1">{m.titulo}</span>
          {tps.length > 0 && (
            <Dica
              toque={false}
              className="w-fit shrink-0 cursor-help text-xs tabular-nums text-[var(--tinta-suave)]"
              texto={
                <DicaLista
                  titulo={`Tempo esperado ${formatarEstimativa(esperado)}`}
                  itens={[
                    ['tópicos somados', String(tps.length)] as [string, string],
                    ...(faltaMin && !completo && faltaMin < esperado ? [['nos que ainda faltam', formatarEstimativa(faltaMin)] as [string, string]] : []),
                    ...(gasto >= 60_000 ? [['você já estudou', formatarTempo(gasto)] as [string, string]] : []),
                  ]}
                  nota="Palpite, não medida: cada tópico é arredondado de 5 em 5."
                />
              }
            >
              {formatarEstimativa(esperado)}
            </Dica>
          )}
        </span>
        <span className={`shrink-0 text-xs tabular-nums ${completo ? 'font-semibold text-[var(--menta)]' : 'text-[var(--tinta-suave)]'}`}>
          {completo ? '✓ ' : ''}
          {feitos}/{tps.length}
        </span>
        <span className={`text-[var(--tinta-suave)] transition-transform ${aberto ? 'rotate-90' : ''}`} aria-hidden>
          ▸
        </span>
      </button>
      <AnimatePresence initial={false}>
        {aberto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden border-t border-[var(--linha)]"
          >
            <div className="px-4 pt-2.5 text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: u.cor }}>
              {origem}
            </div>
            {/* uma coluna só, na ordem das aulas: duas colunas deixavam tudo apertado */}
            <ul className="space-y-0.5 px-4 pb-3 pt-1.5">
              {tps.map((t, i) => (
                <LinhaTopico key={t.id} tp={t} ultimo={i === tps.length - 1} acima={tps.slice(0, i).map((x) => x.id)} cor={u.cor} />
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

/** Rodapé da página: onde o progresso fica guardado. */
function Rodape() {
  const nuvem = useNuvem()
  return (
    <footer className="mt-16 border-t border-[var(--linha)] pt-8">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-[var(--tinta-suave)]">
        <span>
          <strong className="font-semibold text-[var(--tinta)]">Mapa de IA</strong> · PUCRS 2026/2
        </span>
        <span className="rounded-full bg-[var(--papel-2)] px-3 py-1">
          {nuvem.email ? `☁ sincronizado com ${nuvem.email}` : '💾 progresso salvo só neste aparelho · backup em ⚙ › Dados'}
        </span>
      </div>
    </footer>
  )
}

type Painel = 'progresso' | 'teste' | 'voltar' | 'revisitar'

export function Trilha() {
  const { ultimo, estudados, voltar, revisitas, estudo, selecionar, abas, abaAtual, tempo, testes } = useMapa()
  const status = useStatus()
  const [editando, setEditando] = useState<string | null>(null)
  const [painel, setPainel] = useState<Painel | null>(null)
  const aba = abaAtual === GERAL ? null : (abas.find((a) => a.id === abaAtual) ?? null)
  const abaEditada = abas.find((a) => a.id === editando)
  // numa aba, vale o que ela marca (inclusive extras); na geral, só o que foi visto em aula
  const filtro = aba ? new Set(aba.topicos) : null
  const visiveis = filtro ? ORDEM.filter((t) => filtro.has(t.id)) : ORDEM.filter((t) => !t.naoVisto)
  const feitos = visiveis.filter((t) => estudados[t.id]).length
  const paraVoltar = Object.keys(voltar).filter((id) => topicoPorId.has(id))
  const [agora] = useState(() => Date.now())
  const revisitarHoje = topicosQueVoltam(revisitas, estudo.intervalos, agora)
  const testeGeral = testes[chaveTeste('geral', abaAtual)]

  // continuar: o último aberto se ainda não foi entendido; senão o primeiro pendente da trilha
  const proximo = (ultimo && !estudados[ultimo] && (!filtro || filtro.has(ultimo)) && topicoPorId.get(ultimo)) || visiveis.find((t) => status(t.id) !== 'entendi') || null
  const moduloDoProximo = proximo?.grupo
  const [abertos, setAbertos] = useState<Record<string, boolean>>(() => (moduloDoProximo ? { [moduloDoProximo]: true } : {}))

  const estudoMs = tempoTotal(
    tempo,
    visiveis.map((t) => t.id),
  )
  const pct = Math.round((feitos / Math.max(1, visiveis.length)) * 100)

  // fechado, cada resumo é só um ícone (e um número); o conteúdo abre embaixo da fileira, um por vez
  const chip = (p: Painel, simbolo: string, rotulo: string, numero?: string | number, cor?: string) => (
    <Dica key={p} texto={rotulo} toque={false}>
      <button
        onClick={() => setPainel(painel === p ? null : p)}
        aria-expanded={painel === p}
        aria-controls="painel-trilha"
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
          painel === p ? 'bg-[var(--foco)] text-white' : 'bg-[var(--cartao)] text-[var(--tinta)] ring-1 ring-[var(--linha)] hover:ring-[var(--tinta-suave)]'
        }`}
      >
        <span aria-hidden>{simbolo}</span>
        {numero !== undefined && (
          <span className="tabular-nums" style={painel === p || !cor ? undefined : { color: cor }}>
            {numero}
          </span>
        )}
        <span className="sr-only">{rotulo}</span>
      </button>
    </Dica>
  )

  const navegar =
    'relative flex items-center gap-1.5 rounded-full bg-[var(--papel-2)] px-2 py-1.5 text-[13px] text-[var(--tinta)] transition-colors hover:bg-[var(--linha)] md:px-3'
  const cartao = 'mt-3 rounded-2xl border border-[var(--linha)] bg-[var(--cartao)] px-4 py-3 text-sm'
  return (
    // fundo próprio: a página passa da altura do body, e sem isso aparecia a cor de fundo do mapa embaixo
    <motion.div
      className="min-h-dvh bg-[var(--papel)]"
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <LembreteBackup />
      <div className="sticky top-0 z-20 border-b border-[var(--linha)] bg-[var(--papel)]/85 backdrop-blur" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        {/* no celular quebra em duas linhas: título + prova em cima, ferramentas embaixo */}
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center gap-x-1 gap-y-2 px-4 py-3 sm:gap-x-1.5 sm:px-8">
          <div className="mr-auto flex min-w-0 items-center gap-2.5">
            {/* o "· PUCRS 2026/2" saiu da linha para caber a prova ao lado sem quebrar em 1280px */}
            <span className="shrink-0 text-sm font-semibold text-[var(--tinta-forte)]" title="Mapa de IA · PUCRS 2026/2">
              Mapa de IA
            </span>
            <SeletorAba editar={setEditando} abaixo />
          </div>
          <nav className="flex items-center gap-1 sm:gap-1.5" aria-label="ferramentas">
            <a className={navegar} href="#/mapa" title="conexões" aria-label="conexões">
              🕸<span className="hidden md:inline">conexões</span>
            </a>
            <span className="mx-0.5 h-5 w-px bg-[var(--linha)]" aria-hidden />
            <BotoesPaineis className={navegar} rotulos />
          </nav>
        </div>
      </div>

      <main className="mx-auto w-full max-w-4xl px-5 pb-16 pt-6 sm:px-8">
        <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="resumo da trilha">
          {chip('progresso', '📊', `progresso em ${aba ? aba.nome : 'toda a trilha'}`, `${pct}%`)}
          {visiveis.length > 0 &&
            chip(
              'teste',
              '📝',
              `teste geral de ${aba ? aba.nome : 'toda a trilha'}: ${estudo.questoesTeste} questões misturando os tópicos, os mais fracos primeiro${testeGeral ? ` · última vez ${testeGeral.acertos}/${testeGeral.total}` : ''}`,
              testeGeral ? `${testeGeral.acertos}/${testeGeral.total}` : undefined,
            )}
          {paraVoltar.length > 0 && chip('voltar', '⚑', 'tópicos que você marcou com ⚑ “ainda confuso, volto depois”', paraVoltar.length, 'var(--alerta)')}
          {revisitarHoje.length > 0 &&
            chip('revisitar', '↻', 'tópicos entendidos há alguns dias que voltam hoje: uma olhada rápida segura a memória', revisitarHoje.length, 'var(--foco)')}
        </div>

        <AnimatePresence initial={false} mode="wait">
          {painel && (
            <motion.div key={painel} id="painel-trilha" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
              {painel === 'progresso' && (
                <div className={cartao}>
                  <div className="text-xs text-[var(--tinta-suave)]">
                    <strong className="font-semibold text-[var(--tinta)]">{aba ? aba.nome : 'Trilha toda'}</strong>
                    {' · '}
                    {aba ? aba.descricao || 'aba sem descrição' : 'tudo o que foi visto em aula, na ordem em que um tópico apoia o outro'}
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-lg font-semibold tabular-nums text-[var(--tinta-forte)]">
                      {feitos} de {visiveis.length}
                    </span>
                    <span className="text-xs text-[var(--tinta-suave)]">entendidos</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--papel-2)]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, var(--foco), var(--coral), var(--sol))',
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="mt-1.5 text-xs text-[var(--tinta-suave)]">
                    {estudoMs >= 60_000 ? `⏲ ${formatarTempo(estudoMs)} de estudo` : 'sem tempo contado ainda'}
                    {feitos < visiveis.length && (
                      <>
                        {' · '}
                        <Dica
                          texto="Soma do tempo esperado dos tópicos ainda não entendidos. É um palpite pelo tamanho do texto, fórmulas, exercícios e nível: serve para planejar, não é medida."
                          className="cursor-help underline decoration-dotted underline-offset-2"
                        >
                          falta {formatarEstimativa(estimarTopicos(visiveis.filter((t) => !estudados[t.id]).map((t) => t.id)))}
                        </Dica>
                      </>
                    )}
                  </div>
                </div>
              )}
              {painel === 'teste' && <TesteDaAba key={abaAtual} abaId={abaAtual} nome={aba?.nome ?? 'toda a trilha'} topicos={visiveis.map((t) => t.id)} />}
              {painel === 'voltar' && (
                <div className={`${cartao} flex flex-wrap items-center gap-2`}>
                  <span className="w-full text-xs text-[var(--tinta-suave)]">Para voltar:</span>
                  {paraVoltar.map((id) => (
                    <button key={id} onClick={() => selecionar(id)} className="rounded-full bg-[var(--papel-2)] px-2.5 py-0.5 text-[var(--tinta)] hover:bg-[var(--linha)]">
                      {topicoPorId.get(id)!.titulo}
                    </button>
                  ))}
                </div>
              )}
              {painel === 'revisitar' && (
                <div className={`${cartao} flex flex-wrap items-center gap-2`}>
                  <span className="w-full text-xs text-[var(--tinta-suave)]">Para revisitar hoje:</span>
                  {revisitarHoje.map((t) => (
                    <button key={t.id} onClick={() => selecionar(t.id)} className="rounded-full bg-[var(--papel-2)] px-2.5 py-0.5 text-[var(--tinta)] hover:bg-[var(--linha)]">
                      {t.titulo}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {abaEditada && <EditarAba key={abaEditada.id} aba={abaEditada} fechar={() => setEditando(null)} />}

        {aba && visiveis.length === 0 && (
          <p className="mt-6 rounded-2xl border border-dashed border-[var(--linha)] px-4 py-6 text-center text-sm text-[var(--tinta-suave)]">
            Esta aba ainda não tem tópicos. Use “✎ editar” na escolha da prova, no rodapé, ou o botão 📑 dentro de um tópico.
          </p>
        )}
        <div className="mt-6 space-y-2.5">
          {LINHA.map((item) =>
            'tipo' in item ? (
              aba ? null : (
                <div key={item.titulo} className="flex items-center gap-3 px-2 py-1 text-xs text-[var(--tinta-suave)]">
                  <span aria-hidden>🏁</span>
                  <span className="font-semibold text-[var(--tinta)]">{item.titulo}</span>
                  <span className="h-px flex-1 bg-[var(--linha)]" />
                </div>
              )
            ) : filtro && !item.topicos.some((t) => filtro.has(t.id)) ? null : (
              <CartaoModulo key={item.id} m={item} filtro={filtro} aberto={!!abertos[item.id]} alternar={() => setAbertos((a) => ({ ...a, [item.id]: !a[item.id] }))} />
            ),
          )}
        </div>

        <Rodape />
      </main>

      <RodapeFixo rotulo="rodapé da trilha" largura="max-w-4xl">
        <BotaoPomodoro />
        <BotaoCalculadora />
        <span className="flex min-w-0 flex-1 justify-end">
          {proximo ? (
            <button
              className="flex min-w-0 max-w-full items-center gap-2 rounded-full py-1 pl-3.5 pr-1 text-sm font-semibold text-white shadow-[0_10px_24px_-14px_var(--foco)]"
              style={{
                background: 'linear-gradient(135deg, var(--foco), #8f7cf5)',
              }}
              onClick={() => selecionar(proximo.id)}
              title={`${ultimo === proximo.id ? 'continuar de onde parei' : 'próximo passo'}: ${proximo.titulo} (${unidade(proximo.unidade).titulo})`}
            >
              <span className="min-w-0 truncate">
                <span className="font-normal opacity-85">{ultimo === proximo.id ? 'continuar: ' : 'próximo: '}</span>
                {proximo.titulo}
              </span>
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/25" aria-hidden>
                →
              </span>
            </button>
          ) : (
            <span className="truncate text-sm text-[var(--tinta-suave)]">{visiveis.length ? 'tudo entendido aqui 🎉' : ''}</span>
          )}
        </span>
      </RodapeFixo>
    </motion.div>
  )
}
