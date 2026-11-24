// Camada "Lembrar": três jeitos de puxar da memória, não só cartões.
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { CARTOES } from '../content/cartoes'
import { palavrasDoTopico } from '../content/palavras'
import { topicoPorId } from '../content/topicos'
import { ancestrais } from '../lib/grafo'
import { CartoesDoTopico } from './Ferramentas'

type Modo = 'cartoes' | 'folha' | 'misturado'

const MODOS: { id: Modo; nome: string; dica: string }[] = [
  { id: 'cartoes', nome: 'Cartões', dica: 'pergunta na frente, resposta atrás' },
  { id: 'folha', nome: 'Folha em branco', dica: 'escreva tudo que lembrar, sem olhar' },
  { id: 'misturado', nome: 'Misturado', dica: 'este tópico com os que vêm antes dele' },
]

const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

/** A palavra-chave conta como lembrada se as partes com 3+ letras aparecem no que você escreveu. */
function lembrou(chave: string, escrito: string) {
  const texto = normalizar(escrito)
  const partes = normalizar(chave)
    .split(/[^a-z0-9*]+/)
    .filter((p) => p.length >= 3)
  return partes.length ? partes.every((p) => texto.includes(p)) : texto.includes(normalizar(chave))
}

function FolhaEmBranco({ id }: { id: string }) {
  const tp = topicoPorId.get(id)!
  const chaves = useMemo(() => palavrasDoTopico(id, 8), [id])
  const [texto, setTexto] = useState('')
  const [conferido, setConferido] = useState(false)
  const achadas = chaves.filter((c) => lembrou(c, texto))

  return (
    <div>
      <p className="text-sm text-[var(--tinta-suave)]">
        Sem rolar a página para cima: escreva tudo que você lembra de <strong className="text-[var(--tinta-forte)]">{tp.titulo}</strong>. Frases soltas valem. Puxar da memória
        segura mais do que reler.
      </p>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        disabled={conferido}
        rows={6}
        placeholder="O que eu lembro…"
        className="fonte-leitura mt-3 w-full resize-y rounded-2xl border border-[var(--linha)] bg-[var(--papel)] p-4 text-[var(--tinta-forte)] outline-none focus:border-[var(--foco)]"
      />
      {!conferido ? (
        <button className="botao-foco mt-2" disabled={!texto.trim()} onClick={() => setConferido(true)}>
          conferir
        </button>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
          {chaves.length > 0 && (
            <>
              <p className="text-sm text-[var(--tinta)]">
                Palavras-chave que apareceram no que você escreveu: {achadas.length} de {chaves.length}. A conferência é só por palavra; o que você explicou com outras palavras também vale.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {chaves.map((c) => {
                  const ok = achadas.includes(c)
                  return (
                    <span key={c} className={`rounded-full px-2.5 py-0.5 text-sm ${ok ? 'bg-[var(--menta-claro)] text-[var(--tinta-forte)]' : 'bg-[var(--alerta-claro)] text-[var(--tinta-forte)]'}`}>
                      {ok ? '✓' : '○'} {c}
                    </span>
                  )
                })}
              </div>
            </>
          )}
          <div className="mt-3 rounded-2xl bg-[var(--papel)] p-4">
            <div className="rotulo-formula">em uma frase</div>
            <p className="fonte-leitura mt-1">{tp.resumo}</p>
          </div>
          <button
            className="botao-suave mt-3"
            onClick={() => {
              setTexto('')
              setConferido(false)
            }}
          >
            tentar de novo
          </button>
        </motion.div>
      )}
    </div>
  )
}

/** Cartões deste tópico intercalados com os dos tópicos que ele pressupõe (até 8 no total). */
function cartoesMisturados(id: string) {
  const antes = new Set(ancestrais(id))
  const meus = CARTOES.filter((c) => c.topico === id)
  const deles = CARTOES.filter((c) => antes.has(c.topico) && (c.tipo === 'conceito' || c.tipo === 'lacuna' || c.tipo === 'formula'))
  // pega dos mais próximos primeiro: quem está mais perto na trilha
  deles.sort((a, b) => b.etapa - a.etapa)
  const lista = []
  const outros = deles.slice(0, Math.max(3, 8 - meus.length))
  for (let i = 0; i < Math.max(meus.length, outros.length); i++) {
    if (outros[i]) lista.push(outros[i])
    if (meus[i]) lista.push(meus[i])
  }
  return lista.slice(0, 10)
}

export function Lembrar({ id }: { id: string }) {
  const [modo, setModo] = useState<Modo>('cartoes')
  const misturados = useMemo(() => cartoesMisturados(id), [id])
  const modos = MODOS.filter((m) => m.id !== 'misturado' || misturados.some((c) => c.topico !== id))

  return (
    <div>
      <div className="flex flex-wrap gap-1.5" role="tablist">
        {modos.map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={modo === m.id}
            title={m.dica}
            onClick={() => setModo(m.id)}
            className={`rounded-xl px-3 py-1.5 text-sm transition-colors ${modo === m.id ? 'bg-[var(--foco)] text-white' : 'bg-[var(--papel-2)] text-[var(--tinta)] hover:bg-[var(--linha)]'}`}
          >
            {m.nome}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-[var(--tinta-suave)]">{MODOS.find((m) => m.id === modo)!.dica}</p>
      <div className="mt-4" role="tabpanel">
        {modo === 'cartoes' && <CartoesDoTopico key="c" id={id} />}
        {modo === 'folha' && <FolhaEmBranco id={id} />}
        {modo === 'misturado' && <CartoesDoTopico key="m" id={id} lista={misturados} />}
      </div>
    </div>
  )
}
