// Cabeçalho com três painéis laterais: 🔁 Revisão, 📝 Anotações e ⚙ Configurações.
// Configurações tem abas (Leitura, Estudo, Marca-texto, Dados) e cada aba é dividida em seções curtas.
// Os resumos de Revisão e Anotações ficam em Painel.tsx.
import { useState, type ReactNode } from 'react'
import { ENTRELINHAS, FONTES, LARGURAS, PARAGRAFOS, TAMANHOS, type Fonte } from '../lib/leitura'
import { NUVEM_CONFIGURADA } from '../lib/nuvem'
import { usePainel, type PainelId } from '../lib/paineis'
import { escreverIntervalos } from '../lib/revisita'
import { MAX_QUESTOES, useMapa } from '../store/useMapa'
import { AjustesBackup } from './Backup'
import { EditarCores } from './Marcas'
import { AjustesNuvem } from './Nuvem'
import { PainelAjuda } from './Ajuda'
import { PainelLateral, ResumoAnotacoes, ResumoRevisao, RodapeAnotacoes, RodapeRevisao, Secao, usePendentesRevisao } from './Painel'
import { TextoLeitura } from './Texto'

const EXEMPLO =
  'A busca gulosa olha só para a estimativa $h(n)$ até o objetivo, enquanto o A* soma as duas: $f(n) = g(n) + h(n)$. Por isso a gulosa é rápida, mas pode escolher um caminho mais caro. Na Romênia ela acha Arad → Sibiu → Fagaras → Bucharest. Ela tem três características: **é rápida**; **não garante o melhor caminho**; **pode ficar presa em laços**.'

/* ───────────── peças ───────────── */

const rotulo = 'mb-2 text-xs font-medium uppercase tracking-[0.12em] text-[var(--tinta-suave)]'

