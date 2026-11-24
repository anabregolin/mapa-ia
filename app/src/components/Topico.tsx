import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { DEMOS, demosDoTopico, exerciciosDoTopico } from '../content/exercicios'
import { EXPLICACOES } from '../content/explicacoes'
import { formulasDoTopico } from '../content/formulas'
import { grupoPorId, topicoPorId } from '../content/topicos'
import type { Demo, Topico as TipoTopico } from '../content/tipos'
import { dependentesDe, parecidosDe, prereqsDe } from '../lib/grafo'
import { NOME_NIVEL, unidade, vizinhosNaTrilha } from '../lib/trilha'
import { useMapa } from '../store/useMapa'
import { DemoModal, ItemExercicio } from './Exercicio'
import { FormulaAnimada } from './FormulaAnimada'
import { TextoLeitura } from './Texto'
import { BotaoAjustes } from './Ajustes'
import { Preteste } from './Preteste'
import { Lembrar } from './Lembrar'
import { AvisoPausa, BotaoRelembrar } from './Relembrar'
import { pretestePara } from '../content/preteste'
import { LinhaTreino } from './Treino'
import { Anotacao, AvisoRevisita, PalavrasFlutuantes, temCartoes } from './Ferramentas'
import { calculosDoTopico } from '../content/calculos'
import { IconeStatus, useStatus } from './Trilha'

interface Camada {
  chave: string
  /** nome curto na régua de profundidade */
  rotulo: string
  /** frase do botão que abre esta camada */
  convite: string
  conteudo: ReactNode
}

function montarCamadas(tp: TipoTopico, abrirDemo: (d: Demo) => void): Camada[] {
  const c = EXPLICACOES[tp.id]
  const formulas = formulasDoTopico(tp.id)
  const exercicios = exerciciosDoTopico(tp.id)
  const demos = demosDoTopico(tp.id)
  const resumo: Camada = {
    chave: 'resumo',
    rotulo: c ? 'Cola para revisar' : 'Em uma frase',
    convite: 'Fechar com a cola de revisão',
    conteudo: <p className="fonte-leitura text-[var(--tinta-forte)]">{tp.resumo}</p>,
  }
  // sem explicação em camadas, o resumo é o ponto de partida
  const camadas: Camada[] = c ? [] : [resumo]
  if (c) {
    camadas.push(
      { chave: 'intuicao', rotulo: 'Pensa assim', convite: '', conteudo: <TextoLeitura>{c.intuicao}</TextoLeitura> },
      { chave: 'definicao', rotulo: 'Com o nome certo', convite: 'Agora com as palavras da prova', conteudo: <TextoLeitura>{c.definicao}</TextoLeitura> },
      { chave: 'detalhe', rotulo: 'Mergulho', convite: 'Quero o detalhe técnico', conteudo: <TextoLeitura>{c.detalhe}</TextoLeitura> },
    )
    if (c.cuidado)
      camadas.push({
        chave: 'cuidado',
        rotulo: 'Pegadinha',
        convite: 'Onde as pessoas erram na prova?',
        conteudo: (
          <TextoLeitura className="rounded-2xl bg-[var(--alerta-claro)] px-4 py-3 text-[var(--tinta-forte)]">{c.cuidado}</TextoLeitura>
        ),
      })
  }
  if (formulas.length)
    camadas.push({
      chave: 'formulas',
      rotulo: 'Fórmulas',
      convite: formulas.length > 1 ? `Ver as ${formulas.length} fórmulas, termo a termo` : 'Ver a fórmula, termo a termo',
      conteudo: (
        <div className="space-y-6">
          {formulas.map((f) => (
            <FormulaAnimada key={`${tp.id}:${f.id}`} formula={f} />
          ))}
        </div>
      ),
    })
  const calculos = calculosDoTopico(tp.id)
  if (exercicios.length || demos.length || calculos.length)
    camadas.push({
      chave: 'pratica',
      rotulo: 'Praticar',
      convite: 'Bora praticar',
      conteudo: (
        <div className="space-y-3">
          {calculos.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-[var(--tinta-suave)]">Treino de cálculo: você responde cada passo e ele confere.</p>
              {calculos.map((c) => (
                <LinhaTreino key={c.id} c={c} compacta />
              ))}
            </div>
          )}
          {demos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {demos.map((d) =>
                d.externa ? (
                  <a key={d.id} href={d.url} target="_blank" rel="noreferrer" className="botao-suave">
                    {d.titulo} ↗
                  </a>
                ) : (
                  <button key={d.id} onClick={() => abrirDemo(d)} className="rounded-full bg-[var(--foco-claro)] px-3.5 py-1.5 text-sm font-medium text-[var(--foco)] hover:brightness-95">
                    ▶ {d.titulo}
                  </button>
                ),
              )}
            </div>
          )}
          {exercicios.length > 0 && (
            <ul className="space-y-1.5">
              {exercicios.map((ex) => (
                <ItemExercicio key={ex.id} ex={ex} abrirDemo={(id) => abrirDemo(DEMOS.find((d) => d.id === id)!)} />
              ))}
            </ul>
          )}
        </div>
      ),
    })
  if (temCartoes(tp.id))
    camadas.push({ chave: 'memoria', rotulo: 'Lembrar', convite: 'Testar minha memória', conteudo: <Lembrar id={tp.id} /> })
  if (c) camadas.push(resumo)
  return camadas
}

