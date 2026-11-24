import { useEffect, useRef, useState } from 'react'
import { armazenamentoPersistente, exportar, lerArquivo, lerCopias, restaurarCopia, resumoAtual, resumoCopia, temProgresso, ultimoBackup, type Copia, type Resumo } from '../lib/backup'
import { Expande } from './Abrir'

const DIA = 86_400_000
const DIAS_LEMBRETE = 7

function quando(t: number | null) {
  if (!t) return 'nunca'
  const dias = Math.floor((Date.now() - t) / DIA)
  const data = new Date(t).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  return dias === 0 ? `hoje, ${data.split(' ')[1] ?? data}` : dias === 1 ? `ontem (${data})` : `há ${dias} dias (${data})`
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

function LinhaResumo({ r }: { r: Resumo }) {
  return (
    <span>
      {plural(r.topicos, 'tópico aberto', 'tópicos abertos')} · {plural(r.notas, 'anotação', 'anotações')} · {plural(r.cartoes, 'cartão respondido', 'cartões respondidos')} ·{' '}
      {plural(r.postits, 'post-it', 'post-its')}
      {r.audios !== undefined && ` · ${plural(r.audios, 'gravação', 'gravações')}`}
      {!!r.fotos && ` · ${plural(r.fotos, 'foto', 'fotos')}`}
    </span>
  )
}

/** Conteúdo da seção "Cópia no computador" das configurações (backup). */
export function AjustesBackup() {
  const [ultimo, setUltimo] = useState(ultimoBackup)
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, setPendente] = useState<{ resumo: Resumo; aplicar: () => Promise<void> } | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [copiaEscolhida, setCopiaEscolhida] = useState<Copia | null>(null)
  const [verCopias, setVerCopias] = useState(false)
  const [persistente, setPersistente] = useState<boolean | null>(null)
  const entrada = useRef<HTMLInputElement>(null)
  const copias = lerCopias().slice().reverse()

  useEffect(() => {
    armazenamentoPersistente().then(setPersistente)
  }, [])

  const baixar = async () => {
    setOcupado(true)
    try {
      const n = await exportar()
      setUltimo(ultimoBackup())
      setErro(null)
      setAviso(n ? `Backup baixado com ${plural(n, 'gravação', 'gravações')} de áudio dentro.` : 'Backup baixado.')
    } catch (e) {
      setErro((e as Error).message)
    }
    setOcupado(false)
  }

  const aplicar = async () => {
    if (!pendente) return
    setOcupado(true)
    try {
      await pendente.aplicar()
    } catch (e) {
      setErro(`Não consegui guardar as gravações do backup, então não mudei nada. (${(e as Error).message})`)
      setOcupado(false)
    }
  }

  const escolherArquivo = async (f: File | undefined) => {
    if (!f) return
    setErro(null)
    setCopiaEscolhida(null)
    try {
      setPendente(await lerArquivo(f))
    } catch (e) {
      setErro((e as Error).message)
    }
    if (entrada.current) entrada.current.value = ''
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--tinta)]">
        Tudo fica guardado só neste navegador. Baixe um backup de vez em quando e guarde o arquivo fora dele (Drive, pendrive, e-mail para você).
      </p>
      <p className="text-xs text-[var(--tinta-suave)]">
        Agora: <LinhaResumo r={resumoAtual()} />
        <br />
        Último backup baixado: <strong className="text-[var(--tinta)]">{quando(ultimo)}</strong>
      </p>

      <div className="flex flex-wrap gap-2">
        <button className="botao-foco" onClick={baixar} disabled={ocupado}>
          {ocupado ? 'preparando…' : '⬇ baixar backup'}
        </button>
        <button className="botao-suave" onClick={() => entrada.current?.click()}>
          ⬆ restaurar de um arquivo
        </button>
        <input ref={entrada} type="file" accept="application/json,.json" className="hidden" onChange={(e) => escolherArquivo(e.target.files?.[0])} />
      </div>

      {aviso && !erro && <p className="text-xs text-[var(--tinta-suave)]">✓ {aviso}</p>}
      {erro && <p className="rounded-xl bg-[var(--alerta-claro)] px-3 py-2 text-sm text-[var(--tinta-forte)]">{erro}</p>}

      {pendente && (
        <div className="rounded-xl border-2 border-[var(--alerta)] bg-[var(--alerta-claro)] px-3 py-3 text-sm text-[var(--tinta-forte)]">
          <p>
            <strong>Substituir o progresso de agora por este backup?</strong>
          </p>
          <p className="mt-1 text-xs">
            Backup{pendente.resumo.salvoEm ? ` de ${pendente.resumo.salvoEm.toLocaleString('pt-BR')}` : ''}: <LinhaResumo r={pendente.resumo} />
          </p>
          <p className="mt-1 text-xs">
            Agora: <LinhaResumo r={resumoAtual()} />
          </p>
          <p className="mt-1 text-xs">O de agora não some: vira uma cópia automática, e dá para voltar nele aqui embaixo.</p>
          {!!(pendente.resumo.audios || pendente.resumo.fotos) && (
            <p className="mt-1 text-xs">
              As gravações e fotos do backup são <strong>somadas</strong> às que já estão aqui (nenhuma é apagada). Elas não entram na cópia automática, então desfazer depois não as tira.
            </p>
          )}
          <div className="mt-2 flex gap-2">
            <button className="botao-foco" onClick={aplicar} disabled={ocupado}>
              {ocupado ? 'restaurando…' : 'sim, substituir'}
            </button>
            <button className="botao-suave" onClick={() => setPendente(null)}>
              cancelar
            </button>
          </div>
        </div>
      )}

      <div>
        <button className="text-sm text-[var(--foco)] hover:underline" onClick={() => setVerCopias(!verCopias)} aria-expanded={verCopias}>
          {verCopias ? '▾' : '▸'} cópias automáticas neste navegador ({copias.length})
        </button>
        <Expande aberto={verCopias}>
          <div className="mt-2 space-y-2">
            <p className="text-xs text-[var(--tinta-suave)]">
              Uma por dia (as últimas 7) e uma antes de cada restauração. Servem para desfazer um engano, mas somem junto se você limpar os dados do site, e não guardam as gravações de
              áudio. Por isso o arquivo baixado ainda é o que vale.
            </p>
            {!copias.length && <p className="text-xs text-[var(--tinta-suave)]">Nenhuma ainda.</p>}
            <ul className="space-y-1">
              {copias.map((c) => {
                const r = resumoCopia(c)
                const escolhida = copiaEscolhida === c
                return (
                  <li key={c.em} className="rounded-xl border border-[var(--linha)] px-3 py-2 text-xs text-[var(--tinta)]">
                    <div className="flex items-center justify-between gap-2">
                      <span>
                        <strong>{new Date(c.em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</strong> · {c.motivo}
                      </span>
                      {!escolhida && (
                        <button
                          className="text-[var(--foco)] hover:underline"
                          onClick={() => {
                            setPendente(null)
                            setCopiaEscolhida(c)
                          }}
                        >
                          voltar para esta
                        </button>
                      )}
                    </div>
                    <div className="text-[var(--tinta-suave)]">
                      <LinhaResumo r={r} />
                    </div>
                    {escolhida && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span>Trocar o de agora por esta cópia?</span>
                        <button className="botao-foco" onClick={() => restaurarCopia(c)}>
                          sim, voltar
                        </button>
                        <button className="botao-suave" onClick={() => setCopiaEscolhida(null)}>
                          não
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </Expande>
      </div>

      {persistente !== null && (
        <p className="text-xs text-[var(--tinta-suave)]">
          {persistente
            ? '✓ O navegador marcou este site como armazenamento persistente: ele não apaga sozinho quando falta espaço.'
            : 'O navegador ainda não garantiu armazenamento persistente para este site. Ele pode apagar os dados se faltar espaço no disco, mais um motivo para baixar o backup.'}
        </p>
      )}
    </div>
  )
}

/**
 * Aviso de backup: uma barra fina no alto da trilha, acima do cabeçalho (rola junto, não fica presa).
 * Só aparece quando faz tempo sem backup e já há algo a perder; "×" esconde até recarregar a página.
 */
export function LembreteBackup() {
  const [fechado, setFechado] = useState(false)
  const [ultimo, setUltimo] = useState(ultimoBackup)
  const [agora] = useState(() => Date.now())
  if (fechado || !temProgresso() || (ultimo && agora - ultimo < DIAS_LEMBRETE * DIA)) return null
  return (
    <div role="status" className="border-b border-[var(--alerta)]/20 bg-[var(--alerta-claro)]/70 text-xs text-[var(--tinta)]" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="mx-auto flex w-full max-w-4xl items-center gap-2 px-4 py-1.5 sm:px-8">
        <span aria-hidden>💾</span>
        <span className="min-w-0 flex-1 truncate" title="Seu progresso e suas anotações só existem neste navegador.">
          {ultimo ? `Último backup ${quando(ultimo)}.` : 'Sem backup ainda.'}
          <span className="hidden sm:inline"> Seu progresso só existe neste navegador.</span>
        </span>
        <button className="shrink-0 font-medium text-[var(--alerta)] hover:underline" onClick={() => exportar().then(() => setUltimo(ultimoBackup()))}>
          baixar backup
        </button>
        <button className="shrink-0 rounded-full px-1.5 text-[var(--tinta-suave)] hover:bg-[var(--papel-2)]" onClick={() => setFechado(true)} aria-label="esconder o aviso de backup" title="esconder até recarregar">
          ×
        </button>
      </div>
    </div>
  )
}
