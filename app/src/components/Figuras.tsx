// Diagramas próprios (SVG) que entram no meio das camadas de explicação.
// Os números saem das próprias explicações (content/explicacoes.ts); confira lá antes de mudar.
import type { ReactNode } from 'react'

type CamadaFigura = 'intuicao' | 'definicao' | 'detalhe'
interface Figura {
  camada: CamadaFigura
  legenda: string
  desenho: ReactNode
}

const T = { fontSize: 13, fill: 'var(--tinta)' } as const
const TF = { fontSize: 13, fill: 'var(--tinta-forte)', fontWeight: 600 } as const
const PEQ = { fontSize: 11, fill: 'var(--tinta-suave)' } as const

function Caixa({ x, y, w, h = 44, cor = 'var(--linha)', fundo = 'var(--cartao)', children }: { x: number; y: number; w: number; h?: number; cor?: string; fundo?: string; children: ReactNode }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={12} fill={fundo} stroke={cor} strokeWidth={1.5} />
      <text x={x + w / 2} y={y + h / 2} textAnchor="middle" dominantBaseline="central" {...TF}>
        {children}
      </text>
    </g>
  )
}

const Seta = ({ x1, y1, x2, y2, rotulo, lado = 1 }: { x1: number; y1: number; x2: number; y2: number; rotulo?: string; lado?: 1 | -1 }) => (
  <g>
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--tinta-suave)" strokeWidth={1.5} markerEnd="url(#ponta)" />
    {rotulo && (
      <text x={(x1 + x2) / 2 + 8 * lado} y={(y1 + y2) / 2} textAnchor={lado === 1 ? 'start' : 'end'} dominantBaseline="central" {...PEQ}>
        {rotulo}
      </text>
    )}
  </g>
)

const Ponta = () => (
  <defs>
    <marker id="ponta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="var(--tinta-suave)" />
    </marker>
  </defs>
)

// ── Bayes: árvore de frequências do exemplo da meningite ──────────────
const bayes = (
  <svg viewBox="0 0 560 300">
    <Ponta />
    <Caixa x={190} y={10} w={180}>1.000.000 pessoas</Caixa>
    <Seta x1={250} y1={56} x2={130} y2={100} rotulo="× 1/50.000" lado={-1} />
    <Seta x1={310} y1={56} x2={430} y2={100} />
    <Caixa x={40} y={102} w={180} cor="var(--coral)">20 com meningite</Caixa>
    <Caixa x={340} y={102} w={190}>999.980 sem meningite</Caixa>
    <Seta x1={130} y1={148} x2={130} y2={192} rotulo="× 0,5 têm rigidez" />
    <Seta x1={435} y1={148} x2={435} y2={192} rotulo="o resto, até somar 1/20" lado={-1} />
    <Caixa x={40} y={194} w={180} cor="var(--coral)" fundo="color-mix(in srgb, var(--coral) 14%, var(--cartao))">
      10 com rigidez
    </Caixa>
    <Caixa x={340} y={194} w={190}>49.990 com rigidez</Caixa>
    <text x={280} y={268} textAnchor="middle" {...T}>
      Com rigidez no pescoço: 10 + 49.990 = 50.000 (é o 1/20).
    </text>
    <text x={280} y={288} textAnchor="middle" {...TF}>
      Delas, só 10 têm meningite: 10 / 50.000 = 0,0002
    </text>
  </svg>
)

