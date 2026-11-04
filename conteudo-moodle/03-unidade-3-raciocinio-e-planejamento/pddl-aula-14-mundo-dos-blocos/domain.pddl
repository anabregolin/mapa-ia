(define (domain mundo-blocos-posicoes)
  (:requirements :strips :typing)
  (:types bloco posicao)

  (:predicates
    (Sobre ?x ?y - bloco)           	; bloco x está sobre y
    (NaMesa ?x - bloco ?p - posicao)    ; bloco x está na posição p da mesa
    (Livre ?x - bloco)              	; topo de x está livre
    (Segurando ?x - bloco)          	; braço está segurando x
    (BracoLivre)           		; braço está livre
    (PosicaoLivre ?p - posicao)     	; posição p esta livre
  )

  (:action Pegar
    :parameters (?x - bloco ?p - posicao)
    :precondition (and (Livre ?x) (NaMesa ?x ?p) (BracoLivre))
    :effect (and (Segurando ?x) (not (NaMesa ?x ?p)) (not (Livre ?x)) (not (BracoLivre)) (PosicaoLivre ?p))
  )

  (:action Largar
    :parameters (?x - bloco ?p - posicao)
    :precondition (and (Segurando ?x) (PosicaoLivre ?p)) 
    :effect (and (NaMesa ?x ?p) (Livre ?x) (BracoLivre) (not (Segurando ?x)) (not (PosicaoLivre ?p)))
  )

  (:action Empilhar
    :parameters (?x ?y - bloco)
    :precondition (and (Segurando ?x) (Livre ?y))
    :effect (and (Sobre ?x ?y) (Livre ?x) (BracoLivre) (not (Segurando ?x)) (not (Livre ?y)))
  )

  (:action Desempilhar
    :parameters (?x ?y - bloco)
    :precondition (and (Sobre ?x ?y) (Livre ?x) (BracoLivre))
    :effect (and (Segurando ?x) (Livre ?y) (not (Sobre ?x ?y)) (not (Livre ?x)) (not (BracoLivre)))
  )
)
