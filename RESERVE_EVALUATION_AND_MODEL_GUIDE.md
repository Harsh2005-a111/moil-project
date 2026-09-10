# Reserve Evaluation and Model Interpretation Guide

## 1) What the portal is actually doing

The platform evaluates manganese prospectivity in two separate ways:

1. Coordinate-based evaluation
2. Satellite-image-based evaluation

Both paths ultimately answer the same questions:
- Is this location a valid manganese target?
- What is the estimated Mn grade in the reserve?
- How much reserve tonnage may exist?
- How much of that tonnage can realistically be extracted after operational losses?

---

## 2) Case A: Latitude/Longitude coordinate is provided

This path is implemented in the backend reserve estimation and prospecting APIs.

### Evaluation flow

- First, the system checks commodity context using the coordinate.
- If the location is a known non-Mn commodity area (coal, iron, urban, barren ground, etc.), the system returns a hard stop:
  - `prediction_status = NON_MN_COMMODITY`
  - `manganese_reserve_probability = 0.0`
  - `predicted_ore_grade_pct = 0.0`
  - `estimated_tonnage_kt = 0.0`

This is the protection layer that prevents false Mn reserve predictions at non-Mn sites.

### If the coordinate is not rejected
The engine then builds a feature vector from:
- SWIR absorption values
- NDVI
- land surface temperature
- rainfall
- soil moisture
- magnetic anomaly (EMAG2)
- elevation
- lithology / tectonic context

It then runs the Mn model.

### Model output interpretation

The key outputs are:
- `manganese_reserve_probability`: probability that the site is Mn-bearing
- `predicted_ore_grade_pct`: estimated Mn grade in the reserve
- `estimated_tonnage_kt`: reserve tonnage proxy
- `viable_extractable_tonnage_kt`: recoverable tonnage after extraction assumptions
- `extraction_recovery_pct`: percentage recoverable in practice

### Decision thresholds used in the logic
- Grade < 10% Mn: non-economic mineral waste / overburden
- 10% to 25% Mn: low-grade / beneficiable ore
- > 25% Mn: marketable ore prospect

This means the system is not only saying “Mn or not”; it is also classifying ore quality.

---

## 3) Case B: Satellite image is provided

This path is implemented in the satellite router.

### Evaluation flow
The image is converted into spectral features from bands such as:
- B02, B03, B04, B08, B11, B12

The system then calculates:
- NDVI
- SWIR absorption indices
- MMI / ferric / ferrous ratios
- moisture / thermal indicators
- magnetic anomaly proxy from geologic context

These spectral and geo-environmental features are fed into the machine learning model.

### Image-specific safeguards
- Built-up urban zones are screened out as zero-grade / sterile
- non-Mn commodity zones are blocked before Mn inference
- out-of-distribution or uncertain zones are flagged as inconclusive rather than forced into a reserve estimate

### Output interpretation
The image-based path returns:
- `manganese_probability_pct`
- `estimated_grade_pct`
- `total_available_reserves_kt`
- `viable_extractable_tonnage_kt`
- `extraction_recovery_pct`
- `decision` such as `BENEFICIABLE ORE PROSPECT`, `MARKETABLE ORE PROSPECT`, or `MINERAL WASTE`

---

## 4) What is the difference between total Mn % in the reserve and extracted Mn %?

This is the most important distinction.

### A. Total Mn % present in the reserve
This is the geological grade estimate.

It tells us how much Mn is present in the ore body itself.

Example:
- reserve grade = 18.5% Mn
- this means the ore body is estimated to contain about 18.5% manganese by grade

This is not the same thing as recovered metal.

### B. Extracted / recoverable Mn %
This is the operational recovery fraction.

The code uses values such as:
- 80% recovery for marketable ore
- 60% recovery for low-grade beneficiable ore
- 0% recovery for non-economic waste

This is calculated as:

$$\text{Recoverable\_Tonnes} = \text{Total\_Reserve\_Tonnes} \times \text{Recovery\_Pct}$$

