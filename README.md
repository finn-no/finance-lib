# finance-lib

#### standards for variables

1. `rate` is always a value between 0 and 1, never a percentage - conversely a perentage is `rate * 100`
2. `period` is always expressed in years

#### terms

- purchasePrice: kjøpesum
- downPayment: egenkapital
- loanAmount _or_ principal: lånesum
  - principal is avoided since loanAmount is sufficiently correct and is a direct translation
- term _or_ period: nedbetalingstid
  - term is avoided so termingebyr can easily be searched for
- LTVratio (loan to value): belåningsgrad
- collateral: securityValue
