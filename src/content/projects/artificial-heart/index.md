---
title: Downsizing the SynCardia Total Artificial Heart
start: 2026
role: Final-year honours project, Mechatronics Engineering, University of Auckland
tags: [Biomedical Engineering, CFD, ANSYS CFX, Python, Medical Device Design, Research]
order: 2
media:
  - image: ./tah-1-flow.webp
    alt: Blood paths flowing through the heart’s valve into the outflow tube, coloured by shear stress, with the chamber and valve outlined in white.
  - image: ./tah-5-dose.webp
    alt: Simulated blood paths coloured by shear stress at three points in the pumping stroke. Below them, damage maps show half the damage falls in under 0.5% of the chamber, at the valve.
  - image: ./tah-3-result_alt.webp
    alt: Predicted red blood cell damage across the pumping stroke. The 35 cc heart matches the 50 cc at 120 BPM, but is about 1.9 times higher at 171 BPM.
  - image: ./tah-alt-triptych_alt.webp
    alt: The artificial heart from three angles, drawn as glowing blood paths, purple in the chamber and orange through the valve. Faint dots trace the walls.
  - image: ./tah-4-code.webp
    alt: Blood paths with one highlighted as it loops through the valve, beside the Python function that totals its damage.
---

Could a smaller artificial heart fit children and smaller adults without doing more damage to blood? I modelled the 50 cc SynCardia ventricle and a 35 cc version scaled down from it. I simulated five stages of systole in ANSYS CFX, then wrote a Python pipeline that follows about 5,000 blood pathlines per case and predicts red blood cell damage and platelet exposure along each one.

At the same heart rate, the 35 cc chamber showed no increase in predicted damage per pass. When it pumped faster to match the 50 cc’s output, predicted damage rose about 1.9×, consistent with a similarity-scaling prediction I derived before running the 35 cc cases. Half the damage happens in under 0.5% of the volume, at the outflow valve. That points future design work at the valve rather than the chamber.
