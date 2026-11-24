// Painel "Aa": como você gosta de ver o texto e de quanto em quanto tempo relembrar.
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ENTRELINHAS, FONTES, LARGURAS, TAMANHOS, type Fonte } from '../lib/leitura'
import { escreverIntervalos, lerIntervalos } from '../lib/revisita'
import { useMapa } from '../store/useMapa'
import { TextoLeitura } from './Texto'
import { AjustesBackup } from './Backup'

const EXEMPLO =
  'A busca gulosa olha só para a estimativa até o objetivo. Por isso é rápida, mas pode escolher um caminho mais caro. Ela tem três características: **é rápida**; **não garante o melhor caminho**; **pode ficar presa em laços**.'

function Opcoes<T extends string | number>({ rotulo, valor, opcoes, mudar }: { rotulo: string; valor: T; opcoes: { valor: T; nome: ReactNode; titulo?: string }[]; mudar: (v: T) => void }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-medium uppercase tracking-[0.12em] text-[var(--tinta-suave)]">{rotulo}</legend>
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
    <button role="switch" aria-checked={ligada} onClick={mudar} className="flex w-full items-center gap-3 rounded-xl px-1 py-1.5 text-left text-sm text-[var(--tinta)]">
      <span className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${ligada ? 'bg-[var(--menta)]' : 'bg-[var(--linha)]'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] ${ligada ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
      <span>{children}</span>
    </button>
  )
}

