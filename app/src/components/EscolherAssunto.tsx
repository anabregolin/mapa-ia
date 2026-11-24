// Escolher de qual assunto é uma revisão (slides, explicação, página do caderno).
// Um <select> nativo agrupado por unidade: no celular abre o seletor do sistema, que é mais fácil de rolar que uma lista nossa.
import { TOPICOS, UNIDADES } from '../content/topicos'

export function EscolherAssunto({
  valor,
  escolher,
  rotulo = 'Assunto',
  vazio = 'escolha um assunto…',
  marcar,
  className = '',
}: {
  valor: string | null
  escolher: (id: string) => void
  rotulo?: string
  vazio?: string
  /** sinal ao lado do nome (ex.: "✓" para os que já têm explicação) */
  marcar?: (id: string) => string | undefined
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium text-[var(--tinta-suave)]">{rotulo}</span>
      <select
        value={valor ?? ''}
        onChange={(e) => e.target.value && escolher(e.target.value)}
        className="w-full rounded-xl border border-[var(--linha)] bg-[var(--cartao)] px-3 py-2.5 text-sm text-[var(--tinta-forte)] outline-none focus:border-[var(--foco)]"
      >
        <option value="" disabled>
          {vazio}
        </option>
        {UNIDADES.map((u) => (
          <optgroup key={u.id} label={u.titulo}>
            {TOPICOS.filter((t) => t.unidade === u.id).map((t) => {
              const sinal = marcar?.(t.id)
              return (
                <option key={t.id} value={t.id}>
                  {sinal ? `${t.titulo}  ${sinal}` : t.titulo}
                </option>
              )
            })}
          </optgroup>
        ))}
      </select>
    </label>
  )
}