// ── Condicional: o universo encolhe para as 13 cartas de copas ─────────
const CARTAS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const condicional = (
  <svg viewBox="0 0 560 150">
    <text x={10} y={18} {...PEQ}>
      Sabendo que é copas, as outras 39 cartas saem da conta:
    </text>
    {CARTAS.map((c, i) => {
      const rei = c === 'K'
      return (
        <g key={c} transform={`translate(${10 + i * 42}, 34)`}>
          <rect width={36} height={52} rx={6} fill={rei ? 'color-mix(in srgb, var(--coral) 18%, var(--cartao))' : 'var(--cartao)'} stroke={rei ? 'var(--coral)' : 'var(--linha)'} strokeWidth={rei ? 2 : 1.2} />
          <text x={18} y={22} textAnchor="middle" {...TF} fill="var(--coral)">
            {c}
          </text>
          <text x={18} y={40} textAnchor="middle" fontSize={13} fill="var(--coral)">
            ♥
          </text>
        </g>
      )
    })}
    <text x={10 + 12 * 42 + 18} y={106} textAnchor="middle" {...PEQ}>
      rei
    </text>
    <text x={280} y={136} textAnchor="middle" {...TF}>
      P(Rei | Copas) = 1 / 13
    </text>
  </svg>
)

// ── KNN: k = 3 e k = 7 dão respostas diferentes ───────────────────────
const X = (x: number) => 24 + x * 34
const Y = (y: number) => 300 - y * 34
const TRI: [number, number][] = [[5.8, 5.6], [4.2, 4.3], [6.6, 3.6], [8.8, 4.6], [8.2, 2.5], [7.6, 1.6]]
const BOL: [number, number][] = [[4.0, 5.6], [3.0, 4.0], [3.4, 6.8], [6.4, 7.0], [2.2, 7.8], [1.8, 2.4]]
const NOVO: [number, number] = [5, 5]
const tri = ([x, y]: [number, number], i: number) => (
  <path key={`t${i}`} d={`M${X(x)},${Y(y) - 8} L${X(x) + 7.5},${Y(y) + 5.5} L${X(x) - 7.5},${Y(y) + 5.5} z`} fill="var(--coral)" />
)
const knn = (
  <svg viewBox="0 0 400 320">
    <circle cx={X(NOVO[0])} cy={Y(NOVO[1])} r={2.52 * 34} fill="none" stroke="var(--foco)" strokeWidth={1.5} strokeDasharray="5 5" />
    <circle cx={X(NOVO[0])} cy={Y(NOVO[1])} r={1.25 * 34} fill="color-mix(in srgb, var(--coral) 10%, transparent)" stroke="var(--coral)" strokeWidth={1.5} />
    {TRI.map(tri)}
    {BOL.map(([x, y], i) => (
      <circle key={`b${i}`} cx={X(x)} cy={Y(y)} r={7} fill="var(--foco)" />
    ))}
    <circle cx={X(NOVO[0])} cy={Y(NOVO[1])} r={9} fill="var(--cartao)" stroke="var(--tinta-forte)" strokeWidth={2} />
    <text x={X(NOVO[0])} y={Y(NOVO[1]) + 1} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700} fill="var(--tinta-forte)">
      ?
    </text>
    <text x={X(5.6)} y={Y(8.3)} {...TF} fill="var(--coral)">
      k = 3: 2 ▲ × 1 ● → ▲
    </text>
    <text x={X(0)} y={Y(0) + 8} {...TF} fill="var(--foco)">
      k = 7: 3 ▲ × 4 ● → ●
    </text>
  </svg>
)

// ── Árvore de decisão: o fluxograma da intuição ───────────────────────
const arvore = (
  <svg viewBox="0 0 520 250">
    <Ponta />
    <Caixa x={180} y={10} w={160} fundo="var(--papel-2)">
      tem nuvens?
    </Caixa>
    <Seta x1={230} y1={56} x2={110} y2={106} rotulo="não" lado={-1} />
    <Seta x1={290} y1={56} x2={380} y2={106} rotulo="sim" />
    <Caixa x={30} y={108} w={160} cor="var(--menta)" fundo="var(--menta-claro)">
      ☀ não chove
    </Caixa>
    <Caixa x={300} y={108} w={170} fundo="var(--papel-2)">
      umidade alta?
    </Caixa>
    <Seta x1={350} y1={154} x2={290} y2={196} rotulo="não" lado={-1} />
    <Seta x1={420} y1={154} x2={460} y2={196} rotulo="sim" />
    <Caixa x={210} y={198} w={140} cor="var(--menta)" fundo="var(--menta-claro)">
      ☀ não chove
    </Caixa>
    <Caixa x={370} y={198} w={130} cor="var(--foco)" fundo="var(--foco-claro)">
      🌧 chove
    </Caixa>
    <text x={30} y={186} {...PEQ}>
      cinza = nó (testa um atributo)
    </text>
    <text x={30} y={204} {...PEQ}>
      colorido = folha (dá a classe)
    </text>
  </svg>
)

