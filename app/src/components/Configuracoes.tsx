// Página de Configurações: uma página só, larga e com respiro, em vez da gaveta lateral com abas.
// Tudo fica à vista numa rolagem: Leitura, Estudo, Marca-texto e Dados. O índice no topo acompanha
// a rolagem e leva a cada parte. Em tela larga, o título de cada parte fica parado à esquerda e,
// em Leitura, a prévia do texto fica presa no alto enquanto você mexe nas opções.
import { motion } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ENTRELINHAS, FONTES, LARGURAS, PARAGRAFOS, TAMANHOS, type Fonte } from '../lib/leitura'
import { NUVEM_CONFIGURADA } from '../lib/nuvem'
import { ATIVIDADES_PADRAO, POMODORO_PADRAO } from '../lib/pomodoro'
import { SECOES_CONFIG, type SecaoConfig } from '../lib/configuracoes'
import { voltarDasPaginas } from '../lib/paineis'
import { escreverIntervalos } from '../lib/revisita'
import { MAX_QUESTOES, useMapa } from '../store/useMapa'
import { AjustesBackup } from './Backup'
import { EditarCores } from './Marcas'
import { AjustesNuvem } from './Nuvem'
import { TextoLeitura } from './Texto'

const EXEMPLO =
  'A busca gulosa olha só para a estimativa $h(n)$ até o objetivo, enquanto o A* soma as duas: $f(n) = g(n) + h(n)$. Por isso a gulosa é rápida, mas pode escolher um caminho mais caro. Na Romênia ela acha Arad → Sibiu → Fagaras → Bucharest. Ela tem três características: **é rápida**; **não garante o melhor caminho**; **pode ficar presa em laços**.'

/* ───────────── peças ───────────── */

const suave = 'text-[13px] leading-snug text-[var(--tinta-suave)]'

/** Um grupo de linhas num cartão, com um título pequeno em cima. */
function Grupo({ titulo, nota, children }: { titulo: string; nota?: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="px-1 text-sm font-semibold text-[var(--tinta-forte)]">{titulo}</h3>
      {nota && <p className={`mt-0.5 px-1 ${suave}`}>{nota}</p>}
      <div className="mt-2 divide-y divide-[var(--linha)] rounded-2xl bg-[var(--cartao)] px-4 shadow-[var(--sombra)] ring-1 sm:px-5 ring-[var(--linha)]">{children}</div>
    </div>
  )
}

function Rotulo({ titulo, nota, id }: { titulo: ReactNode; nota?: ReactNode; id?: string }) {
  return (
    <span className="block min-w-0">
      <span id={id} className="block text-[15px] font-medium text-[var(--tinta-forte)]">
        {titulo}
      </span>
      {nota && <span className={`mt-0.5 block ${suave}`}>{nota}</span>}
    </span>
  )
}

/** Nome à esquerda, controle à direita. Em tela estreita (ou com `bloco`), o controle desce. */
function Linha({ titulo, nota, children, bloco = false }: { titulo: ReactNode; nota?: ReactNode; children: ReactNode; bloco?: boolean }) {
  const [id] = useState(() => `cfg-${Math.random().toString(36).slice(2, 8)}`)
  return (
    <div role="group" aria-labelledby={id} className={`flex flex-col gap-3 py-4 ${bloco ? '' : 'sm:flex-row sm:items-center sm:justify-between sm:gap-8'}`}>
      <Rotulo id={id} titulo={titulo} nota={nota} />
      <div className={bloco ? '' : 'sm:shrink-0'}>{children}</div>
    </div>
  )
}

