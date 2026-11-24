// Rodapé das páginas que não têm um próprio (revisão, anotações, configurações, mapa, treinos…).
// Trilha e tópico montam o deles, com os botões de seguir; aqui ficam as ferramentas e o caminho de volta ao estudo.
import { topicoPorId } from '../content/topicos'
import { useMapa } from '../store/useMapa'
import { BotaoCalculadora } from './Calculadora'
import { BotaoPomodoro } from './Pomodoro'
import { RodapeFixo } from './RodapeFixo'

export function RodapeGeral() {
  const ultimo = useMapa((s) => s.ultimo)
  const tp = ultimo ? topicoPorId.get(ultimo) : undefined
  return (
    <RodapeFixo rotulo="rodapé" largura="max-w-6xl">
      <BotaoPomodoro />
      <BotaoCalculadora />
      <span className="flex min-w-0 flex-1 justify-end">
        {tp ? (
          <a href={`#/t/${tp.id}`} className="botao-suave flex min-w-0 max-w-full items-center gap-1.5" title={`voltar a estudar: ${tp.titulo}`}>
            <span className="min-w-0 truncate">
              <span className="text-[var(--tinta-suave)]">continuar: </span>
              {tp.titulo}
            </span>
            <span aria-hidden>→</span>
          </a>
        ) : (
          <a href="#/" className="botao-suave">
            ir para a trilha →
          </a>
        )}
      </span>
    </RodapeFixo>
  )
}