// ── Gini: o exemplo pai (6,6) → (5,2) e (1,4) ────────────────────────
function Grupo({ x, y, a, b, titulo, valor }: { x: number; y: number; a: number; b: number; titulo: string; valor: string }) {
  const pontos = [...Array(a).fill('a'), ...Array(b).fill('b')] as ('a' | 'b')[]
  const w = 150
  return (
    <g>
      <rect x={x} y={y} width={w} height={74} rx={12} fill="var(--cartao)" stroke="var(--linha)" strokeWidth={1.5} />
      {pontos.map((p, i) => (
        <circle key={i} cx={x + 18 + (i % 6) * 22} cy={y + 18 + Math.floor(i / 6) * 18} r={6.5} fill={p === 'a' ? 'var(--foco)' : 'var(--coral)'} />
      ))}
      <text x={x + w / 2} y={y + 64} textAnchor="middle" {...PEQ}>
        {titulo}
      </text>
      <text x={x + w / 2} y={y + 96} textAnchor="middle" {...TF}>
        {valor}
      </text>
    </g>
  )
}
const gini = (
  <svg viewBox="0 0 520 300">
    <Ponta />
    <Grupo x={185} y={6} a={6} b={6} titulo="pai: 6 e 6" valor="Gini = 0,5 (o pior com 2 classes)" />
    <Seta x1={230} y1={112} x2={140} y2={150} />
    <Seta x1={290} y1={112} x2={380} y2={150} />
    <Grupo x={50} y={152} a={5} b={2} titulo="filho 1: 5 e 2 (7 exemplos)" valor="Gini ≈ 0,408" />
    <Grupo x={320} y={152} a={1} b={4} titulo="filho 2: 1 e 4 (5 exemplos)" valor="Gini = 0,32" />
    <text x={260} y={290} textAnchor="middle" {...T}>
      Divisão: 7/12 · 0,408 + 5/12 · 0,32 ≈ 0,371 &lt; 0,5 → melhorou
    </text>
  </svg>
)

// ── Entropia × Gini com 2 classes ─────────────────────────────────────
const curva = (f: (p: number) => number, max: number) =>
  Array.from({ length: 101 }, (_, i) => {
    const p = i / 100
    return `${i ? 'L' : 'M'}${(50 + p * 400).toFixed(1)},${(230 - (f(p) / max) * 190).toFixed(1)}`
  }).join(' ')
