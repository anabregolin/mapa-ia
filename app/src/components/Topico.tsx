import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { DEMOS, demosDoTopico, exerciciosDoTopico } from '../content/exercicios'
import { EXPLICACOES } from '../content/explicacoes'
import { formulasDoTopico } from '../content/formulas'
import { grupoPorId, topicoPorId } from '../content/topicos'
import type { Camadas, Demo, Exercicio, Topico as TipoTopico } from '../content/tipos'
import { dependentesDe, parecidosDe, prereqsDe } from '../lib/grafo'
import { NOME_NIVEL, unidade, vizinhosNaTrilha } from '../lib/trilha'
import { useMapa } from '../store/useMapa'
import { DemoModal, ItemExercicio } from './Exercicio'
import { BotaoPomodoro } from './Pomodoro'
import { BotaoCalculadora } from './Calculadora'
import { RodapeFixo } from './RodapeFixo'
import { FormulaAnimada } from './FormulaAnimada'
import { pontuarItem, Texto, TextoLeitura } from './Texto'
import { BotoesPaineis } from './Ajustes'
import { FecharTopico, TesteAbertura } from './Teste'
import { Lembrar } from './Lembrar'
import { AvisoPausa, BotaoRelembrar } from './Relembrar'
import { chaveTeste, questoesPara } from '../lib/teste'
import { formatarTempo, useCronometro } from '../lib/tempo'
import { estimarTopico, explicarEstimativa, formatarEstimativa } from '../lib/estimativa'
import { LinhaTreino } from './Treino'
import { Anotacao, AvisoRevisita, BotaoAnotar, PalavrasChave, temCartoes } from './Ferramentas'
import { palavrasDoTopico } from '../content/palavras'
import { calculosDoTopico } from '../content/calculos'
import { useStatus } from './Trilha'
import { CAMADAS_MARCAVEIS, Marcador } from './Marcas'
import { AbasDoTopico } from './Abas'
import { SlidesNoTexto } from './Slides'
import { FiguraDoTopico } from './Figuras'
import { Dica, DicaEstimativa } from './Dica'
import { Expande } from './Abrir'

interface Camada {
  chave: string
  /** nome curto na régua de profundidade */
  rotulo: string
  /** frase do botão que abre esta camada */
  convite: string
  conteudo: ReactNode
  /** vem depois do texto, fora da área de marcar (slides, exercício) */
  depois?: ReactNode
}

/** A abertura do tópico: o que é, pra que serve e onde é usado. Fica sempre no topo, fora da contagem das partes
 * (o progresso guarda o número da parte; uma parte a mais na frente embaralharia o que já foi lido). */
function OQueE({ c, cor }: { c: NonNullable<Camadas['oQueE']>; cor: string }) {
  return (
    <section className="rounded-3xl border border-[var(--linha)] bg-[var(--cartao)] px-5 py-6 shadow-[var(--sombra)] sm:px-8 sm:py-8">
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--tinta-suave)]">
        <span className="grid h-5 w-5 place-items-center rounded-full text-[10px] text-white" style={{ background: cor }}>
          1
        </span>
        O que é
      </div>
      <div data-marcavel="oque" className="space-y-4">
        <TextoLeitura className="text-[var(--tinta-forte)]">{c.e}</TextoLeitura>
        {/* um embaixo do outro: lado a lado as caixas ficavam estreitas demais para ler */}
        <CaixaOQueE rotulo="Pra que serve" cor={cor}>
          <TextoLeitura className="text-[0.95em] text-[var(--tinta-forte)]">{c.serve}</TextoLeitura>
        </CaixaOQueE>
        <CaixaOQueE rotulo="Onde é usado" cor={cor}>
          <Exemplos itens={c.onde} />
          {c.aviso && <p className="mt-2 text-sm italic text-[var(--tinta-suave)]">{c.aviso}</p>}
        </CaixaOQueE>
      </div>
    </section>
  )
}

