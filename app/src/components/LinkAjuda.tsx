// "?" pequeno que abre a Ajuda numa seção. Arquivo próprio para o Painel poder usar sem importar a Ajuda (que importa o Painel).
import { usePainel } from '../lib/paineis'
import type { SecaoAjuda } from './Ajuda'

/** "?" pequeno que abre a Ajuda já na seção certa: substitui os textos de explicação nas telas. */
export function LinkAjuda({ secao, className = '' }: { secao: SecaoAjuda; className?: string }) {
  const abrir = usePainel((s) => s.abrir)
  return (
    <button
      type="button"
      onClick={() => abrir('ajuda', secao)}
      className={`inline-grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--papel-2)] align-middle text-[11px] font-semibold text-[var(--tinta-suave)] transition-colors hover:bg-[var(--foco-claro)] hover:text-[var(--foco)] ${className}`}
      aria-label="como funciona (abre a ajuda)"
      title="como funciona"
    >
      ?
    </button>
  )
}
