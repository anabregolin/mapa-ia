// Sincronização do progresso entre aparelhos, via Supabase (login por código no e-mail).
//
// Como funciona (simples de propósito):
// - Na nuvem há UMA linha por pessoa: o estado inteiro (o mesmo que vai para o localStorage) e um número de versão.
// - Cada aparelho lembra a versão da nuvem que viu por último ("base") e se mudou algo desde então ("sujo").
// - Ao sincronizar:
//     nuvem igual à base e nada mudou aqui  → nada a fazer
//     nuvem igual à base e mudou algo aqui  → envia (só se a nuvem ainda estiver na base; senão repete)
//     nuvem mudou e nada mudou aqui         → traz a da nuvem
//     nuvem mudou e mudou algo aqui também  → junta as duas (ver `juntar`), guarda uma cópia automática antes e envia
// - Sincroniza: ao abrir, 4 s depois de cada mudança, ao voltar para a aba/app, ao sair dela e a cada minuto.
// Gravações de áudio NÃO vão para a nuvem (são pesadas): continuam só no backup em arquivo.

import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { useSyncExternalStore } from 'react'
import { useMapa } from '../store/useMapa'
import { guardarCopia, temProgresso } from './backup'
import { juntar } from './juntar'

const URL_SUPABASE = import.meta.env.VITE_SUPABASE_URL as string | undefined
const CHAVE_SUPABASE = import.meta.env.VITE_SUPABASE_KEY as string | undefined
export const NUVEM_CONFIGURADA = !!(URL_SUPABASE && CHAVE_SUPABASE)

const TABELA = 'progresso'
const CHAVE_META = 'mapa-ia:nuvem'
/** o cronômetro do pomodoro é do aparelho, não do estudo */
const SO_DESTE_APARELHO = ['pomodoro']

type Estado = Record<string, unknown>
interface NaNuvem {
  /** versão do formato do store (a do persist) */
  formato: number
  mudouEm: number
  estado: Estado
}
interface Meta {
  /** versão da nuvem vista por último; null = este aparelho nunca sincronizou */
  base: number | null
  sujo: boolean
  mudouEm: number
}

// ---------- estado observável pela tela ----------

export type Situacao = 'desligada' | 'saiu' | 'sincronizando' | 'ok' | 'offline' | 'erro'
interface Status {
  situacao: Situacao
  email: string | null
  ultimaVez: number | null
  erro: string | null
}
let status: Status = { situacao: NUVEM_CONFIGURADA ? 'saiu' : 'desligada', email: null, ultimaVez: null, erro: null }
const ouvintes = new Set<() => void>()
const mudarStatus = (m: Partial<Status>) => {
  status = { ...status, ...m }
  ouvintes.forEach((f) => f())
}
export const useNuvem = () =>
  useSyncExternalStore(
    (f) => (ouvintes.add(f), () => ouvintes.delete(f)),
    () => status,
  )

// ---------- meta no localStorage ----------

function lerMeta(): Meta {
  try {
    const m = JSON.parse(localStorage.getItem(CHAVE_META) ?? 'null')
    if (m && typeof m === 'object') return m
  } catch {
    /* sem meta */
  }
  return { base: null, sujo: false, mudouEm: 0 }
}
const gravarMeta = (m: Meta) => {
  try {
    localStorage.setItem(CHAVE_META, JSON.stringify(m))
  } catch {
    /* sem espaço: na pior das hipóteses junta de novo na próxima */
  }
}

// ---------- estado do store ----------

function estadoLocal(): Estado {
  const parcial = { ...(useMapa.persist.getOptions().partialize!(useMapa.getState()) as Estado) }
  for (const k of SO_DESTE_APARELHO) delete parcial[k]
  return parcial
}

let aplicando = false
function aplicar(e: Estado) {
  const limpo = { ...e }
  for (const k of SO_DESTE_APARELHO) delete limpo[k]
  aplicando = true
  try {
    useMapa.setState(limpo)
  } finally {
    aplicando = false
  }
}

// ---------- Supabase ----------

let cliente: Promise<SupabaseClient> | null = null
const supa = () =>
  (cliente ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(URL_SUPABASE!, CHAVE_SUPABASE!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }),
  ))

let sessao: Session | null = null

export async function enviarCodigo(email: string) {
  const { error } = await (await supa()).auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
  if (error) throw new Error(traduzir(error.message))
}

export async function entrarComCodigo(email: string, codigo: string) {
  const { data, error } = await (await supa()).auth.verifyOtp({ email, token: codigo.trim(), type: 'email' })
  if (error) throw new Error(traduzir(error.message))
  sessao = data.session
  mudarStatus({ email: sessao?.user.email ?? email, erro: null })
  await sincronizar()
}

export async function sair() {
  await (await supa()).auth.signOut()
  sessao = null
  // na próxima vez que entrar, este aparelho junta com a nuvem em vez de supor que já está igual
  gravarMeta({ ...lerMeta(), base: null, sujo: true })
  mudarStatus({ situacao: 'saiu', email: null, erro: null })
}

function traduzir(msg: string) {
  if (/expired|invalid/i.test(msg)) return 'Código errado ou vencido. Peça outro.'
  if (/rate|too many|seconds/i.test(msg)) return 'Muitos pedidos seguidos. Espere um minuto e tente de novo.'
  if (/fetch|network/i.test(msg)) return 'Sem internet agora.'
  return msg
}

// ---------- sincronizar ----------

let rodando: Promise<void> | null = null
let deNovo = false

