// Modelo de dados do mapa mental. Base: ESTRUTURA.md na raiz do projeto.

export type UnidadeId = 'u1' | 'u2' | 'u3' | 'u4' | 'u5'

/** 1 = básico, 2 = intermediário, 3 = avançado */
export type Nivel = 1 | 2 | 3

export interface Fonte {
  /** nome do arquivo em conteudo-moodle/ sem extensão, ex.: "aula-06-busca-local-hc-sa" */
  arquivo: string
  paginas?: string
}

export interface Unidade {
  id: UnidadeId
  titulo: string
  cor: string
}

export interface Grupo {
  id: string
  unidade: UnidadeId
  titulo: string
}

export interface Topico {
  id: string
  titulo: string
  unidade: UnidadeId
  grupo: string
  nivel: Nivel
  /** posição na linha do tempo (Etapa.pos) em que o tópico aparece */
  etapa: number
  resumo: string
  fontes: Fonte[]
  /** conteúdo escrito a partir de listas/provas, sem slide próprio */
  semSlide?: boolean
  /** está no programa mas não foi visto em aula */
  naoVisto?: boolean
}

export type TipoConexao = 'prereq' | 'parecido'

export interface Conexao {
  de: string
  para: string
  tipo: TipoConexao
  /** explicação curta da ligação (mostrada ao passar o mouse) */
  nota?: string
}

export interface Etapa {
  pos: number
  titulo: string
  aulas: string
  unidade?: UnidadeId
  avaliacao?: boolean
}

/** Um passo de uma fórmula animada: montagem → substituição → resultado */
export interface Passo {
  rotulo: string
  latex: string
  explicacao?: string
}

export interface Variavel {
  simbolo: string
  descricao: string
}

export interface Formula {
  id: string
  nome: string
  latex: string
  topicos: string[]
  variaveis?: Variavel[]
  exemplo?: {
    titulo: string
    fonte?: Fonte
    passos: Passo[]
  }
  aviso?: string
}

/** Explicação em camadas, da mais simples para a mais técnica. Aceita $latex$ no meio do texto. */
export interface Camadas {
  /** abertura, antes de tudo: o que é, pra que serve e onde é usado, em poucas palavras */
  oQueE?: {
    e: string
    serve: string
    /** um exemplo por item: aparece em tópicos */
    onde: string[]
    /** aviso abaixo dos exemplos (ex.: conteúdo que não foi dado em aula) */
    aviso?: string
  }
  intuicao: string
  definicao: string
  detalhe: string
  /** pegadinha ou erro comum de prova */
  cuidado?: string
}

export interface EntradaCalc {
  id: string
  rotulo: string
  valor: number
  min?: number
  max?: number
  passo?: number
}

export interface Calculadora {
  entradas: EntradaCalc[]
  /** devolve a conta com os valores substituídos e o resultado, em LaTeX */
  calcular: (v: Record<string, number>) => { conta: string; resultado: string; nota?: string }
}

export type StatusExercicio = 'gabarito' | 'conferido' | 'resolver' | 'aberto' | 'trabalho'

/** Um passo da resolução de um exercício. Texto aceita $latex$; `latex` vira bloco de destaque. */
export interface PassoExercicio {
  texto: string
  latex?: string
}

export interface Exercicio {
  /** estável: o progresso salvo no navegador usa este id */
  id: string
  fonte: string
  questao: string
  topicos: string[]
  status: StatusExercicio
  /** depende de uma figura do PDF que ainda precisa ser redesenhada */
  figura?: boolean
  /** id de uma demo (DEMOS) que redesenha a figura */
  demo?: string
  enunciado?: string
  dica?: string
  passos?: PassoExercicio[]
  resposta?: string
}

export type ProgressoExercicio = 'feito' | 'duvida'

export interface Demo {
  id: string
  titulo: string
  topicos: string[]
  /** caminho em public/demos/, URL externa, ou id de componente interno (componente: true) */
  url: string
  externa?: boolean
  componente?: boolean
}