/** Escolha de uma opção num trilho só: a escolhida fica em branco, destacada. */
function Opcoes<T extends string | number>({
  valor,
  opcoes,
  mudar,
  grade = false,
}: {
  valor: T
  opcoes: { valor: T; nome: ReactNode; titulo?: string }[]
  mudar: (v: T) => void
  /** no celular, em duas colunas (nomes compridos que não cabem numa linha) */
  grade?: boolean
}) {
  return (
    // no celular ocupa a largura toda, cada opção do mesmo tamanho; da tela média em diante, só o necessário
    <div className={`gap-1 rounded-xl bg-[var(--papel-2)] p-1 sm:inline-flex ${grade ? 'grid grid-cols-2' : 'flex'}`}>
      {opcoes.map((o) => {
        const sel = valor === o.valor
        return (
          <button
            key={String(o.valor)}
            title={o.titulo}
            aria-pressed={sel}
            onClick={() => mudar(o.valor)}
            className={`min-h-9 min-w-10 flex-1 whitespace-nowrap rounded-lg px-2.5 text-sm sm:flex-none sm:px-3 transition-[background,color,box-shadow] ${
              sel ? 'bg-[var(--cartao)] font-semibold text-[var(--foco)] shadow-[0_1px_3px_rgba(36,34,44,.14)]' : 'text-[var(--tinta)] hover:bg-[var(--cartao)]/60'
            }`}
          >
            {o.nome}
          </button>
        )
      })}
    </div>
  )
}

function Interruptor({ ligada }: { ligada: boolean }) {
  return (
    <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${ligada ? 'bg-[var(--menta)]' : 'bg-[var(--linha)]'}`} aria-hidden>
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-[left] ${ligada ? 'left-[22px]' : 'left-0.5'}`} />
    </span>
  )
}

/** A linha inteira liga e desliga. */
function LinhaChave({ titulo, nota, ligada, mudar }: { titulo: ReactNode; nota?: ReactNode; ligada: boolean; mudar: () => void }) {
  return (
    <button role="switch" aria-checked={ligada} onClick={mudar} className="flex w-full items-center justify-between gap-6 py-4 text-left">
      <Rotulo titulo={titulo} nota={nota} />
      <Interruptor ligada={ligada} />
    </button>
  )
}

/** − número + : sem digitar, sem vírgula. */
function Passos({
  valor,
  min,
  max,
  passo = 1,
  mudar,
  unidade,
  rotulo,
}: {
  valor: number
  min: number
  max: number
  passo?: number
  mudar: (v: number) => void
  unidade: string
  rotulo: string
}) {
  const botao = 'grid h-9 w-9 place-items-center rounded-full bg-[var(--papel-2)] text-lg text-[var(--tinta)] hover:bg-[var(--linha)] disabled:opacity-40'
  return (
    <div className="flex items-center gap-2" role="group" aria-label={rotulo}>
      <button className={botao} disabled={valor <= min} onClick={() => mudar(Math.max(min, valor - passo))} aria-label={`menos ${rotulo}`}>
        −
      </button>
      <span className="min-w-[5.5rem] text-center text-sm tabular-nums text-[var(--tinta-suave)]" aria-live="polite">
        <strong className="text-lg text-[var(--tinta-forte)]">{valor}</strong> {unidade}
      </span>
      <button className={botao} disabled={valor >= max} onClick={() => mudar(Math.min(max, valor + passo))} aria-label={`mais ${rotulo}`}>
        +
      </button>
    </div>
  )
}

const nomeIntervalo = (d: number) => (Number.isInteger(d) ? `${d} ${d === 1 ? 'dia' : 'dias'}` : `${Math.round(d * 24 * 10) / 10} h`)
const PADRAO_INTERVALOS = [1, 3, 7, 14, 30]