/** Uma sincronização por vez; se pedirem outra no meio, roda mais uma no fim. */
export function sincronizar(): Promise<void> {
  if (!sessao) return Promise.resolve()
  if (rodando) {
    deNovo = true
    return rodando
  }
  rodando = (async () => {
    do {
      deNovo = false
      await umaVez()
    } while (deNovo)
  })().finally(() => (rodando = null))
  return rodando
}

async function umaVez() {
  if (!navigator.onLine) return mudarStatus({ situacao: 'offline' })
  mudarStatus({ situacao: 'sincronizando' })
  try {
    const db = await supa()
    const uid = sessao!.user.id
    const formato = useMapa.persist.getOptions().version ?? 0
    // até 3 tentativas se outro aparelho enviar bem no meio
    let feito = false
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      const meta = lerMeta()
      const { data: linha, error } = await db.from(TABELA).select('estado, versao').eq('user_id', uid).maybeSingle()
      if (error) throw error
      const remoto = linha as { estado: NaNuvem; versao: number } | null

      // primeira vez de todas: a nuvem está vazia
      if (!remoto) {
        const { error: e } = await db.from(TABELA).insert({ user_id: uid, estado: { formato, mudouEm: meta.mudouEm || Date.now(), estado: estadoLocal() }, versao: 1 })
        if (e?.code === '23505') continue // outro aparelho criou antes: tenta de novo, agora juntando
        if (e) throw e
        gravarMeta({ ...lerMeta(), base: 1, sujo: false })
        feito = true
        break
      }
      if (remoto.estado.formato > formato) throw new Error('A nuvem tem dados de uma versão mais nova do app. Recarregue a página para atualizar.')

      // aparelho que nunca sincronizou: se já tem estudo aqui, junta; se está vazio, só traz
      const sujo = meta.base === null ? temProgresso() : meta.sujo
      const nuvemMudou = remoto.versao !== meta.base

      if (!nuvemMudou && !sujo) {
        feito = true
        break
      }
      if (nuvemMudou && !sujo) {
        // mudou algo aqui enquanto esperava a nuvem: não sobrescreve, recomeça juntando
        if (lerMeta().sujo) continue
        aplicar(remoto.estado.estado)
        gravarMeta({ base: remoto.versao, sujo: false, mudouEm: remoto.estado.mudouEm })
        feito = true
        break
      }
      let enviar = estadoLocal()
      let mudouEm = meta.mudouEm || Date.now()
      if (nuvemMudou) {
        guardarCopia('antes de juntar com a nuvem')
        enviar = juntar(enviar, remoto.estado.estado, mudouEm >= remoto.estado.mudouEm)
        mudouEm = Math.max(mudouEm, remoto.estado.mudouEm)
        aplicar(enviar)
      }
      // só grava se ninguém gravou depois que eu li (versão ainda igual)
      const { data: ok, error: e } = await db
        .from(TABELA)
        .update({ estado: { formato, mudouEm, estado: enviar }, versao: remoto.versao + 1, atualizado: new Date().toISOString() })
        .eq('user_id', uid)
        .eq('versao', remoto.versao)
        .select('versao')
      if (e) throw e
      if (!ok?.length) continue
      // se mudou algo aqui enquanto enviava, continua sujo
      const agora = lerMeta()
      gravarMeta({ base: remoto.versao + 1, sujo: agora.mudouEm > mudouEm, mudouEm: agora.mudouEm })
      if (agora.mudouEm > mudouEm) deNovo = true
      feito = true
      break
    }
    if (!feito) throw new Error('Outro aparelho está gravando ao mesmo tempo. Tento de novo daqui a pouco.')
    mudarStatus({ situacao: 'ok', ultimaVez: Date.now(), erro: null })
  } catch (e) {
    const msg = (e as Error).message ?? String(e)
    mudarStatus({ situacao: navigator.onLine ? 'erro' : 'offline', erro: navigator.onLine ? traduzir(msg) : null })
  }
}

// ---------- ligar ----------

let espera: ReturnType<typeof setTimeout> | undefined

/** Chamar uma vez ao abrir o app. */
export async function iniciarNuvem() {
  if (!NUVEM_CONFIGURADA) return

  // toda mudança no que é salvo marca o aparelho como "sujo" e agenda um envio
  useMapa.subscribe((s, antes) => {
    if (aplicando) return
    const chaves = Object.keys(useMapa.persist.getOptions().partialize!(s) as Estado).filter((k) => !SO_DESTE_APARELHO.includes(k))
    if (!chaves.some((k) => (s as unknown as Estado)[k] !== (antes as unknown as Estado)[k])) return
    gravarMeta({ ...lerMeta(), sujo: true, mudouEm: Date.now() })
    clearTimeout(espera)
    espera = setTimeout(sincronizar, 4000)
  })

  document.addEventListener('visibilitychange', () => {
    clearTimeout(espera)
    sincronizar()
  })
  addEventListener('online', () => sincronizar())
  addEventListener('offline', () => mudarStatus({ situacao: 'offline' }))
  setInterval(() => document.visibilityState === 'visible' && sincronizar(), 60_000)

  const db = await supa()
  sessao = (await db.auth.getSession()).data.session
  db.auth.onAuthStateChange((_ev, s) => {
    sessao = s
    if (!s) mudarStatus({ situacao: 'saiu', email: null })
  })
  if (!sessao) return mudarStatus({ situacao: 'saiu' })
  mudarStatus({ email: sessao.user.email ?? null })

  await sincronizar()
}
