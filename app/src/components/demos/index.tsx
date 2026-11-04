import type { ReactNode } from 'react'
import { DemoArvore } from './DemoArvore'
import { DemoBusca } from './DemoBusca'
import { DemoHill } from './DemoHill'
import { DemoKNN } from './DemoKNN'

/** Demos feitas no próprio app: o campo `url` da demo é a chave aqui. */
export const DEMOS_INTERNAS: Record<string, () => ReactNode> = {
  'busca:romenia': () => <DemoBusca grafoInicial="romenia" />,
  'busca:rs': () => <DemoBusca grafoInicial="rs" />,
  'busca:sg': () => <DemoBusca grafoInicial="sg" />,
  'arvore:l2-q22': () => <DemoArvore arvoreInicial="l2-q22" />,
  'arvore:e1': () => <DemoArvore arvoreInicial="e1" />,
  hill: () => <DemoHill />,
  knn: () => <DemoKNN />,
}
