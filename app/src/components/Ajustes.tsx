// Cabeçalho com os painéis laterais 🔁 Revisão, 📝 Anotações e ? Ajuda, e o botão ⚙ que leva à página de Configurações.
// Os resumos de Revisão e Anotações ficam em Painel.tsx; as configurações, em Configuracoes.tsx.
import { usePainel, type PainelId } from '../lib/paineis'
import { PainelAjuda } from './Ajuda'
import { PainelLateral, ResumoAnotacoes, ResumoRevisao, RodapeAnotacoes, RodapeRevisao, usePendentesRevisao } from './Painel'

/* ───────────── os painéis e os botões do cabeçalho ───────────── */

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
      <PainelAjuda aberto={aberto === 'ajuda'} fechar={fechar} />
    </>
  )
}

const BOTOES: { id: PainelId | 'config'; icone: string; nome: string }[] = [
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
          onClick={() => (b.id === 'config' ? (location.hash = '#/configuracoes') : abrir(b.id))}
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