/** Voltas depois de estudar: cada uma é um chip; adiciona com − +, remove com ×. */
function EditorIntervalos() {
  const intervalos = useMapa((s) => s.estudo.intervalos)
  const setEstudo = useMapa((s) => s.setEstudo)
  const [n, setN] = useState(1)
  const [emHoras, setEmHoras] = useState(false)
  const salvar = (lista: number[]) => setEstudo({ intervalos: [...new Set(lista)].sort((a, b) => a - b) })
  const novo = emHoras ? n / 24 : n
  const ehPadrao = intervalos.join() === PADRAO_INTERVALOS.join()
  return (
    <div className="space-y-4">
      <ol className="flex flex-wrap gap-1.5">
        {intervalos.map((d, i) => (
          <li key={d} className="flex items-center gap-1 rounded-full bg-[var(--foco-claro)] py-1 pl-3 pr-1 text-sm text-[var(--foco)]">
            <span className="text-[11px] opacity-70">{i + 1}ª</span> {nomeIntervalo(d)}
            <button
              className="grid h-6 w-6 place-items-center rounded-full hover:bg-white/60 disabled:opacity-30"
              disabled={intervalos.length <= 1}
              onClick={() => salvar(intervalos.filter((x) => x !== d))}
              aria-label={`tirar ${nomeIntervalo(d)}`}
            >
              ×
            </button>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--papel)] p-2 pl-3">
        <span className="text-sm text-[var(--tinta-suave)]">nova volta:</span>
        <Passos valor={n} min={1} max={emHoras ? 23 : 90} mudar={setN} unidade="" rotulo="nova volta" />
        <Opcoes
          valor={emHoras ? 'horas' : 'dias'}
          mudar={(v) => (setEmHoras(v === 'horas'), setN(1))}
          opcoes={[
            { valor: 'dias', nome: 'dias' },
            { valor: 'horas', nome: 'horas' },
          ]}
        />
        <button className="botao-suave" disabled={intervalos.includes(novo)} onClick={() => salvar([...intervalos, novo])}>
          + adicionar
        </button>
      </div>
      <p className={suave}>
        Padrão: {escreverIntervalos(PADRAO_INTERVALOS)} dias.{' '}
        {!ehPadrao && (
          <button className="text-[var(--foco)] hover:underline" onClick={() => salvar(PADRAO_INTERVALOS)}>
            voltar ao padrão
          </button>
        )}
      </p>
    </div>
  )
}

/* ───────────── as partes ───────────── */

function Previa() {
  const [inteira, setInteira] = useState(false)
  return (
    // presa no alto da coluna: dá para ver a mudança enquanto mexe nas opções lá embaixo
    <div className="sticky z-10 -mx-2 bg-[var(--papel)] px-2 pb-3 pt-2" style={{ top: 'var(--barra, 0px)' }}>
      <div className="rounded-2xl bg-[var(--cartao)] shadow-[var(--sombra)] ring-1 ring-[var(--linha)]">
        <div className="flex items-baseline justify-between px-5 pt-3">
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--tinta-suave)]">prévia</span>
          <button className="text-xs text-[var(--foco)] hover:underline" onClick={() => setInteira(!inteira)}>
            {inteira ? 'encolher' : 'ver inteira'}
          </button>
        </div>
        <div
          className={`relative overflow-hidden px-5 pb-3 pt-1 text-[var(--tinta)] transition-[max-height] duration-300 ${inteira ? 'max-h-[55vh] overflow-y-auto' : 'max-h-28 sm:max-h-40'}`}
        >
          <TextoLeitura>{EXEMPLO}</TextoLeitura>
          {!inteira && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 rounded-b-2xl bg-gradient-to-t from-[var(--cartao)]" aria-hidden />}
        </div>
      </div>
    </div>
  )
}