function Pilula({ id, rotulo }: { id: string; rotulo?: string }) {
  const selecionar = useMapa((s) => s.selecionar)
  const status = useStatus()(id)
  const tp = topicoPorId.get(id)!
  return (
    <button
      onClick={() => selecionar(id)}
      title={rotulo}
      className="flex max-w-full items-center gap-1.5 rounded-full border border-[var(--linha)] bg-[var(--cartao)] py-1 pl-1 pr-3 text-left text-sm text-[var(--tinta)] shadow-[var(--sombra)] transition-transform hover:-translate-y-0.5"
    >
      <span className="scale-[.7]">
        <IconeStatus status={status} cor={unidade(tp.unidade).cor} />
      </span>
      <span className="truncate">{tp.titulo}</span>
    </button>
  )
}

/** As conexões vistas de perto: o que vem antes, o que vem depois, o que se parece. */
function Vizinhanca({ tp }: { tp: TipoTopico }) {
  const antes = prereqsDe.get(tp.id)!
  const depois = dependentesDe.get(tp.id)!
  const parecidos = parecidosDe(tp.id)
  if (!antes.length && !depois.length && !parecidos.length) return null
  return (
    <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
      {antes.length > 0 && (
        <div>
          <div className="mb-1.5 text-xs text-[var(--tinta-suave)]">← vem antes (bom já saber)</div>
          <div className="flex flex-wrap gap-1.5">{antes.map((id) => <Pilula key={id} id={id} />)}</div>
        </div>
      )}
      {depois.length > 0 && (
        <div>
          <div className="mb-1.5 text-xs text-[var(--tinta-suave)]">abre caminho para →</div>
          <div className="flex flex-wrap gap-1.5">{depois.map((id) => <Pilula key={id} id={id} />)}</div>
        </div>
      )}
      {parecidos.length > 0 && (
        <div className="sm:col-span-2">
          <div className="mb-1.5 text-xs text-[var(--tinta-suave)]">≈ parecido com (cuidado para não confundir)</div>
          <ul className="space-y-1.5">
            {parecidos.map((c) => {
              const outro = c.de === tp.id ? c.para : c.de
              return (
                <li key={outro} className="flex flex-wrap items-center gap-2">
                  <Pilula id={outro} />
                  {c.nota && <span className="text-xs text-[var(--tinta-suave)]">{c.nota}</span>}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

export function Topico({ id }: { id: string }) {
  const tp = topicoPorId.get(id)!
  const u = unidade(tp.unidade)
  const { estudados, voltar, profundidade, mostrarExtras, aprofundar, alternarEstudado, alternarVoltar, selecionar } = useMapa()
  const [demo, setDemo] = useState<Demo | null>(null)
  const camadas = useMemo(() => montarCamadas(tp, setDemo), [tp, setDemo])
  // reabre até onde você já tinha chegado
  const [abertas, setAbertas] = useState(() => Math.min(camadas.length, (profundidade[id] ?? 0) + 1))
  const refs = useRef<(HTMLElement | null)[]>([])
  // pré-teste só na primeira vez que o tópico abre (decidido na montagem, antes de aprofundar() marcar a visita)
  const estudo = useMapa((s) => s.estudo)
  const pretestes = useMapa((s) => s.pretestes)
  const [chutando, setChutando] = useState(() => estudo.preteste && profundidade[id] === undefined && !pretestes[id] && pretestePara(id).length > 0)
  const [confirmarTudo, setConfirmarTudo] = useState(false)
  const { anterior, proximo } = vizinhosNaTrilha(id, mostrarExtras)
  const fim = abertas >= camadas.length
  // quanto mais fundo, mais a cor da unidade aparece no fundo da página
  const fundura = (abertas - 1) / Math.max(1, camadas.length - 1)

  useEffect(() => {
    aprofundar(id, abertas - 1)
  }, [id, abertas, aprofundar])

  const aprofundarUma = () => {
    const n = abertas
    setAbertas(n + 1)
    setTimeout(() => refs.current[n]?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }

  // o aviso de pausa leva para a camada "Lembrar" (ou para a cola, se o tópico não tiver cartões)
  const irParaLembrar = () => {
    const alvo = Math.max(0, camadas.findIndex((c) => c.chave === 'memoria'))
    const i = alvo || camadas.length - 1
    setAbertas((n) => Math.max(n, i + 1))
    setTimeout(() => refs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }

  // a cola é sempre a última camada
  const irParaCola = () => {
    setAbertas(camadas.length)
    setTimeout(() => refs.current[camadas.length - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }

  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, scale: 0.98, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="min-h-dvh transition-[background] duration-700"
      style={{ background: `linear-gradient(180deg, var(--papel) 0%, color-mix(in srgb, ${u.cor} ${4 + fundura * 14}%, var(--papel)) 100%)` }}
    >
      {/* barra de cima */}
      <header className="sticky top-0 z-20 border-b border-[var(--linha)] bg-[var(--papel)]/85 backdrop-blur" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="coluna-leitura mx-auto flex items-center gap-2 px-4 py-2.5 sm:px-6">
          <button className="botao-suave" onClick={() => selecionar(null)}>
            ← trilha
          </button>
          <span className="min-w-0 flex-1 truncate text-xs text-[var(--tinta-suave)]">
            {u.id.toUpperCase()} · {grupoPorId.get(tp.grupo)!.titulo}
          </span>
          <BotaoRelembrar />
          <BotaoAjustes />
          {/* régua de profundidade */}
          <span className="flex items-center gap-1" aria-label={`camada ${abertas} de ${camadas.length}`}>
            {camadas.map((c, i) => (
              <button
                key={c.chave}
                title={c.rotulo}
                onClick={() => i < abertas && refs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="h-2 rounded-full transition-all duration-500"
                style={{ width: i < abertas ? 18 : 8, background: i < abertas ? u.cor : 'var(--linha)' }}
              />
            ))}
          </span>
        </div>
      </header>

      <main className="coluna-leitura relative z-10 mx-auto px-4 pb-32 pt-8 sm:px-6">
        <div className="text-xs font-medium uppercase tracking-[0.16em]" style={{ color: u.cor }}>
          {u.titulo}
        </div>
        <h1 className="mt-1 text-3xl font-semibold leading-tight text-[var(--tinta-forte)] sm:text-4xl">{tp.titulo}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full px-2.5 py-0.5 font-medium" style={{ background: `color-mix(in srgb, ${u.cor} 14%, white)`, color: 'var(--tinta-forte)' }}>
            {NOME_NIVEL[tp.nivel]}
          </span>
          {tp.semSlide && <span className="rounded-full bg-[var(--papel-2)] px-2.5 py-0.5 text-[var(--tinta-suave)]">complementar (sem slide)</span>}
          {tp.naoVisto && <span className="rounded-full bg-[var(--papel-2)] px-2.5 py-0.5 text-[var(--tinta-suave)]">extra · não visto em aula</span>}
          <button
            onClick={() => alternarVoltar(id)}
            className={`ml-auto rounded-full px-2.5 py-0.5 ${voltar[id] ? 'bg-[var(--alerta-claro)] text-[var(--alerta)]' : 'text-[var(--tinta-suave)] hover:bg-[var(--papel-2)]'}`}
          >
            ⚑ {voltar[id] ? 'marcado para voltar' : 'voltar depois'}
          </button>
        </div>

        {/* durante o pré-teste, as palavras-chave e as ligações entregariam a resposta */}
        {!chutando && (
          <>
            <PalavrasFlutuantes id={id} cor={u.cor} />
            <AvisoRevisita id={id} irParaCola={irParaCola} />
            <Vizinhanca tp={tp} />
          </>
        )}

        {!chutando && <AvisoPausa key={id} irParaLembrar={irParaLembrar} />}
        {chutando && <Preteste id={id} terminar={() => setChutando(false)} />}

        {/* as camadas */}
        <div className={`mt-10 space-y-7 ${chutando ? 'hidden' : ''}`}>
          <AnimatePresence initial={false}>
            {camadas.slice(0, abertas).map((c, i) => (
              <motion.section
                key={c.chave}
                ref={(el) => {
                  refs.current[i] = el
                }}
                initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="scroll-mt-20 rounded-3xl border border-[var(--linha)] bg-[var(--cartao)] px-5 py-6 shadow-[var(--sombra)] sm:px-8 sm:py-8"
              >
                <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--tinta-suave)]">
                  <span className="grid h-5 w-5 place-items-center rounded-full text-[10px] text-white" style={{ background: u.cor }}>
                    {i + 1}
                  </span>
                  {c.rotulo}
                </div>
                {c.conteudo}
              </motion.section>
            ))}
          </AnimatePresence>
        </div>

        {/* aprofundar ou fechar */}
        <div className={`mt-6 ${chutando ? 'hidden' : ''}`}>
          {!fim ? (
            <div className="flex flex-col items-center">
              <button className="botao-foco" onClick={aprofundarUma}>
                {camadas[abertas].convite} ↓
              </button>
              {/* longe do botão principal e com confirmação: fácil de clicar sem querer */}
              <div className="mt-12 text-xs text-[var(--tinta-suave)]">
                {confirmarTudo ? (
                  <span className="flex flex-wrap items-center justify-center gap-2">
                    abrir as {camadas.length - abertas} camadas que faltam?
                    <button className="botao-suave" onClick={() => (setAbertas(camadas.length), setConfirmarTudo(false))}>
                      sim, abrir tudo
                    </button>
                    <button className="botao-suave" onClick={() => setConfirmarTudo(false)}>
                      não
                    </button>
                  </span>
                ) : (
                  <button className="hover:underline" onClick={() => setConfirmarTudo(true)}>
                    abrir tudo de uma vez
                  </button>
                )}
              </div>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-[var(--linha)] bg-[var(--cartao)] p-5 text-center shadow-[var(--sombra)]">
              <div className="text-sm text-[var(--tinta-suave)]">Chegou ao fundo. Como ficou?</div>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => alternarEstudado(id)}
                  className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                  style={estudados[id] ? { background: 'var(--menta)', color: '#fff' } : { background: 'var(--menta-claro)', color: 'var(--menta)' }}
                >
                  ✓ {estudados[id] ? 'entendi!' : 'entendi'}
                </button>
                <button
                  onClick={() => alternarVoltar(id)}
                  className="rounded-full px-4 py-2 text-sm font-semibold"
                  style={voltar[id] ? { background: 'var(--alerta)', color: '#fff' } : { background: 'var(--alerta-claro)', color: 'var(--alerta)' }}
                >
                  ⚑ ainda confuso, volto depois
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {tp.fontes.length > 0 && (
          <div className="mt-8 text-xs text-[var(--tinta-suave)]">
            Fonte: {tp.fontes.map((f) => `${f.arquivo}${f.paginas ? ` p. ${f.paginas}` : ''}`).join(' · ')}
          </div>
        )}

        {/* navegação na trilha */}
        <nav className="mt-10 grid grid-cols-2 gap-3">
          {anterior ? (
            <button onClick={() => selecionar(anterior.id)} className="rounded-2xl px-4 py-3 text-left hover:bg-[var(--cartao)]/70">
              <span className="block text-xs text-[var(--tinta-suave)]">← anterior</span>
              <span className="block truncate text-sm font-medium text-[var(--tinta)]">{anterior.titulo}</span>
            </button>
          ) : (
            <span />
          )}
          {proximo && (
            <button onClick={() => selecionar(proximo.id)} className="rounded-2xl bg-[var(--cartao)] px-4 py-3 text-right shadow-[var(--sombra)] hover:-translate-y-0.5 transition-transform">
              <span className="block text-xs text-[var(--tinta-suave)]">próximo na trilha →</span>
              <span className="block truncate text-sm font-semibold text-[var(--tinta-forte)]">{proximo.titulo}</span>
            </button>
          )}
        </nav>
      </main>

      <DemoModal demo={demo} fechar={() => setDemo(null)} />
      <Anotacao id={id} />
    </motion.div>
  )
}