function Opcoes<T extends string | number>({ rotulo: r, valor, opcoes, mudar }: { rotulo: string; valor: T; opcoes: { valor: T; nome: ReactNode; titulo?: string }[]; mudar: (v: T) => void }) {
  return (
    <fieldset>
      <legend className={rotulo}>{r}</legend>
      <div className="flex flex-wrap gap-1.5">
        {opcoes.map((o) => (
          <button
            key={String(o.valor)}
            title={o.titulo}
            aria-pressed={valor === o.valor}
            onClick={() => mudar(o.valor)}
            className={`min-w-11 rounded-xl px-3 py-1.5 text-sm transition-colors ${valor === o.valor ? 'bg-[var(--foco)] text-white' : 'bg-[var(--papel-2)] text-[var(--tinta)] hover:bg-[var(--linha)]'}`}
          >
            {o.nome}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function Chave({ ligada, mudar, children }: { ligada: boolean; mudar: () => void; children: ReactNode }) {
  return (
    <button role="switch" aria-checked={ligada} onClick={mudar} className="flex w-full items-center gap-3 rounded-xl py-1.5 text-left text-sm text-[var(--tinta)]">
      <span className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${ligada ? 'bg-[var(--menta)]' : 'bg-[var(--linha)]'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] ${ligada ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
      <span>{children}</span>
    </button>
  )
}

/** − número + : sem digitar, sem vírgula. */
function Passos({ valor, min, max, passo = 1, mudar, unidade, rotulo: r }: { valor: number; min: number; max: number; passo?: number; mudar: (v: number) => void; unidade: string; rotulo: string }) {
  const botao = 'grid h-9 w-9 place-items-center rounded-full bg-[var(--papel-2)] text-lg text-[var(--tinta)] hover:bg-[var(--linha)] disabled:opacity-40'
  return (
    <div className="flex items-center gap-3" role="group" aria-label={r}>
      <button className={botao} disabled={valor <= min} onClick={() => mudar(Math.max(min, valor - passo))} aria-label={`menos ${r}`}>
        −
      </button>
      <span className="min-w-[5.5rem] text-center text-sm tabular-nums text-[var(--tinta-forte)]">
        <strong className="text-lg">{valor}</strong> {unidade}
      </span>
      <button className={botao} disabled={valor >= max} onClick={() => mudar(Math.min(max, valor + passo))} aria-label={`mais ${r}`}>
        +
      </button>
    </div>
  )
}

const nomeIntervalo = (d: number) => (Number.isInteger(d) ? `${d} ${d === 1 ? 'dia' : 'dias'}` : `${Math.round(d * 24 * 10) / 10} h`)

/** Voltas depois de estudar: cada uma é um chip; adiciona com stepper, remove com ×. */
function EditorIntervalos() {
  const intervalos = useMapa((s) => s.estudo.intervalos)
  const setEstudo = useMapa((s) => s.setEstudo)
  const [n, setN] = useState(1)
  const [emHoras, setEmHoras] = useState(false)
  const salvar = (lista: number[]) => setEstudo({ intervalos: [...new Set(lista)].sort((a, b) => a - b) })
  const novo = emHoras ? n / 24 : n
  return (
    <div>
      <div className={rotulo}>Voltas depois de estudar</div>
      <div className="flex flex-wrap gap-1.5">
        {intervalos.map((d, i) => (
          <span key={d} className="flex items-center gap-1 rounded-full bg-[var(--foco-claro)] py-1 pl-3 pr-1 text-sm text-[var(--foco)]">
            <span className="text-[10px] opacity-70">{i + 1}ª</span> {nomeIntervalo(d)}
            <button
              className="grid h-5 w-5 place-items-center rounded-full hover:bg-white/60 disabled:opacity-30"
              disabled={intervalos.length <= 1}
              onClick={() => salvar(intervalos.filter((x) => x !== d))}
              aria-label={`tirar ${nomeIntervalo(d)}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Passos valor={n} min={1} max={emHoras ? 23 : 90} mudar={setN} unidade="" rotulo="nova volta" />
        <div className="flex rounded-full bg-[var(--papel-2)] p-0.5 text-xs">
          {[false, true].map((h) => (
            <button key={String(h)} onClick={() => (setEmHoras(h), setN(1))} className={`rounded-full px-2.5 py-1 ${emHoras === h ? 'bg-[var(--cartao)] text-[var(--tinta-forte)] shadow-sm' : 'text-[var(--tinta-suave)]'}`}>
              {h ? 'horas' : 'dias'}
            </button>
          ))}
        </div>
        <button className="botao-suave" disabled={intervalos.includes(novo)} onClick={() => salvar([...intervalos, novo])}>
          + adicionar
        </button>
      </div>
      <p className="mt-2 text-xs text-[var(--tinta-suave)]">
        Cada “lembrei” leva o tópico à próxima volta; “esqueci” recomeça. Padrão: {escreverIntervalos([1, 3, 7, 14, 30])} dias.{' '}
        <button className="text-[var(--foco)] hover:underline" onClick={() => salvar([1, 3, 7, 14, 30])}>
          voltar ao padrão
        </button>
      </p>
    </div>
  )
}


/* ───────────── configurações ───────────── */

type AbaConfig = 'leitura' | 'estudo' | 'marcas' | 'dados'
const ABAS_CONFIG: { id: AbaConfig; nome: string }[] = [
  { id: 'leitura', nome: 'Aa Leitura' },
  { id: 'estudo', nome: '📚 Estudo' },
  { id: 'marcas', nome: '🖍 Marca-texto' },
  { id: 'dados', nome: '💾 Dados' },
]

const nota = 'mt-1.5 text-xs text-[var(--tinta-suave)]'

function ConfigLeitura() {
  const leitura = useMapa((s) => s.leitura)
  const setLeitura = useMapa((s) => s.setLeitura)
  const palavras = useMapa((s) => s.palavrasFlutuantes)
  const alternarPalavras = useMapa((s) => s.alternarPalavras)
  const [previaInteira, setPreviaInteira] = useState(false)
  return (
    <>
      {/* presa no alto: dá para ver a mudança enquanto mexe nas opções lá embaixo */}
      <div className="sticky -top-6 z-10 -mx-6 -mt-6 border-b border-[var(--linha)] bg-[var(--cartao)] px-6 pb-3 pt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--tinta-suave)]">prévia</span>
          <button className="text-xs text-[var(--foco)] hover:underline" onClick={() => setPreviaInteira(!previaInteira)}>
            {previaInteira ? 'encolher' : 'ver inteira'}
          </button>
        </div>
        <div className={`relative mt-1 overflow-hidden rounded-2xl bg-[var(--papel)] px-4 py-3 text-[var(--tinta)] ${previaInteira ? 'max-h-[60vh] overflow-y-auto' : 'max-h-44'}`}>
          <TextoLeitura>{EXEMPLO}</TextoLeitura>
          {!previaInteira && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--papel)]" aria-hidden />}
        </div>
      </div>

      <Secao titulo="Letra">
        <Opcoes rotulo="Tamanho" valor={leitura.tamanho} mudar={(tamanho) => setLeitura({ tamanho })} opcoes={TAMANHOS.map((t) => ({ valor: t, nome: <span style={{ fontSize: t * 0.8 }}>A</span>, titulo: `${t}px` }))} />
        <Opcoes
          rotulo="Fonte"
          valor={leitura.fonte}
          mudar={(fonte) => setLeitura({ fonte })}
          opcoes={(Object.keys(FONTES) as Fonte[]).map((f) => ({ valor: f, nome: <span style={{ fontFamily: FONTES[f].familia }}>{FONTES[f].nome}</span>, titulo: FONTES[f].nota }))}
        />
      </Secao>

      <Secao titulo="Espaços">
        <Opcoes rotulo="Entre linhas" valor={leitura.entrelinha} mudar={(entrelinha) => setLeitura({ entrelinha })} opcoes={ENTRELINHAS.map((e) => ({ valor: e.valor, nome: e.nome }))} />
        <div>
          <Opcoes rotulo="Entre parágrafos" valor={leitura.paragrafo} mudar={(paragrafo) => setLeitura({ paragrafo })} opcoes={PARAGRAFOS.map((e) => ({ valor: e.valor, nome: e.nome }))} />
          {leitura.formato === 'corrido' && <p className={nota}>No jeito “corrido” o texto é um bloco só, então quase não há parágrafos para separar.</p>}
        </div>
        <Opcoes rotulo="Largura da coluna" valor={leitura.largura} mudar={(largura) => setLeitura({ largura })} opcoes={LARGURAS.map((l) => ({ valor: l.valor, nome: l.nome }))} />
      </Secao>

      <Secao titulo="Jeito do texto">
        <Opcoes
          rotulo="Parágrafos"
          valor={leitura.formato}
          mudar={(formato) => setLeitura({ formato })}
          opcoes={[
            { valor: 'arejado', nome: 'arejado', titulo: 'parágrafos curtos e listas em tópicos' },
            { valor: 'corrido', nome: 'corrido', titulo: 'um bloco só, como num livro' },
          ]}
        />
        <Opcoes
          rotulo="Fórmulas"
          valor={leitura.formulas}
          mudar={(formulas) => setLeitura({ formulas })}
          opcoes={[
            { valor: 'linha', nome: 'linha própria', titulo: 'as fórmulas com conta ganham uma linha só delas, centralizadas; as curtas ficam na frase, com espaço em volta' },
            { valor: 'respiro', nome: 'com espaço', titulo: 'todas na frase, com espaço e fundo em volta' },
            { valor: 'no-texto', nome: 'na frase', titulo: 'no meio da frase, sem destaque' },
          ]}
        />
        <Opcoes
          rotulo="Setas (A → B → C)"
          valor={leitura.setas}
          mudar={(setas) => setLeitura({ setas })}
          opcoes={[
            { valor: 'no-texto', nome: 'na frase', titulo: 'como estão escritas' },
            { valor: 'vertical', nome: 'em coluna', titulo: 'sequências com duas ou mais setas viram passos, um embaixo do outro' },
          ]}
        />
      </Secao>

      <Secao titulo="Movimento">
        <div className="space-y-1">
          <Chave ligada={leitura.calmo} mudar={() => setLeitura({ calmo: !leitura.calmo })}>
            Modo calmo <span className="block text-xs text-[var(--tinta-suave)]">nada se mexe na tela</span>
          </Chave>
          <Chave ligada={palavras} mudar={alternarPalavras}>
            Palavras-chave sempre à vista{' '}
            <span className="block text-xs text-[var(--tinta-suave)]">na coluna ao lado do texto, em tela larga (em tela estreita, ficam em "Sobre este tópico")</span>
          </Chave>
        </div>
      </Secao>
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
      <Secao titulo="Trilha">
        <Chave ligada={extras} mudar={() => setExtras(!extras)}>
          Mostrar extras na trilha geral <span className="block text-xs text-[var(--tinta-suave)]">tópicos não vistos em aula</span>
        </Chave>
      </Secao>

      <Secao titulo="Testes">
        <div>
          <div className={rotulo}>Questões por teste</div>
          <Passos valor={estudo.questoesTeste} min={3} max={MAX_QUESTOES} mudar={(questoesTeste) => setEstudo({ questoesTeste })} unidade="questões" rotulo="questões por teste" />
          <p className={nota}>Teste do fim do tópico e teste geral da aba. O de abertura tem sempre até 3.</p>
        </div>
        <Chave ligada={estudo.preteste} mudar={() => setEstudo({ preteste: !estudo.preteste })}>
          Teste antes de ler um tópico novo
        </Chave>
      </Secao>

      <Secao titulo="Cartões">
        <Chave ligada={estudo.escreverCartao} mudar={() => setEstudo({ escreverCartao: !estudo.escreverCartao })}>
          Escrever a resposta antes de virar
        </Chave>
      </Secao>

      <Secao titulo="Pausa para relembrar">
        <div>
          <Passos valor={estudo.minutosLembrete} min={5} max={90} passo={5} mudar={(minutosLembrete) => setEstudo({ minutosLembrete })} unidade="min" rotulo="minutos até a pausa" />
          <p className={nota}>Padrão: 20 min.</p>
        </div>
      </Secao>

      <Secao titulo="Voltas de revisão">
        <EditorIntervalos />
      </Secao>
    </>
  )
}

function PainelConfig({ aberto, fechar }: { aberto: boolean; fechar: () => void }) {
  const [aba, setAba] = useState<AbaConfig>('leitura')
  return (
    <PainelLateral
      aberto={aberto}
      fechar={fechar}
      titulo="Configurações"
      sub="Do seu jeito"
      topo={
        <nav className="mt-3 flex flex-wrap gap-1" role="tablist" aria-label="grupos de configuração">
          {ABAS_CONFIG.map((a) => (
            <button
              key={a.id}
              role="tab"
              aria-selected={aba === a.id}
              onClick={() => setAba(a.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] transition-colors ${aba === a.id ? 'bg-[var(--foco)] text-white' : 'bg-[var(--papel-2)] text-[var(--tinta)] hover:bg-[var(--linha)]'}`}
            >
              {a.nome}
            </button>
          ))}
        </nav>
      }
    >
      <div key={aba} className="space-y-6 [&>section:first-child]:border-t-0 [&>section:first-child]:pt-0">
        {aba === 'leitura' && <ConfigLeitura />}
        {aba === 'estudo' && <ConfigEstudo />}
        {aba === 'marcas' && (
          <Secao titulo="Para que serve cada cor">
            <p className="-mt-1 text-xs text-[var(--tinta-suave)]">Aparece quando você marca um trecho. Em branco, fica o nome da cor.</p>
            <EditarCores />
          </Secao>
        )}
        {aba === 'dados' && (
          <>
            {NUVEM_CONFIGURADA && (
              <Secao titulo="Na nuvem">
                <AjustesNuvem />
              </Secao>
            )}
            <Secao titulo="Cópia no computador">
              <AjustesBackup />
            </Secao>
          </>
        )}
      </div>
    </PainelLateral>
  )
}

/* ───────────── os três painéis e os botões do cabeçalho ───────────── */

/** Fica uma vez só, no App: o cabeçalho de cada tela só abre. */
export function Paineis() {
  const aberto = usePainel((s) => s.aberto)
  const fechar = usePainel((s) => s.fechar)
  return (
    <>
      <PainelLateral aberto={aberto === 'revisao'} fechar={fechar} titulo="Revisão" sub="Tudo para revisar e fixar" rodape={<RodapeRevisao />}>
        <ResumoRevisao />
      </PainelLateral>
      <PainelLateral aberto={aberto === 'notas'} fechar={fechar} titulo="Anotações" sub="O que você escreveu, marcou e juntou" rodape={<RodapeAnotacoes />}>
        <ResumoAnotacoes />
      </PainelLateral>
      <PainelConfig aberto={aberto === 'config'} fechar={fechar} />
      <PainelAjuda aberto={aberto === 'ajuda'} fechar={fechar} />
    </>
  )
}

const BOTOES: { id: PainelId; icone: string; nome: string }[] = [
  { id: 'revisao', icone: '🔁', nome: 'revisão' },
  { id: 'notas', icone: '📝', nome: 'anotações' },
  { id: 'config', icone: '⚙', nome: 'configurações' },
  { id: 'ajuda', icone: '?', nome: 'ajuda' },
]

/** 🔁 revisão · 📝 anotações · ⚙ configurações · ? ajuda. `rotulos` mostra o nome a partir da tela média. */
export function BotoesPaineis({ className, rotulos = false }: { className: string; rotulos?: boolean }) {
  const abrir = usePainel((s) => s.abrir)
  const pendentes = usePendentesRevisao()
  return (
    <>
      {BOTOES.map((b) => (
        <button
          key={b.id}
          className={className}
          onClick={() => abrir(b.id)}
          title={b.nome}
          aria-label={b.id === 'revisao' && pendentes ? `revisão, ${pendentes} para hoje` : b.nome}
        >
          {b.icone}
          {rotulos && <span className="hidden md:inline">{b.nome}</span>}
          {b.id === 'revisao' && pendentes > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--coral)] px-1 text-[11px] font-semibold text-white" aria-hidden>
              {pendentes > 99 ? '99+' : pendentes}
            </span>
          )}
        </button>
      ))}
    </>
  )
}