function ConfigLeitura() {
  const leitura = useMapa((s) => s.leitura)
  const setLeitura = useMapa((s) => s.setLeitura)
  const palavras = useMapa((s) => s.palavrasFlutuantes)
  const alternarPalavras = useMapa((s) => s.alternarPalavras)
  return (
    <>
      <Previa />
      <Grupo titulo="Letra">
        <Linha titulo="Tamanho">
          <Opcoes
            valor={leitura.tamanho}
            mudar={(tamanho) => setLeitura({ tamanho })}
            opcoes={TAMANHOS.map((t) => ({ valor: t, nome: <span style={{ fontSize: t * 0.8 }}>A</span>, titulo: `${t}px` }))}
          />
        </Linha>
        <Linha titulo="Fonte" nota={FONTES[leitura.fonte].nota}>
          <Opcoes
            valor={leitura.fonte}
            mudar={(fonte) => setLeitura({ fonte })}
            grade
            opcoes={(Object.keys(FONTES) as Fonte[]).map((f) => ({
              valor: f,
              nome: <span style={{ fontFamily: FONTES[f].familia }}>{FONTES[f].nome}</span>,
              titulo: FONTES[f].nota,
            }))}
          />
        </Linha>
      </Grupo>

      <Grupo titulo="Espaços">
        <Linha titulo="Entre linhas">
          <Opcoes valor={leitura.entrelinha} mudar={(entrelinha) => setLeitura({ entrelinha })} opcoes={ENTRELINHAS.map((e) => ({ valor: e.valor, nome: e.nome }))} />
        </Linha>
        <Linha titulo="Entre parágrafos" nota={leitura.formato === 'corrido' ? 'No jeito “corrido” o texto é um bloco só, então quase não há parágrafos para separar.' : undefined}>
          <Opcoes valor={leitura.paragrafo} mudar={(paragrafo) => setLeitura({ paragrafo })} opcoes={PARAGRAFOS.map((e) => ({ valor: e.valor, nome: e.nome }))} />
        </Linha>
        <Linha titulo="Largura da coluna" nota="Muda a página do tópico; a prévia não mostra.">
          <Opcoes valor={leitura.largura} mudar={(largura) => setLeitura({ largura })} opcoes={LARGURAS.map((l) => ({ valor: l.valor, nome: l.nome }))} />
        </Linha>
      </Grupo>

      <Grupo titulo="Jeito do texto">
        <Linha titulo="Parágrafos" nota={leitura.formato === 'arejado' ? 'Parágrafos curtos e listas em tópicos.' : 'Um bloco só, como num livro.'}>
          <Opcoes
            valor={leitura.formato}
            mudar={(formato) => setLeitura({ formato })}
            opcoes={[
              { valor: 'arejado', nome: 'arejado' },
              { valor: 'corrido', nome: 'corrido' },
            ]}
          />
        </Linha>
        <Linha
          titulo="Fórmulas"
          nota={
            {
              linha: 'As com conta ganham uma linha só delas; as curtas ficam na frase.',
              respiro: 'Todas na frase, com espaço e fundo em volta.',
              'no-texto': 'No meio da frase, sem destaque.',
            }[leitura.formulas]
          }
        >
          <Opcoes
            valor={leitura.formulas}
            mudar={(formulas) => setLeitura({ formulas })}
            opcoes={[
              { valor: 'linha', nome: 'linha própria' },
              { valor: 'respiro', nome: 'com espaço' },
              { valor: 'no-texto', nome: 'na frase' },
            ]}
          />
        </Linha>
        <Linha titulo="Setas (A → B → C)" nota={leitura.setas === 'vertical' ? 'Duas ou mais setas seguidas viram passos, um embaixo do outro.' : 'Como estão escritas.'}>
          <Opcoes
            valor={leitura.setas}
            mudar={(setas) => setLeitura({ setas })}
            opcoes={[
              { valor: 'no-texto', nome: 'na frase' },
              { valor: 'vertical', nome: 'em coluna' },
            ]}
          />
        </Linha>
        {leitura.setas === 'vertical' && (
          <Linha titulo="Lado das setas" nota="Onde a coluna de passos fica no texto.">
            <Opcoes
              valor={leitura.setasLado ?? 'esquerda'}
              mudar={(setasLado) => setLeitura({ setasLado })}
              opcoes={[
                { valor: 'esquerda', nome: 'esquerda' },
                { valor: 'centro', nome: 'centro' },
                { valor: 'direita', nome: 'direita' },
              ]}
            />
          </Linha>
        )}
      </Grupo>

      <Grupo titulo="Tela">
        <LinhaChave titulo="Modo calmo" nota="Nada se mexe na tela." ligada={leitura.calmo} mudar={() => setLeitura({ calmo: !leitura.calmo })} />
        <LinhaChave
          titulo="Palavras-chave sempre à vista"
          nota="Em tela larga, numa coluna ao lado do texto. Em tela estreita, ficam em “Sobre este tópico”."
          ligada={palavras}
          mudar={alternarPalavras}
        />
      </Grupo>
    </>
  )
}

