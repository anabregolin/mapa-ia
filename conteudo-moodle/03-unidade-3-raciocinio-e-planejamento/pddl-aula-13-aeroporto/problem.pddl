(define (problem ex1)
  (:domain airport)
  (:requirements :strips :typing)

  (:objects
    C1 C2 - cargo
    P1 P2 - plane
    JFK SFO - airport
  )

  (:init
    (At C1 SFO) (At C2 JFK)
    (At P1 SFO) (At P2 JFK)
    (Cargo C1) (Cargo C2)
    (Plane P1) (Plane P2)
    (Airport JFK) (Airport SFO)
  )

  (:goal (and
    (At C1 JFK)
    (At C2 SFO)
  ))
)
