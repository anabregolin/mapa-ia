import { useState } from 'react'
import { entrarComCodigo, enviarCodigo, NUVEM_CONFIGURADA, sair, sincronizar, useNuvem, type Situacao } from '../lib/nuvem'

const TEXTO: Record<Situacao, string> = {
  desligada: '',
  saiu: '',
  sincronizando: '⟳ sincronizando…',
  ok: '✓ sincronizado',
  offline: '○ sem internet: guarda aqui e envia quando voltar',
  erro: '⚠ não consegui sincronizar',
}

const hora = (t: number) => new Date(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

/** Seção "Sincronizar entre aparelhos" do painel Aa. */
export function AjustesNuvem() {
  const st = useNuvem()
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [etapa, setEtapa] = useState<'email' | 'codigo'>('email')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  if (!NUVEM_CONFIGURADA) return null

  const tentar = async (f: () => Promise<void>) => {
    setOcupado(true)
    setErro(null)
    try {
      await f()
    } catch (e) {
      setErro((e as Error).message)
    }
    setOcupado(false)
  }

  return (
    <div className="space-y-3 border-t border-[var(--linha)] pt-4">
      <div className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--tinta-suave)]">Sincronizar entre aparelhos</div>

      {st.email ? (
        <>
          <p className="text-sm text-[var(--tinta)]">
            Entrou como <strong className="text-[var(--tinta-forte)]">{st.email}</strong>. Seu progresso vai sozinho para a nuvem e aparece no outro aparelho quando você abrir o app lá.
          </p>
          <p className="text-xs text-[var(--tinta-suave)]">
            {TEXTO[st.situacao]}
            {st.situacao === 'ok' && st.ultimaVez ? ` às ${hora(st.ultimaVez)}` : ''}
            {st.erro ? ` (${st.erro})` : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            <button className="botao-suave" onClick={() => sincronizar()} disabled={st.situacao === 'sincronizando'}>
              ⟳ sincronizar agora
            </button>
            <button className="botao-suave" onClick={() => tentar(sair)} disabled={ocupado}>
              sair
            </button>
          </div>
          <p className="text-xs text-[var(--tinta-suave)]">
            As gravações de áudio não vão para a nuvem: continuam só neste aparelho e no backup em arquivo. Se você mexer nos dois aparelhos sem internet, o app junta tudo quando
            voltar; algo que você apagou num deles pode reaparecer.
          </p>
        </>
      ) : etapa === 'email' ? (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault()
            tentar(async () => {
              await enviarCodigo(email.trim())
              setEtapa('codigo')
            })
          }}
        >
          <p className="text-sm text-[var(--tinta)]">Entre com o seu e-mail no PC e no celular para o progresso ficar igual nos dois. Sem senha: chega um código no e-mail.</p>
          <div className="flex flex-wrap gap-2">
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-[var(--linha)] bg-[var(--papel)] px-3 py-1.5 text-sm text-[var(--tinta-forte)]"
            />
            <button className="botao-foco" disabled={ocupado}>
              {ocupado ? 'enviando…' : 'enviar código'}
            </button>
          </div>
        </form>
      ) : (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault()
            tentar(() => entrarComCodigo(email.trim(), codigo))
          }}
        >
          <p className="text-sm text-[var(--tinta)]">
            Mandei um código para <strong>{email}</strong>. Pode demorar um minuto; olhe também o spam.
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="código"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="w-32 rounded-lg border border-[var(--linha)] bg-[var(--papel)] px-3 py-1.5 text-sm tracking-widest text-[var(--tinta-forte)]"
            />
            <button className="botao-foco" disabled={ocupado || !codigo.trim()}>
              {ocupado ? 'entrando…' : 'entrar'}
            </button>
            <button type="button" className="botao-suave" onClick={() => setEtapa('email')}>
              voltar
            </button>
          </div>
        </form>
      )}
      {erro && <p className="rounded-xl bg-[var(--alerta-claro)] px-3 py-2 text-sm text-[var(--tinta-forte)]">{erro}</p>}
    </div>
  )
}