function ConfigEstudo() {
  const estudo = useMapa((s) => s.estudo)
  const setEstudo = useMapa((s) => s.setEstudo)
  const extras = useMapa((s) => s.mostrarExtras)
  const setExtras = useMapa((s) => s.setMostrarExtras)
  return (
    <>
      <Grupo titulo="Trilha">
        <LinhaChave titulo="Mostrar extras na trilha geral" nota="Tópicos que não foram vistos em aula." ligada={extras} mudar={() => setExtras(!extras)} />
      </Grupo>

      <Grupo titulo="Testes">
        <Linha titulo="Questões por teste" nota="No fim do tópico e no teste geral da aba. O de abertura tem sempre até 3.">
          <Passos valor={estudo.questoesTeste} min={3} max={MAX_QUESTOES} mudar={(questoesTeste) => setEstudo({ questoesTeste })} unidade="questões" rotulo="questões por teste" />
        </Linha>
        <LinhaChave
          titulo="Teste antes de ler um tópico novo"
          nota="Até 3 questões. Errar aqui é esperado."
          ligada={estudo.preteste}
          mudar={() => setEstudo({ preteste: !estudo.preteste })}
        />
      </Grupo>

      <Grupo titulo="Cartões e pausas">
        <LinhaChave titulo="Escrever a resposta antes de virar o cartão" ligada={estudo.escreverCartao} mudar={() => setEstudo({ escreverCartao: !estudo.escreverCartao })} />
        <Linha titulo="Pausa para relembrar" nota="Depois desse tempo lendo um tópico, o app sugere parar e lembrar sem olhar. Padrão: 20 min.">
          <Passos
            valor={estudo.minutosLembrete}
            min={5}
            max={90}
            passo={5}
            mudar={(minutosLembrete) => setEstudo({ minutosLembrete })}
            unidade="min"
            rotulo="minutos até a pausa"
          />
        </Linha>
      </Grupo>

      <Grupo titulo="Voltas de revisão" nota="Cada “lembrei” leva o tópico para a próxima volta; “esqueci” recomeça da primeira.">
        <div className="py-4">
          <EditorIntervalos />
        </div>
      </Grupo>
    </>
  )
}

