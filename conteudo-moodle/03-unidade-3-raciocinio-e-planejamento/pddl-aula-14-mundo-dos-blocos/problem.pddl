(define (problem exemplo-mundo-blocos-posicoes)
  (:domain mundo-blocos-posicoes)

  (:objects A B C D - bloco
            P1 P2 P3 - posicao)

  (:init
    (NaMesa A P1)
    (NaMesa B P2)
    (NaMesa C P3) (Sobre D C) 
    (Livre A) (Livre B) (Livre D)
    (BracoLivre)
  )

  (:goal (and
    (Sobre A B)
    (Sobre B D)
    (NaMesa C P3)
    (NaMesa D P2)
  ))
)
