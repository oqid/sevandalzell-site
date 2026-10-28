---
title: "MECHENG 706: Autonomous robot"
start: 2026
role: Motion control & system integration
tags: [Circuit Design, Firmware, Control Systems, Project Management]
order: 4
media:
  - video: https://res.cloudinary.com/vcdy572c/video/upload/v1782980344/706_movie_crop2_jzgbyt.mp4
    poster: https://res.cloudinary.com/vcdy572c/video/upload/so_0/v1782980344/706_movie_crop2_jzgbyt.jpg
    alt: The mecanum-wheeled robot turning to track a light source
    caption: "Early run: the control logic minimises the angle between the mast (the turning head) and the robot's heading, which gave simple pathfinding and continuous tracking of the target."
  - image: ./706_audacity.jpg
    alt: Laptop showing an Audacity spectrogram next to the robot on a lab bench
    caption: With the wheel spokes tapping my student ID card each rotation, the recording had distinct peaks I could time to infer wheel speed.
  - image: ./706_blowtorch.jpg
    alt: Close-up of the robot's wiring and sensors
  - image: ./706-grouphoto.jpg
    alt: Our group of four with the robot in the lab
    caption: We look a little shell-shocked, as this was right after the live demo.
---

A four-mecanum-wheeled sensing and actuation platform built for MECHENG 706, tasked with avoiding obstacles while pursuing a point light source to "extinguish". In Project 2 our group of four implemented hierarchical behavioural control, powered by sensor fusion across ten infrared, phototransistor, ultrasonic and IMU sensors. I led motion PID control, as well as system integration and high-level planning with Eesha Mahimkar.

The most interesting problem-solving moment came from not having a tachometer to calibrate each motor's RPM: I used the spectrogram in the free audio software *Audacity* as a time ruler to estimate each wheel's speed at the same voltage.