function ConfigPomodoro() {
  const p = useMapa((s) => s.pomodoroPref)
  const setP = useMapa((s) => s.setPomodoroPref)
  // o texto é salvo ao sair do campo: assim uma linha em branco no meio da digitação não some
  const [texto, setTexto] = useState(p.atividades.join('\n'))
  const padraoTempos = p.foco === POMODORO_PADRAO.foco && p.pausa === POMODORO_PADRAO.pausa && p.longa === POMODORO_PADRAO.longa && p.ciclos === POMODORO_PADRAO.ciclos
  const padraoAtividades = p.atividades.join('\n') === ATIVIDADES_PADRAO.join('\n')
  return (
    <>
      <Grupo titulo="Tempos" nota="Com o relógio andando, a mudança vale da próxima fase em diante.">
        <Linha titulo="Foco">
          <Passos valor={p.foco} min={5} max={120} passo={5} mudar={(foco) => setP({ foco })} unidade="min" rotulo="minutos de foco" />
        </Linha>
        <Linha titulo="Pausa curta">
          <Passos valor={p.pausa} min={1} max={60} mudar={(pausa) => setP({ pausa })} unidade="min" rotulo="minutos de pausa curta" />
        </Linha>
        <Linha titulo="Pausa longa">
          <Passos valor={p.longa} min={5} max={90} passo={5} mudar={(longa) => setP({ longa })} unidade="min" rotulo="minutos de pausa longa" />
        </Linha>
        <Linha titulo="Focos até a pausa longa" nota={`Depois de ${p.ciclos} ${p.ciclos === 1 ? 'foco' : 'focos'}, a pausa é a longa.`}>
          <Passos valor={p.ciclos} min={1} max={12} mudar={(ciclos) => setP({ ciclos })} unidade={p.ciclos === 1 ? 'foco' : 'focos'} rotulo="focos até a pausa longa" />
        </Linha>
        <LinhaChave titulo="Som ao terminar" nota="Três bipes curtos quando uma fase termina." ligada={p.som} mudar={() => setP({ som: !p.som })} />
      </Grupo>
      {!padraoTempos && (
        <p className={`-mt-4 px-1 ${suave}`}>
          Padrão: {POMODORO_PADRAO.foco} de foco, {POMODORO_PADRAO.pausa} de pausa, {POMODORO_PADRAO.longa} de pausa longa a cada {POMODORO_PADRAO.ciclos}.{' '}
          <button
            className="text-[var(--foco)] hover:underline"
            onClick={() => setP({ foco: POMODORO_PADRAO.foco, pausa: POMODORO_PADRAO.pausa, longa: POMODORO_PADRAO.longa, ciclos: POMODORO_PADRAO.ciclos })}
          >
            voltar ao padrão
          </button>
        </p>
      )}

      <Grupo titulo="O que fazer nas pausas" nota="O pomodoro sorteia uma sugestão a cada pausa.">
        <div className="space-y-2 py-4">
          <label htmlFor="cfg-atividades" className="sr-only">
            Sugestões para as pausas, uma por linha
          </label>
          <textarea
            id="cfg-atividades"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={() =>
              setP({
                atividades: texto
                  .split('\n')
                  .map((l) => l.trim())
                  .filter(Boolean),
              })
            }
            rows={8}
            className="w-full resize-y rounded-xl border border-[var(--linha)] bg-[var(--papel)] px-3 py-2 text-sm leading-relaxed text-[var(--tinta-forte)] focus:border-[var(--foco)] focus:outline-none"
          />
          <p className={suave}>
            Uma por linha. Escreva {'{min}'} onde quiser a duração da pausa.{' '}
            {!padraoAtividades && (
              <button
                className="text-[var(--foco)] hover:underline"
                onClick={() => {
                  setTexto(ATIVIDADES_PADRAO.join('\n'))
                  setP({ atividades: ATIVIDADES_PADRAO })
                }}
              >
                voltar às sugestões padrão
              </button>
            )}
          </p>
        </div>
      </Grupo>
    </>
  )
}

function ConfigDados() {
  return (
    <>
      {NUVEM_CONFIGURADA && (
        <Grupo titulo="Na nuvem">
          <div className="py-4">
            <AjustesNuvem />
          </div>
        </Grupo>
      )}
      <Grupo titulo="Cópia no computador">
        <div className="py-4">
          <AjustesBackup />
        </div>
      </Grupo>
    </>
  )
}

/** Uma parte da página: o título fica parado à esquerda em tela larga; as opções, à direita. */
function Parte({ id, children }: { id: SecaoConfig; children: ReactNode }) {
  const s = SECOES_CONFIG.find((x) => x.id === id)!
  return (
    <section
      id={`cfg-${id}`}
      aria-labelledby={`cfg-${id}-titulo`}
      className="grid gap-5 border-t border-[var(--linha)] py-10 first:border-t-0 first:pt-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12"
      style={{ scrollMarginTop: 'var(--barra, 0px)' }}
    >
      <div className="lg:sticky lg:self-start lg:pt-2" style={{ top: 'calc(var(--barra, 0px) + 1rem)' }}>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--foco-claro)] text-lg font-semibold text-[var(--foco)]" aria-hidden>
          {s.icone}
        </span>
        <h2 id={`cfg-${id}-titulo`} className="mt-3 text-xl font-bold tracking-tight text-[var(--tinta-forte)]">
          {s.nome}
        </h2>
        <p className={`mt-1 max-w-md ${suave}`}>{s.descricao}</p>
      </div>
      <div className="min-w-0 space-y-7">{children}</div>
    </section>
  )
}

/* ───────────── a página ───────────── */