const H = (p: number) => (p <= 0 || p >= 1 ? 0 : -p * Math.log2(p) - (1 - p) * Math.log2(1 - p))
const G = (p: number) => 2 * p * (1 - p)
const entropia = (
  <svg viewBox="0 0 520 280">
    <line x1={50} y1={230} x2={460} y2={230} stroke="var(--linha)" strokeWidth={1.5} />
    <line x1={50} y1={230} x2={50} y2={30} stroke="var(--linha)" strokeWidth={1.5} />
    <path d={curva(H, 1)} fill="none" stroke="var(--foco)" strokeWidth={2.5} />
    <path d={curva(G, 1)} fill="none" stroke="var(--coral)" strokeWidth={2.5} strokeDasharray="6 4" />
    <line x1={250} y1={230} x2={250} y2={40} stroke="var(--linha)" strokeDasharray="3 4" />
    {[0, 0.5, 1].map((v) => (
      <text key={v} x={42} y={230 - v * 190} textAnchor="end" dominantBaseline="central" {...PEQ}>
        {String(v).replace('.', ',')}
      </text>
    ))}
    {[0, 0.5, 1].map((v) => (
      <text key={v} x={50 + v * 400} y={248} textAnchor="middle" {...PEQ}>
        {String(v).replace('.', ',')}
      </text>
    ))}
    <text x={255} y={268} textAnchor="middle" {...PEQ}>
      proporção da classe 1 no nó
    </text>
    <text x={262} y={36} {...TF} fill="var(--foco)">
      entropia: máx. 1
    </text>
    <text x={262} y={128} {...TF} fill="var(--coral)">
      Gini: máx. 0,5
    </text>
    <text x={58} y={218} {...PEQ}>
      nó puro: 0
    </text>
  </svg>
)

// ── Métricas: matriz de confusão ──────────────────────────────────────
const metricas = (
  <svg viewBox="0 0 520 270">
    <text x={300} y={18} textAnchor="middle" {...PEQ}>
      PREVISTO
    </text>
    <text x={220} y={44} textAnchor="middle" {...TF}>
      positivo
    </text>
    <text x={380} y={44} textAnchor="middle" {...TF}>
      negativo
    </text>
    <text x={22} y={140} textAnchor="middle" transform="rotate(-90 22 140)" {...PEQ}>
      REAL
    </text>
    <text x={90} y={95} textAnchor="middle" {...TF}>
      positivo
    </text>
    <text x={90} y={185} textAnchor="middle" {...TF}>
      negativo
    </text>
    {[
      ['VP', 'acertou: era e disse que era', 140, 56, 'var(--menta)'],
      ['FN', 'deixou passar', 300, 56, 'var(--alerta)'],
      ['FP', 'alarme falso', 140, 146, 'var(--alerta)'],
      ['VN', 'acertou: não era', 300, 146, 'var(--menta)'],
    ].map(([s, d, x, y, cor]) => (
      <g key={s as string}>
        <rect x={x as number} y={y as number} width={160} height={84} rx={10} fill={`color-mix(in srgb, ${cor} 12%, var(--cartao))`} stroke={cor as string} strokeWidth={1.2} />
        <text x={(x as number) + 80} y={(y as number) + 36} textAnchor="middle" fontSize={22} fontWeight={700} fill="var(--tinta-forte)">
          {s}
        </text>
        <text x={(x as number) + 80} y={(y as number) + 62} textAnchor="middle" {...PEQ}>
          {d}
        </text>
      </g>
    ))}
    {/* sensibilidade: a linha dos positivos reais; precisão: a coluna dos previstos positivos */}
    <rect x={134} y={52} width={332} height={92} rx={14} fill="none" stroke="var(--foco)" strokeWidth={2} strokeDasharray="6 4" />
    <rect x={136} y={50} width={168} height={186} rx={14} fill="none" stroke="var(--coral)" strokeWidth={2} strokeDasharray="2 4" />
    <text x={476} y={96} {...TF} fill="var(--foco)" fontSize={12}>
      sensib.
    </text>
    <text x={220} y={258} textAnchor="middle" {...TF} fill="var(--coral)" fontSize={12}>
      precisão
    </text>
  </svg>
)

