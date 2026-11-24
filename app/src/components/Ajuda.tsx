// Ajuda (FAQ): o "como funciona" de cada parte do app, num lugar só, fora das telas de estudo.
// Ícones e tags se explicam na própria dica (Dica.tsx); aqui fica o porquê e o passo a passo.
/* eslint-disable react/jsx-key -- as respostas ficam em pares [pergunta, resposta]; a lista renderizada usa a pergunta como key */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CORES_PADRAO, TINTA } from '../lib/marcas'
import { INTERVALOS_PADRAO, MINUTOS_PADRAO } from '../lib/revisita'
import { usePainel } from '../lib/paineis'
import { PainelLateral } from './Painel'
import { Expande } from './Abrir'

export type SecaoAjuda = 'trilha' | 'topico' | 'testes' | 'revisao' | 'marcas' | 'anotacoes' | 'ferramentas' | 'dados'

const dias = INTERVALOS_PADRAO.join(', ')

const P = ({ children }: { children: ReactNode }) => <p className="text-sm leading-relaxed text-[var(--tinta)]">{children}</p>
const B = ({ children }: { children: ReactNode }) => <strong className="font-semibold text-[var(--tinta-forte)]">{children}</strong>

/** perguntas de cada seção: [pergunta, resposta] */
const SECOES: { id: SecaoAjuda; icone: string; titulo: string; itens: [string, ReactNode][] }[] = [
  {
    id: 'trilha',
    icone: '🧭',
    titulo: 'Trilha e provas',
    itens: [
      [
        'O que é a trilha?',
        <P>
          Os tópicos vistos em aula, agrupados por módulo, na ordem das aulas. Toque num módulo para abrir os tópicos dele. O ▸ “continuar” do rodapé abre o último tópico aberto,
          se ainda não foi entendido; senão, o primeiro que falta.
        </P>,
      ],
      ['O que querem dizer as tags e bolinhas?', <P>Passe o mouse em cima (no celular, toque) de qualquer tag, bolinha ou chip para ver o que ele quer dizer.</P>],
      [
        'Provas e recortes',
        <P>
          <B>P1, P2, E1, E2 e E3</B> seguem a divisão do programa; cada uma mostra só os tópicos dela. A escolha fica no topo da trilha, ao lado do nome; nela dá para editar uma
          aba, criar uma sua (outra prova, um trabalho, um resumo) ou voltar à divisão do programa. Dentro de um tópico, o 📑 diz em quais abas ele aparece.
        </P>,
      ],
      [
        'E os tópicos extras?',
        <P>Os extras (não vistos em aula) ficam escondidos na trilha geral. Para mostrar: ⚙ Configurações › Estudo. Numa aba, aparece o que ela marca, inclusive extras.</P>,
      ],
      [
        'De onde vem o “≈ 15 min” de cada tópico?',
        <P>
          É um palpite, não uma medida: tamanho do texto (pesado pelo nível), páginas de slide citadas, fórmulas, cálculos, exercícios e cartões, arredondado de 5 em 5. Passe o
          mouse para ver a conta. Depois que você abre o tópico, o palpite sai e fica só o tempo que você já estudou. No cabeçalho de cada módulo aparece a soma dos tópicos dele. O
          “falta” do topo é a soma dos que ainda não foram entendidos.
        </P>,
      ],
    ],
  },
  {
    id: 'topico',
    icone: '📖',
    titulo: 'Dentro de um tópico',
    itens: [
      [
        'Por que o texto vem em camadas?',
        <P>
          Para começar pela ideia mais simples e só descer quando ela estiver clara: <B>Pensa assim</B>, <B>Com o nome certo</B> (as palavras da prova), <B>Mergulho</B>,{' '}
          <B>Pegadinha</B>, <B>Fórmulas</B>, <B>Praticar</B>, <B>Lembrar</B> e a <B>cola de revisão</B>. Nem todo tópico tem todas. O botão ↓ no fim do texto abre a próxima; a
          régua no topo mostra quantas você já abriu. As setas ← → do rodapé trocam de tópico.
        </P>,
      ],
      [
        'O que tem em “Sobre este tópico”?',
        <P>
          Palavras-chave, de que tópicos ele depende, para quais ele abre caminho e de onde veio o conteúdo. Se algum de que ele depende ainda não foi entendido, dá para seguir,
          mas aquele ajuda a entender este.
        </P>,
      ],
      [
        '“Entendi” e “ainda confuso, volto depois”',
        <P>
          Ficam no fim do tópico. <B>Entendi</B> conta no progresso e agenda o tópico para voltar em Relembrar ({dias} dias depois). <B>⚑ Volto depois</B> põe o tópico na lista ⚑
          da trilha.
        </P>,
      ],
      [
        'Onde ficam as outras revisões',
        <P>
          Fora do tópico, para ele ficar só com o estudo. Explicar para alguém e os slides da aula ficam na Revisão, onde você escolhe o assunto. Para levar um assunto ao caderno,
          use “+ assunto” em Anotações › Caderno. Os trechos marcados ficam em Anotações.
        </P>,
      ],
      ['Como o tempo de estudo é contado?', <P>Só conta com a aba do navegador visível e você mexendo nos últimos 2 minutos.</P>],
      ['Pausa para relembrar', <P>Depois de {MINUTOS_PADRAO} minutos lendo um tópico (muda em ⚙ Configurações › Estudo), o app sugere parar e tentar lembrar sem olhar.</P>],
    ],
  },
  {
    id: 'testes',
    icone: '✎',
    titulo: 'Testes',
    itens: [
      [
        'Por que um teste antes de ler?',
        <P>
          Ao abrir um tópico novo, vêm até 3 questões. Errar aqui é esperado: o objetivo é ler sabendo o que procurar, e errar antes ajuda a prestar atenção. Dá para desligar em ⚙
          Configurações › Estudo.
        </P>,
      ],
      [
        'Teste do fim do tópico',
        <P>Questões sobre o tópico inteiro (10 por padrão; muda em ⚙ Configurações › Estudo). Abaixo de 70% de acertos, o tópico vai para Pontos fracos.</P>,
      ],
      [
        'O que é “errou com certeza”?',
        <P>
          Ao responder você diz se tinha certeza. Errar com certeza mostra uma ideia que você acha que sabe, mas não sabe: ela vai para Pontos fracos e volta primeiro nos próximos
          testes.
        </P>,
      ],
      ['Teste geral da aba', <P>O 📝 da trilha mistura os tópicos da prova escolhida, os mais fracos primeiro.</P>],
      ['Teste de relembrar', <P>Sem olhar o texto. Acertar 2 de 3 conta como “lembrei”.</P>],
    ],
  },
  {
    id: 'revisao',
    icone: '🔁',
    titulo: 'Revisão',
    itens: [
      [
        '🗂 Cartões',
        <P>
          Responda de memória e compare com a resposta. O que você errar volta no fim da sessão; o que acertar sobe uma caixa e demora mais para voltar. Escrever a resposta antes
          de virar é mais lento, mas mostra o que você realmente lembra (liga e desliga em ⚙ › Estudo).
        </P>,
      ],
      [
        '⏱ Relembrar',
        <P>
          Abra o tópico, tente lembrar sem ler e marque se lembrou. Cada “lembrei” leva o tópico para a próxima volta ({dias} dias, por padrão); “esqueci” recomeça. Os intervalos
          mudam em ⚙ Configurações › Estudo.
        </P>,
      ],
      ['🎯 Pontos fracos', <P>Tópicos com menos de 70% no teste do fim e questões que você errou tendo certeza.</P>],
      [
        '🗣 Explicar para alguém',
        <P>
          Escolha o assunto no topo da aba e escreva ou grave como se ensinasse a outra pessoa. Depois releia ou ouça: onde travou é o que falta estudar. Os áudios ficam só neste
          navegador e entram no backup em arquivo; para guardar um solto, use “baixar”.
        </P>,
      ],
      [
        '🖼 Slides da aula',
        <P>
          Escolha um assunto para folhear as aulas dele e toque no 📌 das páginas que valem: elas ficam listadas aqui e aparecem dentro do texto do tópico. As imagens são geradas
          no seu computador (“npm run slides”) e não vão para o site publicado.
        </P>,
      ],
      [
        '🧮 Treino de cálculo',
        <P>
          Resolva passo a passo (cada passo confere na hora) ou escreva seu próprio desenvolvimento e confira só as respostas no fim. Errou? Volta amanhã, com outros números.
          Acertou tudo? Volta cada vez mais espaçado ({dias} dias).
        </P>,
      ],
      ['📊 Seu progresso', <P>Quanto tempo você estudou, os cartões que você marcou para mudar e o que o app tem (ou não tem) para cada tópico.</P>],
    ],
  },
  {
    id: 'marcas',
    icone: '🖍',
    titulo: 'Marca-texto e tags',
    itens: [
      [
        'Como marcar um trecho?',
        <P>
          Selecione um trecho do texto de um tópico e escolha uma cor. Depois dá para escrever uma nota sobre ele. Em navegador que não pinta o texto, as marcas continuam salvas e
          listadas em Anotações.
        </P>,
      ],
      [
        'O que significa cada cor?',
        <div className="space-y-2">
          <P>Cada cor tem um objetivo, que você muda em ⚙ Configurações › Marca-texto. O padrão:</P>
          <ul className="flex flex-wrap gap-1.5">
            {CORES_PADRAO.map((c) => (
              <li key={c.id} className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: TINTA[c.id].fundo, color: TINTA[c.id].forte }}>
                {TINTA[c.id].nome}: {c.objetivo}
              </li>
            ))}
          </ul>
        </div>,
      ],
      [
        'E as tags?',
        <ul className="space-y-1 text-sm text-[var(--tinta)]">
          <li>
            <B># livre</B>: um texto seu, como “revisar sábado”. Maiúsculas e acentos não contam.
          </li>
          <li>
            <B>▤ prova ou recorte</B>: liga o trecho a uma aba da trilha (P2, por exemplo).
          </li>
          <li>
            <B>↔ tópico</B>: liga o trecho a outro tópico; tocar abre esse tópico.
          </li>
          <li className="text-[var(--tinta-suave)]">Em Anotações, tocar numa tag filtra os trechos dela.</li>
        </ul>,
      ],
      ['Arquivar apaga?', <P>Não. A marca sai da lista de Anotações, mas o grifo continua no texto, e dá para desarquivar.</P>],
    ],
  },
  {
    id: 'anotacoes',
    icone: '📝',
    titulo: 'Anotações, quadro e caderno',
    itens: [
      ['Anotações', <P>O que você escreveu no 📝 de cada tópico, os trechos marcados e os post-its, juntos por tópico. O mais recente fica em cima.</P>],
      ['Quadro de ideias', <P>Post-its soltos que você arrasta. Eles também aparecem em Anotações, junto do tópico.</P>],
      [
        'Caderno',
        <P>
          Páginas por assunto que você monta com o que já existe no app e com coisas suas. Um bloco que aponta para outra coisa (post-it, marca, anotação, explicação) edita a
          original: mudar num lugar muda no outro. Fotos e áudios ficam só neste navegador.
        </P>,
      ],
    ],
  },
  {
    id: 'ferramentas',
    icone: '🍅',
    titulo: 'Pomodoro e calculadora',
    itens: [
      [
        'Pomodoro',
        <P>
          Foco, pausa curta e pausa longa, com os minutos e quantos focos até a pausa longa ajustáveis. Na trilha e no tópico ele fica no rodapé; dá para arrastar e comprimir.
        </P>,
      ],
      [
        'Calculadora',
        <P>
          Científica, com sin, cos e tan em radianos ou graus e “Ans” para o resultado anterior. Na trilha e no tópico o 🧮 fica no rodapé, ao lado do pomodoro; dá para arrastar e
          comprimir.
        </P>,
      ],
    ],
  },
  {
    id: 'dados',
    icone: '💾',
    titulo: 'Seus dados e backup',
    itens: [
      [
        'Onde fica o meu progresso?',
        <P>
          Só neste navegador. Baixe um backup de vez em quando (⚙ Configurações › Dados) e guarde o arquivo fora dele: Drive, pendrive, e-mail para você. A barra amarela no topo
          avisa quando faz tempo.
        </P>,
      ],
      [
        'E as cópias automáticas?',
        <P>
          Uma por dia (as últimas 7) e uma antes de cada restauração. Servem para desfazer um engano, mas somem se você limpar os dados do site e não guardam as gravações de áudio.
          Por isso o arquivo baixado é o que vale.
        </P>,
      ],
      [
        'Armazenamento persistente',
        <P>
          Quando o navegador marca o site como persistente, ele não apaga os dados sozinho se faltar espaço no disco. Sem isso, pode apagar: mais um motivo para baixar o backup.
        </P>,
      ],
      [
        'Sincronizar na nuvem',
        <P>
          Com a nuvem ligada, o progresso vai para os seus aparelhos. As gravações de áudio não vão: ficam só no aparelho e no backup em arquivo. Se você mexer em dois aparelhos
          sem internet, o app junta tudo quando voltar, e algo apagado num deles pode reaparecer.
        </P>,
      ],
    ],
  },
]

