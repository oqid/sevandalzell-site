---
title: 'Ampera: sEMG-Adaptive Motorised Cable Trainer'
start: 2026
role: Team of four · University of Auckland
tags: [Mechatronics, Mechanical Design, CAD, Biomechanics, sEMG, Rehabilitation Engineering, Human–Robot Interaction, User Research]
order: 3
media:
  - image: ./ampera-1-exploded.webp
    alt: Exploded CAD view of the Ampera cable unit, showing the housing, frameless brushless motor, belt and pulleys, rope spool, swivelling head with its bearing ring, and the battery pack.
  - image: ./ampera-2-sketch.webp
    alt: Hand-drawn concept sketch of the sEMG-informed cable training machine, with the cable unit, a wearable sEMG pod with surface electrodes, and two units pinned to a squat rack.
  - image: ./ampera-3-internals.webp
    alt: CAD render of the cable unit with its lid off, showing the motor, the 3:1 belt drive up to the rope spool, the swivelling cable head, and the battery cells beside the PCB.
  - image: ./ampera-4-top-view.webp
    alt: Labelled top-down CAD view of the cable unit identifying the rotating head, CubeMars RO100 motor, HTD belt, spool, housing, rack bracket, 13S1P battery and PCB.
  - image: ./ampera-5-control-loop.webp
    alt: Control-loop diagram. The phone app sets the load each rep, the unit controller holds the force a thousand times a second, the motor pulls the cable and the user pulls the handle, while cable length, angle, tension and sEMG muscle activity feed back to the controller.
  - image: ./ampera-6-joint-torque.webp
    alt: Two-part figure. Top, a top-down arm model linking the shoulder, elbow and hand to the cable head through cable length and angle. Bottom, a plot of shoulder torque against adduction angle, where the force-vector estimate tracks the actual torque within 2.5 percent and a length-only estimate drifts.
---

Ampera grew out of my own training in the gym, and out of following a dancer friend’s rehab journey. Cable machines apply a fixed load and give no sign of which muscles are actually doing the work. Ampera is a compact motorised cable unit that pins to any squat rack. It adjusts resistance each rep based on muscle activation, which it reads from wireless surface-EMG pods worn on the body.

A frameless brushless motor drives a Dyneema rope spool through a 3:1 belt, giving up to 100 kg of tension. A swivelling head with an encoder and a two-axis load cell measures the direction and force of the pull. From that, the unit estimates the user’s joint angles and shoulder torque from its own sensors. A pair of units on one rack forms a dual-cable station that can train each side to equal effort and track left-right asymmetry, for rehab and strength training.

My role: I led the concept, ran the end-user interview, and did the early mechanical design and analytical feasibility work. The interview shaped a new perturbation mode and joint-torque resistance profiles.