// ── Treino / teste ────────────────────────────────────────────────────
const treinoTeste = (
  <svg viewBox="0 0 520 130">
    <rect x={10} y={30} width={350} height={48} rx={10} fill="color-mix(in srgb, var(--foco) 20%, var(--cartao))" stroke="var(--foco)" />
    <rect x={364} y={30} width={146} height={48} rx={10} fill="color-mix(in srgb, var(--coral) 20%, var(--cartao))" stroke="var(--coral)" />
    <text x={185} y={54} textAnchor="middle" dominantBaseline="central" {...TF}>
      treino · 70%
    </text>
    <text x={437} y={54} textAnchor="middle" dominantBaseline="central" {...TF}>
      teste · 30%
    </text>
    <text x={10} y={18} {...PEQ}>
      o conjunto de dados, embaralhado e separado uma vez (como no E3)
    </text>
    <text x={185} y={100} textAnchor="middle" {...T}>
      ajusta o modelo
    </text>
    <text x={437} y={100} textAnchor="middle" {...T}>
      só no fim:
    </text>
    <text x={437} y={118} textAnchor="middle" {...T}>
      mede a generalização
    </text>
  </svg>
)

// ── Under / over fitting ──────────────────────────────────────────────
const PTS: [number, number][] = [[0.5, 1.2], [1.2, 2.6], [2, 2.9], [2.7, 4.1], [3.4, 4.0], [4.1, 4.6], [4.9, 4.3], [5.6, 4.9], [6.3, 4.3], [7, 4.1]]
function Mini({ x0, titulo, cor, d }: { x0: number; titulo: string; cor: string; d: (X: (v: number) => number, Y: (v: number) => number) => string }) {
  const XX = (v: number) => x0 + 10 + v * 21
  const YY = (v: number) => 150 - v * 24
  return (
    <g>
      <rect x={x0} y={20} width={168} height={140} rx={12} fill="var(--cartao)" stroke="var(--linha)" />
      <path d={d(XX, YY)} fill="none" stroke={cor} strokeWidth={2.5} />
      {PTS.map(([a, b], i) => (
        <circle key={i} cx={XX(a)} cy={YY(b)} r={4} fill="var(--tinta-forte)" />
      ))}
      <text x={x0 + 84} y={180} textAnchor="middle" {...TF} fill={cor}>
        {titulo}
      </text>
    </g>
  )
}
const caminho = (f: (v: number) => number) => (X: (v: number) => number, Y: (v: number) => number) =>
  Array.from({ length: 61 }, (_, i) => {
    const v = 0.2 + (i / 60) * 7
    return `${i ? 'L' : 'M'}${X(v).toFixed(1)},${Y(f(v)).toFixed(1)}`
  }).join(' ')
const fitting = (
  <svg viewBox="0 0 540 200">
    <Mini x0={4} titulo="underfitting" cor="var(--alerta)" d={caminho((v) => 2.3 + 0.36 * v)} />
    <Mini x0={186} titulo="na medida" cor="var(--menta)" d={caminho((v) => 0.6 + 1.25 * v - 0.115 * v * v)} />
    <Mini x0={368} titulo="overfitting" cor="var(--alerta)" d={(X, Y) => PTS.map(([a, b], i) => `${i ? 'L' : 'M'}${X(a)},${Y(b)}`).join(' ')} />
  </svg>
)

// ── Distâncias: A(1,2) → B(4,6) ───────────────────────────────────────
const GX = (x: number) => 40 + x * 50
const GY = (y: number) => 330 - y * 45
const distancias = (
  <svg viewBox="0 0 440 350">
    {Array.from({ length: 7 }, (_, i) => (
      <g key={i}>
        <line x1={GX(i)} y1={GY(0)} x2={GX(i)} y2={GY(7)} stroke="var(--linha)" />
        <line x1={GX(0)} y1={GY(i)} x2={GX(6)} y2={GY(i)} stroke="var(--linha)" />
      </g>
    ))}
    <path d={`M${GX(1)},${GY(2)} L${GX(4)},${GY(2)} L${GX(4)},${GY(6)}`} fill="none" stroke="var(--coral)" strokeWidth={3} />
    <line x1={GX(1)} y1={GY(2)} x2={GX(4)} y2={GY(6)} stroke="var(--foco)" strokeWidth={3} />
    <circle cx={GX(1)} cy={GY(2)} r={7} fill="var(--tinta-forte)" />
    <circle cx={GX(4)} cy={GY(6)} r={7} fill="var(--tinta-forte)" />
    <text x={GX(1) - 12} y={GY(2) + 4} textAnchor="end" {...TF}>
      A(1,2)
    </text>
    <text x={GX(4) + 12} y={GY(6) + 4} {...TF}>
      B(4,6)
    </text>
    <text x={GX(2.5)} y={GY(2) + 22} textAnchor="middle" {...PEQ}>
      3 quadras
    </text>
    <text x={GX(4) + 10} y={GY(4)} {...PEQ}>
      4 quadras
    </text>
    <text x={GX(4.9)} y={GY(3.4)} {...TF} fill="var(--coral)">
      Manhattan: 3 + 4 = 7
    </text>
    <text x={GX(4.9)} y={GY(2.9)} {...TF} fill="var(--foco)">
      Euclidiana: √(9 + 16) = 5
    </text>
    <text x={GX(4.9)} y={GY(2.4)} {...TF}>
      p → ∞: maior lado = 4
    </text>
  </svg>
)