So if total reserve tonnage is 1000 kt and recovery is 60%, then:

$$\text{Recoverable\_Tonnes} = 1000 \times 0.60 = 600\;\text{kt}$$

---

## 5) How the sliders affect prediction

The operational constraint sliders in the portal are not changing the geology of the deposit. They are changing expected production losses.

The scenario engine evaluates:
- rainfall intensity
- equipment failure rate
- blasting delay
- grade variation

Then it calculates:

$$\text{Predicted\_Actual} = \text{Base\_Tonnage} - \text{Rain\_Loss} - \text{Equipment\_Loss} - \text{Blast\_Loss} - \text{Grade\_Loss}$$

and

$$\text{Shortfall\_Pct} = \frac{\text{Base\_Tonnage} - \text{Predicted\_Actual}}{\text{Base\_Tonnage}} \times 100$$

So if the sliders are increased:
- more tonnage is lost to weather, breakdowns, delays, and grade dilution
- actual realized production drops
- the portal shows a lower output than the base reserve estimate

### Important point
The sliders do not redefine the reserve grade itself.
They modify the recoverable operating output from that reserve.

So the reserve may still be estimated at 18% Mn, but actual mined output may be lower because of losses from weather, equipment, or blasting constraints.

---

## 6) How the model estimates grade from probability

The prospecting logic approximates the grade as a function of the Mn-probability score.

A simplified form is:

$$\text{Grade}_{Mn} \approx 16.0 + (\text{Probability} \times 34.0)$$

Then it clips the value into realistic ranges.

This produces a continuous estimated grade percentage from the model score.

Example:
- probability = 0.60
- grade estimate = 16 + 0.60*34 = 36.4% Mn

That is then classified as:
- low-grade / beneficiable if around 10-25%
- marketable if above 25%
- waste if below 10%

---

## 7) What the portal is effectively telling the user

The portal is combining three layers of logic:

1. Is this a valid Mn target at all?
   - commodity gate checks this first

2. How much Mn is likely in the ore body?
   - probability and grade estimate

3. How much of that can be recovered in real operations?
   - recovery percentage + slider-driven losses

This is why the result set typically contains both:
- geological reserve / grade
- operational extraction / recoverable tonnage

---

## 8) Short answer for the dashboard

When the user supplies a coordinate or satellite image, the system evaluates:
- geological prospectivity
- estimated grade
- reserve tonnage
- extraction recovery
- operational losses under the chosen constraints

The total Mn percentage in the reserve is the grade estimate.
The extracted Mn percentage is the operational recovery percentage applied to that reserve.

The model is not using the slider values to invent the reserve grade; it uses the sliders to determine how much of the reserve will actually be realized under operational conditions.

---

## 9) Real project implementation notes

The production guard to stop false positives is enforced before Mn estimation in the backend resource and satellite routes. This is the intended architecture for this project, rather than hardcoding each non-Mn location manually.

The earlier issue with coal or iron sites being misclassified as Mn-bearing was prevented by the commodity-context gate, which returns a non-Mn result before the ML model can run.

---

## 10) Summary formula set

$$P_{Mn} = f(\text{SWIR}, \text{NDVI}, \text{LST}, \text{EMAG2}, \text{lithology}, \text{climate}, \text{coordinates})$$

$$\text{Grade}_{Mn} \approx 16 + 34 \times P_{Mn}$$

$$\text{Total\_Reserve\_Tonnage} = g(\text{grade}, \text{area}, \text{depth}, \text{context})$$

$$\text{Recoverable\_Tonnage} = \text{Total\_Reserve\_Tonnage} \times \text{Recovery\_Pct}$$

$$\text{Actual\_Output} = \text{Base\_Tonnage} - \text{Rain\_Loss} - \text{Equipment\_Loss} - \text{Blasting\_Loss} - \text{Grade\_Loss}$$

---

This sheet is intended as a practical explanation of the reserve evaluation logic and the meaning of the KPIs displayed in the portal.