function CaixaOQueE({ rotulo, cor, children }: { rotulo: string; cor: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-[var(--papel-2)] px-4 py-3 sm:px-5">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: cor }}>
        {rotulo}
      </div>
      {children}
    </div>
  )
}

const maiuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Um exemplo por tópico. Com "Setas: em coluna", "Prever preço → supervisionado" vira passos com ↓ (no lado escolhido). */
function Exemplos({ itens }: { itens: string[] }) {
  const { formulas, setas } = useMapa((s) => s.leitura)
  return (
    <ul
      className={`fonte-leitura lista-leitura !mt-0 text-[0.95em] text-[var(--tinta-forte)] ${setas === 'vertical' && itens.some((i) => i.includes(' → ')) ? 'lista-cadeias' : ''}`}
    >
      {itens.map((bruto, n) => {
        const item = pontuarItem(bruto, n === itens.length - 1)
        const passos = item.split(/\s+→\s+/)
        return (
          <li key={item}>
            {setas === 'vertical' && passos.length > 1 ? (
              <ol className="cadeia-setas !mt-0">
                {passos.map((p) => (
                  <li key={p}>
                    <Texto formulas={formulas}>{maiuscula(p)}</Texto>
                  </li>
                ))}
              </ol>
            ) : (
              <Texto formulas={formulas}>{item}</Texto>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** "Tente agora": um ou dois exercícios da lista no meio do estudo, antes da pegadinha e das fórmulas */
function TenteAgora({ exercicios, abrirDemo }: { exercicios: Exercicio[]; abrirDemo: (d: Demo) => void }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-[var(--linha)] bg-[var(--papel)] p-4">
      <div className="rotulo-formula mb-1">✍️ Tente agora</div>
      <p className="mb-3 text-sm text-[var(--tinta-suave)]">
        {exercicios.length > 1 ? 'Exercícios' : 'Um exercício'} da lista sobre o que você acabou de ler. Tente antes de abrir a resposta.
      </p>
      <ul className="space-y-1.5">
        {exercicios.map((ex) => (
          <ItemExercicio key={ex.id} ex={ex} abrirDemo={(id) => abrirDemo(DEMOS.find((d) => d.id === id)!)} />
        ))}
      </ul>
    </div>
  )
}

// contarCamadas (lib/camadas.ts) repete estas regras para o "% visto" da trilha: mudou aqui, muda lá.
function montarCamadas(tp: TipoTopico, abrirDemo: (d: Demo) => void): Camada[] {
  const c = EXPLICACOES[tp.id]
  const formulas = formulasDoTopico(tp.id)
  const todosExercicios = exerciciosDoTopico(tp.id)
  const demos = demosDoTopico(tp.id)
  const calculos = calculosDoTopico(tp.id)
  // até dois exercícios com enunciado vão para o meio do texto; saem do "Praticar" só se lá sobrar alguma coisa
  const tente = c ? todosExercicios.filter((e) => e.enunciado).slice(0, 2) : []
  const resto = todosExercicios.filter((e) => !tente.includes(e))
  const exercicios = resto.length || demos.length || calculos.length ? resto : todosExercicios
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
      {
        chave: 'intuicao',
        rotulo: 'Pensa assim',
        convite: '',
        conteudo: (
          <>
            <TextoLeitura>{c.intuicao}</TextoLeitura>
            <FiguraDoTopico id={tp.id} camada="intuicao" />
          </>
        ),
      },
      {
        chave: 'definicao',
        rotulo: 'Com o nome certo',
        convite: 'Agora com as palavras da prova',
        conteudo: (
          <>
            <TextoLeitura>{c.definicao}</TextoLeitura>
            <FiguraDoTopico id={tp.id} camada="definicao" />
          </>
        ),
        depois: <SlidesNoTexto id={tp.id} />,
      },
      {
        chave: 'detalhe',
        rotulo: 'Mergulho',
        convite: 'Quero o detalhe técnico',
        conteudo: (
          <>
            <TextoLeitura>{c.detalhe}</TextoLeitura>
            <FiguraDoTopico id={tp.id} camada="detalhe" />
          </>
        ),
        depois: tente.length > 0 && <TenteAgora exercicios={tente} abrirDemo={abrirDemo} />,
      },
    )
    if (c.cuidado)
      camadas.push({
        chave: 'cuidado',
        rotulo: 'Pegadinha',
        convite: 'Onde as pessoas erram na prova?',
        conteudo: <TextoLeitura className="rounded-2xl bg-[var(--alerta-claro)] px-4 py-3 text-[var(--tinta-forte)]">{c.cuidado}</TextoLeitura>,
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
                  <button
                    key={d.id}
                    onClick={() => abrirDemo(d)}
                    className="rounded-full bg-[var(--foco-claro)] px-3.5 py-1.5 text-sm font-medium text-[var(--foco)] hover:brightness-95"
                  >
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
  if (temCartoes(tp.id)) camadas.push({ chave: 'memoria', rotulo: 'Lembrar', convite: 'Testar minha memória', conteudo: <Lembrar id={tp.id} /> })
  if (c) camadas.push(resumo)
  return camadas
}

/** Um tópico ligado a este: bolinha de status + nome. Clicar abre o tópico. */
function Pilula({ id }: { id: string }) {
  const selecionar = useMapa((s) => s.selecionar)
  const status = useStatus()(id)
  const tp = topicoPorId.get(id)!
  const cor = unidade(tp.unidade).cor
  return (
    <button
      onClick={() => selecionar(id)}
      title={status === 'entendi' ? 'você já entendeu este' : 'ainda não marcado como entendido'}
      className="inline-flex max-w-full items-center gap-2 rounded-xl bg-[var(--papel-2)] px-3 py-1.5 text-left text-sm text-[var(--tinta-forte)] transition-colors hover:bg-[var(--linha)]"
    >
      {status === 'entendi' ? (
        <span className="text-xs font-bold text-[var(--menta)]" aria-label="entendido">
          ✓
        </span>
      ) : (
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={
            status === 'novo'
              ? { boxShadow: 'inset 0 0 0 1.5px var(--tinta-suave)' }
              : { background: `conic-gradient(${cor} 0 50%, transparent 50% 100%)`, boxShadow: `inset 0 0 0 1.5px ${cor}` }
          }
          aria-hidden
        />
      )}
      <span className="truncate">{tp.titulo}</span>
    </button>
  )
}

/** Uma linha da ficha: rótulo à esquerda (em cima, no celular) e o conteúdo ao lado. */
function LinhaFicha({ rotulo, children, empilhada = false }: { rotulo: ReactNode; children: ReactNode; empilhada?: boolean }) {
  return (
    <div className={`grid gap-1.5 py-3 first:pt-0 last:pb-0 ${empilhada ? '' : 'sm:grid-cols-[10.5rem_1fr] sm:gap-4'}`}>
      <div className={`text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--tinta-suave)] ${empilhada ? '' : 'sm:pt-2'}`}>{rotulo}</div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/** Tela larga o bastante para a coluna lateral do tópico (xl do Tailwind). */
function useTelaLarga() {
  const consulta = '(min-width: 1280px)'
  const [larga, setLarga] = useState(() => window.matchMedia(consulta).matches)
  useEffect(() => {
    const m = window.matchMedia(consulta)
    const mudar = () => setLarga(m.matches)
    m.addEventListener('change', mudar)
    return () => m.removeEventListener('change', mudar)
  }, [])
  return larga
}

/** Nível, status, tempo e abas: o que o tópico é e o que você já fez com ele. */
function DadosTopico({ tp, cor }: { tp: TipoTopico; cor: string }) {
  const status = useStatus()(tp.id)
  const voltar = useMapa((s) => !!s.voltar[tp.id])
  const alternarVoltar = useMapa((s) => s.alternarVoltar)
  const ms = useMapa((s) => s.tempo[tp.id]?.ms ?? 0)
  const estimativa = estimarTopico(tp.id)
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-xs">
      <span
        className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium text-[var(--tinta-forte)]"
        style={{ background: `color-mix(in srgb, ${cor} 14%, var(--cartao))` }}
      >
        <span className="flex gap-0.5" aria-hidden>
          {[1, 2, 3].map((n) => (
            <span key={n} className="h-1.5 w-1.5 rounded-full" style={{ background: n <= tp.nivel ? cor : 'var(--linha)' }} />
          ))}
        </span>
        {NOME_NIVEL[tp.nivel]}
      </span>
      <span className={`rounded-full px-2.5 py-0.5 ${status === 'entendi' ? 'bg-[var(--menta-claro)] text-[var(--menta)]' : 'bg-[var(--papel-2)] text-[var(--tinta-suave)]'}`}>
        {status === 'entendi' ? '✓ entendido' : status === 'voltar' ? '⚑ para voltar' : status === 'andamento' ? '◐ em andamento' : '○ primeira vez'}
      </span>
      {tp.semSlide && <span className="rounded-full bg-[var(--papel-2)] px-2.5 py-0.5 text-[var(--tinta-suave)]">complementar (sem slide)</span>}
      {tp.naoVisto && <span className="rounded-full bg-[var(--papel-2)] px-2.5 py-0.5 text-[var(--tinta-suave)]">extra · não visto em aula</span>}
      <Dica
        className="cursor-help px-1 tabular-nums text-[var(--tinta-suave)]"
        texto={<DicaEstimativa e={estimativa} extra={ms >= 60_000 ? ['você já estudou aqui', formatarTempo(ms)] : undefined} />}
      >
        ⏲ {ms >= 60_000 ? `${formatarTempo(ms)} de ${formatarEstimativa(estimativa.min).replace('≈ ', '≈')}` : `${formatarEstimativa(estimativa.min)} de estudo`}
        <span className="sr-only">
          : {explicarEstimativa(estimativa)}
          {ms >= 60_000 ? `. Você já estudou ${formatarTempo(ms)} aqui.` : ''}
        </span>
      </Dica>
      <AbasDoTopico id={tp.id} />
      <button
        onClick={() => alternarVoltar(tp.id)}
        className={`rounded-full px-2.5 py-0.5 ${voltar ? 'bg-[var(--alerta-claro)] text-[var(--alerta)]' : 'text-[var(--tinta-suave)] hover:bg-[var(--papel-2)]'}`}
      >
        ⚑ {voltar ? 'marcado para voltar' : 'voltar depois'}
      </button>
    </div>
  )
}

/** De que tópicos este depende e quantos ainda não foram entendidos. */
function usePrereqs(id: string) {
  const st = useStatus()
  const antes = prereqsDe.get(id)!
  return { antes, faltam: antes.filter((p) => st(p) !== 'entendi') }
}

/**
 * Sobre o tópico: dados, palavras-chave, ligações com o resto da trilha e a fonte.
 * Fica fora do texto: recolhido abaixo do título (tela estreita) ou na coluna da direita (tela larga).
 * `lateral` = na coluna da direita: estreita, e as palavras só aparecem com "palavras-chave sempre à vista" ligado.
 */
function SobreTopico({ tp, cor, lateral = false }: { tp: TipoTopico; cor: string; lateral?: boolean }) {
  const palavrasAVista = useMapa((s) => s.palavrasFlutuantes)
  const { antes, faltam } = usePrereqs(tp.id)
  const depois = dependentesDe.get(tp.id)!
  const parecidos = parecidosDe(tp.id)
  const temPalavras = palavrasDoTopico(tp.id).length > 0
  // as ligações ficam recolhidas numa linha; abrem sozinhas só quando falta entender algo de que este depende
  const [aberta, setAberta] = useState(faltam.length > 0)
  const resumo = [
    antes.length ? `depende de ${antes.length}` : 'não depende de nada',
    depois.length ? `abre caminho para ${depois.length}` : '',
    parecidos.length ? `parecido com ${parecidos.length}` : '',
  ].filter(Boolean)
  return (
    <section
      className={`divide-y divide-[var(--linha)] rounded-3xl border border-[var(--linha)] bg-[var(--cartao)] py-1 shadow-[var(--sombra)] ${lateral ? 'px-4' : 'px-5 sm:px-6'}`}
      aria-label="sobre este tópico"
    >
      <div className="py-3">
        <DadosTopico tp={tp} cor={cor} />
      </div>
      {temPalavras && (!lateral || palavrasAVista) && (
        <div className="py-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--tinta-suave)]">Palavras-chave</div>
          <PalavrasChave id={tp.id} cor={cor} />
        </div>
      )}
      <div className="py-1.5">
        <button className="flex w-full items-center gap-2 py-1.5 text-left text-sm" onClick={() => setAberta(!aberta)} aria-expanded={aberta}>
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--tinta-suave)]">Ligações</span>
          <span className="min-w-0 flex-1 truncate text-[var(--tinta)]">
            {!lateral && resumo.join(' · ')}
            {faltam.length > 0 && (
              <span className="text-[var(--coral)]">
                {lateral ? '' : ' · '}falta{faltam.length > 1 ? 'm' : ''} {faltam.length}
              </span>
            )}
          </span>
          <span className={`text-[var(--tinta-suave)] transition-transform ${aberta ? 'rotate-90' : ''}`} aria-hidden>
            ▸
          </span>
        </button>
        <Expande aberto={aberta}>
          <div className="divide-y divide-[var(--linha)] pb-2 pt-2">
            <LinhaFicha rotulo="Depende de" empilhada={lateral}>
              {antes.length ? (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    {antes.map((id) => (
                      <Pilula key={id} id={id} />
                    ))}
                  </div>
                  <p className={`mt-2 text-xs ${faltam.length ? 'text-[var(--coral)]' : 'text-[var(--menta)]'}`}>
                    {!faltam.length
                      ? 'Você já entendeu tudo de que este tópico depende.'
                      : antes.length === 1
                        ? 'Ainda não marcado como entendido. Dá para seguir, mas ele ajuda a entender este.'
                        : `${antes.length - faltam.length} de ${antes.length} marcados como entendidos. Dá para seguir, mas os que faltam ajudam a entender este.`}
                  </p>
                </>
              ) : (
                <p className={`text-sm text-[var(--tinta)] ${lateral ? '' : 'sm:pt-1.5'}`}>Nada: dá para começar por aqui.</p>
              )}
            </LinhaFicha>
            {depois.length > 0 && (
              <LinhaFicha rotulo="Abre caminho para" empilhada={lateral}>
                <div className="flex flex-wrap gap-1.5">
                  {depois.map((id) => (
                    <Pilula key={id} id={id} />
                  ))}
                </div>
              </LinhaFicha>
            )}
            {parecidos.length > 0 && (
              <LinhaFicha
                empilhada={lateral}
                rotulo={
                  <>
                    Parecido com <span className="block font-normal normal-case tracking-normal">não confundir</span>
                  </>
                }
              >
                <ul className="space-y-2">
                  {parecidos.map((c) => {
                    const outro = c.de === tp.id ? c.para : c.de
                    return (
                      <li key={outro} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Pilula id={outro} />
                        {c.nota && <span className="text-xs text-[var(--tinta-suave)]">{c.nota}</span>}
                      </li>
                    )
                  })}
                </ul>
              </LinhaFicha>
            )}
          </div>
        </Expande>
      </div>
      {tp.fontes.length > 0 && (
        <p className="py-3 text-xs text-[var(--tinta-suave)]">
          📄 Fonte:{' '}
          {tp.fontes.map((f, i) => (
            <span key={f.arquivo + f.paginas}>
              {i > 0 && ' · '}
              <span className="text-[var(--tinta)]">{f.arquivo.replace(/-/g, ' ')}</span>
              {f.paginas ? `, p. ${f.paginas}` : ''}
            </span>
          ))}
        </p>
      )}
    </section>
  )
}

/** Tela estreita: só uma linha abaixo do título; o "sobre" abre ali mesmo. */
function SobreRecolhido({ tp, cor }: { tp: TipoTopico; cor: string }) {
  const [aberto, setAberto] = useState(false)
  const { faltam } = usePrereqs(tp.id)
  return (
    <div className="mt-3">
      <button
        className="flex items-center gap-1.5 rounded-full py-1 text-xs text-[var(--tinta-suave)] hover:text-[var(--tinta-forte)]"
        onClick={() => setAberto(!aberto)}
        aria-expanded={aberto}
      >
        <span className={`transition-transform ${aberto ? 'rotate-90' : ''}`} aria-hidden>
          ▸
        </span>
        Sobre este tópico
        {faltam.length > 0 && !aberto && (
          <span className="text-[var(--coral)]">
            · falta{faltam.length > 1 ? 'm' : ''} {faltam.length} antes dele
          </span>
        )}
      </button>
      <Expande aberto={aberto}>
        <div className="mt-2">
          <SobreTopico tp={tp} cor={cor} />
        </div>
      </Expande>
    </div>
  )
}

/**
 * Rodapé fixo do tópico, como o cabeçalho: pomodoro, a troca de conteúdo (próxima camada ou, no fim, próximo tópico) e a anotação.
 * Publica a própria altura em --rodape-fixo para as janelinhas flutuantes e avisos ficarem acima dele.
 */
/** Rodapé do tópico: ferramentas à esquerda e ← → para trocar de tópico. Abrir a próxima parte fica no fim do texto. */
function RodapeTopico({
  id,
  fim,
  anterior,
  proximo,
}: {
  id: string
  /** chegou à última parte: o → ganha a cor da unidade */ fim: boolean
  anterior?: TipoTopico
  proximo?: TipoTopico
}) {
  const selecionar = useMapa((s) => s.selecionar)
  return (
    <RodapeFixo rotulo="rodapé do tópico" largura="max-w-[var(--leitura-largura,42rem)] xl:max-w-[calc(var(--leitura-largura,42rem)+21rem)]">
      <BotaoPomodoro />
      <BotaoCalculadora />
      <span className="flex-1" />
      <span className="flex shrink-0 items-center gap-1.5">
        <button
          className="botao-suave disabled:opacity-40"
          disabled={!anterior}
          onClick={() => anterior && selecionar(anterior.id)}
          title={anterior ? `tópico anterior: ${anterior.titulo}` : 'este é o primeiro tópico'}
          aria-label={anterior ? `tópico anterior: ${anterior.titulo}` : 'não há tópico anterior'}
        >
          ← <span className="hidden sm:inline">anterior</span>
        </button>
        <button
          className={`disabled:opacity-40 ${fim && proximo ? 'rounded-full px-3.5 py-1.5 text-sm font-semibold text-white' : 'botao-suave'}`}
          style={fim && proximo ? { background: unidade(proximo.unidade).cor } : undefined}
          disabled={!proximo}
          onClick={() => proximo && selecionar(proximo.id)}
          title={proximo ? `próximo tópico: ${proximo.titulo}` : 'último tópico da trilha'}
          aria-label={proximo ? `próximo tópico: ${proximo.titulo}` : 'não há próximo tópico'}
        >
          <span className="hidden sm:inline">próximo</span> →
        </button>
      </span>
      <BotaoAnotar id={id} />
    </RodapeFixo>
  )
}

/** Fim do texto aberto até agora: o convite para descer mais uma parte. */
function AbrirProxima({ convite, rotulo, n, total, cor, abrir }: { convite: string; rotulo: string; n: number; total: number; cor: string; abrir: () => void }) {
  return (
    <div className="mt-7 flex justify-center">
      <button
        onClick={abrir}
        className="group flex max-w-full flex-col items-center gap-2 rounded-3xl px-6 py-3 text-center transition-colors hover:bg-[var(--cartao)]/70 focus-visible:bg-[var(--cartao)]/70"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--tinta-suave)]">
          parte {n} de {total} · {rotulo}
        </span>
        <span className="text-base font-semibold text-[var(--tinta-forte)]">{convite}</span>
        <span
          className="grid h-10 w-10 place-items-center rounded-full text-lg text-white shadow-[var(--sombra)] transition-transform group-hover:translate-y-0.5"
          style={{ background: cor }}
          aria-hidden
        >
          ↓
        </span>
      </button>
    </div>
  )
}

export function Topico({ id }: { id: string }) {
  const tp = topicoPorId.get(id)!
  const u = unidade(tp.unidade)
  const { estudados, voltar, profundidade, mostrarExtras, aprofundar, alternarEstudado, alternarVoltar, selecionar } = useMapa()
  const [demo, setDemo] = useState<Demo | null>(null)
  const camadas = useMemo(() => montarCamadas(tp, setDemo), [tp, setDemo])
  // a abertura "o que é" aparece como parte 1, sempre aberta; só a numeração na tela anda uma casa
  const oQueE = EXPLICACOES[id]?.oQueE
  const extra = oQueE ? 1 : 0
  // reabre até onde você já tinha chegado
  const [abertas, setAbertas] = useState(() => Math.min(camadas.length, (profundidade[id] ?? 0) + 1))
  const refs = useRef<(HTMLElement | null)[]>([])
  const textoRef = useRef<HTMLDivElement>(null)
  // pré-teste só na primeira vez que o tópico abre (decidido na montagem, antes de aprofundar() marcar a visita)
  const estudo = useMapa((s) => s.estudo)
  const pretestes = useMapa((s) => s.pretestes)
  const testes = useMapa((s) => s.testes)
  useCronometro(id)
  const larga = useTelaLarga()
  const [chutando, setChutando] = useState(
    () => estudo.preteste && profundidade[id] === undefined && !pretestes[id] && !testes[chaveTeste('abertura', id)] && questoesPara(id, 0).some((q) => q.tipo !== 'aberta'),
  )
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
    const alvo = Math.max(
      0,
      camadas.findIndex((c) => c.chave === 'memoria'),
    )
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
        <div className="mx-auto flex items-center gap-2 px-4 py-2.5 sm:px-6 max-w-[var(--leitura-largura,42rem)] xl:max-w-[calc(var(--leitura-largura,42rem)+21rem)]">
          <button className="botao-suave" onClick={() => selecionar(null)}>
            ← trilha
          </button>
          <span className="min-w-0 flex-1 truncate text-xs text-[var(--tinta-suave)]">
            {u.id.toUpperCase()} · {grupoPorId.get(tp.grupo)!.titulo}
          </span>
          <BotaoRelembrar />
          <BotoesPaineis className="botao-suave relative !px-2.5" />
        </div>
        {/* régua de profundidade: uma faixa por camada */}
        <div className="mx-auto flex items-center gap-2 px-4 pb-2 sm:px-6 max-w-[var(--leitura-largura,42rem)] xl:max-w-[calc(var(--leitura-largura,42rem)+21rem)]">
          <span className="flex flex-1 gap-1" aria-label={`camada ${abertas + extra} de ${camadas.length + extra}`}>
            {oQueE && (
              <button
                title="O que é"
                aria-label="O que é"
                onClick={() => textoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="h-1.5 flex-1 rounded-full"
                style={{ background: u.cor }}
              />
            )}
            {camadas.map((c, i) => (
              <button
                key={c.chave}
                title={c.rotulo}
                aria-label={c.rotulo}
                disabled={i >= abertas}
                onClick={() => refs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="h-1.5 flex-1 rounded-full transition-colors duration-500"
                style={{ background: i < abertas ? u.cor : 'var(--linha)' }}
              />
            ))}
          </span>
          <span className="shrink-0 text-[10px] tabular-nums text-[var(--tinta-suave)]">
            {abertas + extra}/{camadas.length + extra}
          </span>
        </div>
      </header>

      {/* tela larga: o texto fica na largura escolhida e a ficha vai para uma coluna à direita, que acompanha a rolagem */}
      <div
        className={`mx-auto px-4 pb-16 pt-8 sm:px-6 max-w-[var(--leitura-largura,42rem)] xl:max-w-[calc(var(--leitura-largura,42rem)+21rem)] xl:grid xl:grid-cols-[minmax(0,1fr)_18rem] xl:gap-10`}
      >
        <main className="relative z-10 min-w-0">
          <div className="text-xs font-medium uppercase tracking-[0.16em]" style={{ color: u.cor }}>
            {u.titulo}
          </div>
          <h1 className="mt-1 text-3xl font-semibold leading-tight text-[var(--tinta-forte)] sm:text-4xl">{tp.titulo}</h1>

          {/* nível, tempo, palavras-chave e ligações não são o tópico: ficam recolhidos aqui ou na coluna da direita.
            Durante o pré-teste, as palavras-chave e as ligações entregariam a resposta. */}
          {!chutando && !larga && <SobreRecolhido tp={tp} cor={u.cor} />}
          {!chutando && <AvisoRevisita id={id} irParaCola={irParaCola} />}

          {!chutando && <AvisoPausa key={id} irParaLembrar={irParaLembrar} />}
          {chutando && <TesteAbertura id={id} terminar={() => setChutando(false)} />}

          {/* as camadas */}
          <div ref={textoRef} className={`mt-10 scroll-mt-20 space-y-7 ${chutando ? 'hidden' : ''}`}>
            {oQueE && <OQueE c={oQueE} cor={u.cor} />}
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
                      {i + 1 + extra}
                    </span>
                    {c.rotulo}
                  </div>
                  <div data-marcavel={CAMADAS_MARCAVEIS.has(c.chave) ? c.chave : undefined}>{c.conteudo}</div>
                  {c.depois}
                </motion.section>
              ))}
            </AnimatePresence>
          </div>

          {/* a próxima parte abre por aqui, logo abaixo do que você acabou de ler */}
          {!fim && !chutando && (
            <AbrirProxima
              convite={camadas[abertas].convite || 'Continuar'}
              rotulo={camadas[abertas].rotulo}
              n={abertas + 1 + extra}
              total={camadas.length + extra}
              cor={u.cor}
              abrir={aprofundarUma}
            />
          )}

          {/* o fim: o teste de fechar e o "como ficou?" (o próximo tópico fica no → do rodapé) */}
          {fim && !chutando && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-3xl border border-[var(--linha)] bg-[var(--cartao)] p-5 text-center shadow-[var(--sombra)]"
            >
              <FecharTopico id={id} />
              <div className="mt-5 text-sm text-[var(--tinta-suave)]">Chegou ao fundo. Como ficou?</div>
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
        </main>

        {larga && !chutando && (
          <aside className="relative z-10" aria-label="ao lado do texto">
            <div className="sticky top-24 max-h-[calc(100dvh-7rem)] space-y-4 overflow-y-auto pb-4 [scrollbar-width:thin]">
              <SobreTopico tp={tp} cor={u.cor} lateral />
            </div>
          </aside>
        )}
      </div>

      <RodapeTopico id={id} fim={fim && !chutando} anterior={anterior} proximo={proximo} />
      <DemoModal demo={demo} fechar={() => setDemo(null)} />
      <Anotacao id={id} />
      <Marcador topico={id} raiz={textoRef} />
    </motion.div>
  )
}