export function TelaConfiguracoes({ secao }: { secao?: SecaoConfig }) {
  const barra = useRef<HTMLDivElement>(null)
  const raiz = useRef<HTMLDivElement>(null)
  const [atual, setAtual] = useState<SecaoConfig>(secao ?? 'leitura')
  const calmo = useMapa((s) => s.leitura.calmo)

  const ir = (id: SecaoConfig, suave = !calmo) => document.getElementById(`cfg-${id}`)?.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'start' })

  // a altura da barra presa no topo vira --barra: a prévia e os títulos param logo abaixo dela
  useEffect(() => {
    const b = barra.current
    if (!b) return
    const medir = () => raiz.current?.style.setProperty('--barra', `${b.offsetHeight}px`)
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(b)
    return () => ro.disconnect()
  }, [])

  // índice acompanha a rolagem
  useEffect(() => {
    const ver = () => {
      // a parte atual é a última cujo começo já passou de 40% da tela (as curtas do fim também acendem)
      const limite = Math.max((barra.current?.offsetHeight ?? 60) + 80, window.innerHeight * 0.4)
      let a: SecaoConfig = SECOES_CONFIG[0].id
      for (const s of SECOES_CONFIG) {
        const el = document.getElementById(`cfg-${s.id}`)
        if (el && el.getBoundingClientRect().top <= limite) a = s.id
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) a = SECOES_CONFIG[SECOES_CONFIG.length - 1].id
      setAtual(a)
    }
    ver()
    window.addEventListener('scroll', ver, { passive: true })
    return () => window.removeEventListener('scroll', ver)
  }, [])

  // #/configuracoes/estudo abre já na parte certa
  useEffect(() => {
    if (secao) requestAnimationFrame(() => ir(secao, false))
  }, [secao])

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || (e.target as HTMLElement).closest?.('input, select, textarea')) return
      voltarDasPaginas()
    }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [])

  return (
    <motion.div ref={raiz} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-dvh bg-[var(--papel)] pb-24 text-[var(--tinta)]">
      {/* barra presa no topo: o caminho de volta e o índice das partes */}
      <div ref={barra} className="sticky top-0 z-20 border-b border-[var(--linha)] bg-[var(--papel)]/90 backdrop-blur" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-3 gap-y-2 px-5 py-2.5 sm:px-8">
          <button className="botao-suave shrink-0" onClick={voltarDasPaginas} title="Esc também volta">
            ← voltar
          </button>
          <span className="truncate text-sm font-medium text-[var(--tinta-suave)]">Configurações</span>
          <nav
            aria-label="partes das configurações"
            className="-mx-1 flex basis-full gap-0.5 overflow-x-auto px-1 [scrollbar-width:none] md:ml-auto md:basis-auto [&::-webkit-scrollbar]:hidden"
          >
            {SECOES_CONFIG.map((s) => (
              <button
                key={s.id}
                onClick={() => ir(s.id)}
                aria-current={atual === s.id ? 'location' : undefined}
                className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1.5 sm:px-3 text-[13px] transition-colors ${
                  atual === s.id ? 'bg-[var(--foco-claro)] font-semibold text-[var(--foco)]' : 'text-[var(--tinta-suave)] hover:bg-[var(--papel-2)] hover:text-[var(--tinta)]'
                }`}
              >
                <span aria-hidden className="mr-1 hidden sm:inline">
                  {s.icone}
                </span>
                {s.nome}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <header className="border-b border-[var(--linha)] bg-[var(--papel-2)]/60">
        <div className="mx-auto w-full max-w-5xl px-5 py-6 sm:px-8 sm:py-8">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--tinta-forte)] sm:text-4xl">Configurações</h1>
          <p className="mt-1 text-sm text-[var(--tinta-suave)]">Do seu jeito. Cada mudança vale na hora e fica salva neste navegador.</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 sm:px-8">
        <Parte id="leitura">
          <ConfigLeitura />
        </Parte>
        <Parte id="estudo">
          <ConfigEstudo />
        </Parte>
        <Parte id="pomodoro">
          <ConfigPomodoro />
        </Parte>
        <Parte id="marcas">
          <Grupo titulo="Para que serve cada cor" nota="Aparece quando você marca um trecho. Em branco, fica o nome da cor.">
            <div className="py-4">
              <EditarCores />
            </div>
          </Grupo>
        </Parte>
        <Parte id="dados">
          <ConfigDados />
        </Parte>
      </main>
    </motion.div>
  )
}