/** Uma pergunta que abre e fecha como sanfona. `abrir`: veio de um link para esta parte da ajuda. */
function Pergunta({ pergunta, resposta, abrir }: { pergunta: string; resposta: ReactNode; abrir: boolean }) {
  const [aberta, setAberta] = useState(abrir)
  // um link novo para esta parte abre a pergunta (ajuste durante a renderização, sem efeito)
  const [abrirAntes, setAbrirAntes] = useState(abrir)
  if (abrir !== abrirAntes) {
    setAbrirAntes(abrir)
    if (abrir) setAberta(true)
  }
  return (
    <div className="px-4">
      <button className="flex w-full items-center gap-2 py-2.5 text-left text-sm font-medium text-[var(--tinta-forte)]" onClick={() => setAberta(!aberta)} aria-expanded={aberta}>
        <span className="min-w-0 flex-1">{pergunta}</span>
        <span className={`text-[var(--tinta-suave)] transition-transform ${aberta ? 'rotate-90' : ''}`} aria-hidden>
          ▸
        </span>
      </button>
      <Expande aberto={aberta}>
        <div className="pb-3">{resposta}</div>
      </Expande>
    </div>
  )
}

export function PainelAjuda({ aberto, fechar }: { aberto: boolean; fechar: () => void }) {
  const secao = usePainel((s) => s.secaoAjuda)
  const lista = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!aberto || !secao) return
    // espera a gaveta montar para rolar até a seção pedida
    const t = setTimeout(() => {
      lista.current?.querySelector(`#ajuda-${secao}`)?.scrollIntoView({ block: 'start' })
    }, 60)
    return () => clearTimeout(t)
  }, [aberto, secao])

  return (
    <PainelLateral aberto={aberto} fechar={fechar} titulo="Ajuda" sub="Como cada parte funciona">
      <div ref={lista} className="space-y-6">
        {SECOES.map((s) => (
          <section key={s.id} id={`ajuda-${s.id}`} className="scroll-mt-2">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--tinta-forte)]">
              <span aria-hidden>{s.icone}</span>
              {s.titulo}
            </h3>
            <div className="divide-y divide-[var(--linha)] rounded-2xl border border-[var(--linha)] bg-[var(--cartao)]">
              {s.itens.map(([pergunta, resposta]) => (
                <Pergunta key={pergunta} pergunta={pergunta} resposta={resposta} abrir={secao === s.id} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </PainelLateral>
  )
}
