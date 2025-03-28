# Property Metrics Guide

## Visual Indicators

### Table Layout
- **Gray Background Cells**: Calculated or auto-generated fields that are derived from input data
- **White Background Cells**: Input fields that contain user-entered data

### Color-Coded Metrics

The Property Analyzer uses color-coding to quickly highlight the quality of key metrics.

#### Rent Ratio
The monthly rent divided by the total investment (Offer Price + Rehab Costs)

| Color  | Meaning | Value |
|--------|---------|-------|
| 🔴 Red | Poor    | < 0.9% |
| 🟡 Yellow | Acceptable | >= 0.9% |
| 🟢 Green | Good | >= 1.0% |

#### ARV Ratio
The total investment (Offer Price + Rehab Costs) divided by the After Repair Value

| Color  | Meaning | Value |
|--------|---------|-------|
| 🟢 Green | Excellent | <= 75% |
| 🟡 Yellow | Acceptable | <= 85% |
| 🔴 Red | Risky | > 85% |

#### Score
The overall property score out of 10 points

| Color  | Meaning | Value |
|--------|---------|-------|
| 🔴 Red | Poor | <= 6 |
| 🟡 Yellow | Acceptable | 7-8 |
| 🟢 Green | Excellent | 9-10 |

## Score Calculation

The property score (out of 10 points) is calculated based on:

1. **Rent to Price Ratio** (4 points maximum)
   - 1.0% or higher: 4 points
   - 0.8% or higher: 3 points
   - 0.6% or higher: 2 points
   - 0.4% or higher: 1 point
   - Less than 0.4%: 0 points

2. **ARV Ratio** (3 points maximum)
   - 80% or lower: 3 points
   - 85% or lower: 2 points
   - 90% or lower: 1 point
   - Higher than 90%: 0 points

3. **Discount** (2 points maximum)
   - 15% or higher: 2 points
   - 10% or higher: 1 point
   - Less than 10%: 0 points

4. **Rehab Costs** (1 point maximum)
   - Under $50,000: 1 point
   - $50,000 or more: 0 points

The minimum score is 1, even if the calculated total is 0.

## Rentcast Data

Properties with Rentcast data show a green checkmark next to the estimated rent and price values.
Hovering over these values displays the low to high range of the Rentcast estimates. 