const FIGURAS: Record<string, Figura> = {
  'u4.condicional': { camada: 'detalhe', legenda: 'Condicionar é trocar o universo: de 52 cartas para as 13 de copas.', desenho: condicional },
  'u4.bayes': { camada: 'detalhe', legenda: 'O exemplo da meningite contado em pessoas, não em probabilidades. Mesmo números da explicação.', desenho: bayes },
  'u5.fitting': { camada: 'definicao', legenda: 'Os mesmos 10 pontos de treino, três modelos. O da direita passa por todos e erraria um ponto novo.', desenho: fitting },
  'u5.distancias': { camada: 'detalhe', legenda: 'O exemplo A(1,2)–B(4,6): andar pelas quadras (Manhattan) ou em linha reta (Euclidiana).', desenho: distancias },
  'u5.knn': { camada: 'definicao', legenda: 'O mesmo ponto novo muda de classe conforme o k. Por isso o k é uma escolha importante.', desenho: knn },
  'u5.arvore': { camada: 'intuicao', legenda: 'O fluxograma da intuição desenhado como árvore. Cada caminho até uma folha é uma regra “se… então”.', desenho: arvore },
  'u5.gini': { camada: 'detalhe', legenda: 'O exemplo do texto: a divisão deixa os filhos mais puros que o pai.', desenho: gini },
  'u5.entropia': { camada: 'detalhe', legenda: 'Com 2 classes as duas medidas têm o mesmo formato: zero no nó puro e máximas no meio a meio.', desenho: entropia },
  'u5.treino-teste': { camada: 'definicao', legenda: 'O teste fica guardado até o fim. Usá-lo para ajustar o modelo é trapacear consigo mesma.', desenho: treinoTeste },
  'u5.metricas': {
    camada: 'definicao',
    legenda: 'Linhas = valor real, colunas = previsto (confira sempre a convenção da questão). Sensibilidade olha a linha dos positivos reais; precisão, a coluna dos previstos positivos.',
    desenho: metricas,
  },
}

export function FiguraDoTopico({ id, camada }: { id: string; camada: CamadaFigura }) {
  const f = FIGURAS[id]
  if (!f || f.camada !== camada) return null
  return (
    <figure className="mx-0 mb-0 mt-5">
      <div role="img" aria-label={f.legenda} className="overflow-x-auto rounded-2xl bg-[var(--papel)] p-3 [&_svg]:mx-auto [&_svg]:block [&_svg]:h-auto [&_svg]:w-full [&_svg]:min-w-[480px] [&_svg]:max-w-[560px]">
        {f.desenho}
      </div>
      <figcaption className="mt-2 text-sm text-[var(--tinta-suave)]">
        {f.legenda}
        <span className="sm:hidden"> (Arraste a figura para o lado para ver tudo.)</span>
      </figcaption>
    </figure>
  )
}