export function PainelAjustes({ aberto, fechar }: { aberto: boolean; fechar: () => void }) {
  const leitura = useMapa((s) => s.leitura)
  const setLeitura = useMapa((s) => s.setLeitura)
  const palavras = useMapa((s) => s.palavrasFlutuantes)
  const alternarPalavras = useMapa((s) => s.alternarPalavras)
  const ajustesExtra = useMapa((s) => s.estudo)
  const setEstudo = useMapa((s) => s.setEstudo)

  useEffect(() => {
    if (!aberto) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && fechar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [aberto, fechar])

  return createPortal(
    <AnimatePresence>
      {aberto && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-[rgba(36,34,44,.25)]" onClick={fechar} />
          <motion.aside
            role="dialog"
            aria-label="Ajustes de leitura e estudo"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col overflow-y-auto bg-[var(--cartao)] shadow-[-12px_0_40px_-16px_rgba(36,34,44,.3)]"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="flex items-center justify-between border-b border-[var(--linha)] px-5 py-3">
              <h2 className="font-semibold text-[var(--tinta-forte)]">Do seu jeito</h2>
              <button className="botao-suave" onClick={fechar}>
                fechar
              </button>
            </div>

            <div className="space-y-5 px-5 py-5">
              <div className="rounded-2xl border border-[var(--linha)] bg-[var(--papel)] p-4 text-[var(--tinta)]">
                <div className="mb-2 text-[11px] uppercase tracking-[0.12em] text-[var(--tinta-suave)]">prévia</div>
                <TextoLeitura>{EXEMPLO}</TextoLeitura>
              </div>

              <Opcoes rotulo="Tamanho da letra" valor={leitura.tamanho} mudar={(tamanho) => setLeitura({ tamanho })} opcoes={TAMANHOS.map((t) => ({ valor: t, nome: <span style={{ fontSize: t * 0.8 }}>A</span>, titulo: `${t}px` }))} />
              <Opcoes rotulo="Espaço entre linhas" valor={leitura.entrelinha} mudar={(entrelinha) => setLeitura({ entrelinha })} opcoes={ENTRELINHAS.map((e) => ({ valor: e.valor, nome: e.nome }))} />
              <Opcoes rotulo="Largura da coluna" valor={leitura.largura} mudar={(largura) => setLeitura({ largura })} opcoes={LARGURAS.map((l) => ({ valor: l.valor, nome: l.nome }))} />
              <Opcoes
                rotulo="Fonte"
                valor={leitura.fonte}
                mudar={(fonte) => setLeitura({ fonte })}
                opcoes={(Object.keys(FONTES) as Fonte[]).map((f) => ({ valor: f, nome: <span style={{ fontFamily: FONTES[f].familia }}>{FONTES[f].nome}</span>, titulo: FONTES[f].nota }))}
              />
              <Opcoes
                rotulo="Jeito do texto"
                valor={leitura.formato}
                mudar={(formato) => setLeitura({ formato })}
                opcoes={[
                  { valor: 'arejado', nome: 'arejado', titulo: 'parágrafos curtos e listas em tópicos' },
                  { valor: 'corrido', nome: 'corrido', titulo: 'um bloco só, como num livro' },
                ]}
              />

              <div className="space-y-1 border-t border-[var(--linha)] pt-4">
                <Chave ligada={leitura.calmo} mudar={() => setLeitura({ calmo: !leitura.calmo })}>
                  Modo calmo <span className="block text-xs text-[var(--tinta-suave)]">nada se mexe na tela</span>
                </Chave>
                <Chave ligada={palavras} mudar={alternarPalavras}>
                  Palavras-chave ao redor do texto
                </Chave>
                <Chave ligada={ajustesExtra.preteste} mudar={() => setEstudo({ preteste: !ajustesExtra.preteste })}>
                  Pré-teste antes de um tópico novo <span className="block text-xs text-[var(--tinta-suave)]">chutar antes de ler ajuda a prestar atenção</span>
                </Chave>
              </div>

              <AjustesRelembrar />
              <AjustesBackup />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/** Quando relembrar: no meio do estudo e nas voltas depois de dias. */
function AjustesRelembrar() {
  const estudo = useMapa((s) => s.estudo)
  const setEstudo = useMapa((s) => s.setEstudo)
  const [texto, setTexto] = useState(escreverIntervalos(estudo.intervalos))
  const lidos = lerIntervalos(texto)
  const valido = lidos !== null

  return (
    <div className="space-y-4 border-t border-[var(--linha)] pt-4">
      <div>
        <div className="mb-1.5 text-xs font-medium uppercase tracking-[0.12em] text-[var(--tinta-suave)]">Relembrar no meio do estudo</div>
        <label className="flex items-center gap-2 text-sm text-[var(--tinta)]">
          depois de
          <input
            type="number"
            min={5}
            max={90}
            value={estudo.minutosLembrete}
            onChange={(e) => setEstudo({ minutosLembrete: Math.max(5, Math.min(90, Number(e.target.value) || 20)) })}
            className="w-16 rounded-lg border border-[var(--linha)] bg-[var(--papel)] px-2 py-1 text-right"
          />
          minutos lendo um tópico
        </label>
        <p className="mt-1 text-xs text-[var(--tinta-suave)]">Padrão: 20 min, perto do fim de um pomodoro.</p>
      </div>
      <div>
        <div className="mb-1.5 text-xs font-medium uppercase tracking-[0.12em] text-[var(--tinta-suave)]">Voltas depois de estudar (dias)</div>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onBlur={() => lidos && setEstudo({ intervalos: lidos })}
          className="w-full rounded-lg border border-[var(--linha)] bg-[var(--papel)] px-3 py-1.5 text-sm"
          aria-invalid={!valido}
        />
        <p className={`mt-1 text-xs ${valido ? 'text-[var(--tinta-suave)]' : 'text-[var(--alerta)]'}`}>
          {valido ? 'Padrão: 1, 3, 7, 14, 30. Para horas, escreva "1h". Cada "lembrei" sobe um degrau; "esqueci" volta ao primeiro.' : 'Use números em ordem crescente separados por vírgula, como 1h, 1, 3, 7.'}
        </p>
      </div>
    </div>
  )
}

/** Botão "Aa" que abre o painel. */
export function BotaoAjustes() {
  const [aberto, setAberto] = useState(false)
  return (
    <>
      <button className="botao-suave" onClick={() => setAberto(true)} title="como ver o texto, quando relembrar e backup" aria-label="ajustes de leitura">
        Aa
      </button>
      <PainelAjustes aberto={aberto} fechar={() => setAberto(false)} />
    </>
  )
}
