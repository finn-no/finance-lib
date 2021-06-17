/**
 * @typedef {number} LoanAmount - the amount being loaned
 * @typedef {number} Rate - the interest rate in decimal form
 * @typedef {number} Period - number of years for the loan
 *
 * @typedef {object} AmortizationFees
 * @property {Array} principalFees - fees which are incurred only once
 * @property {Array} periodFees - fees which are incurred every payment
 *
 * @typedef {object} AmortizationBase
 * @property {LoanAmount} loanAmount
 * @property {Rate} rate
 * @property {Period} period
 *
 * @typedef {AmortizationBase & AmortizationFees} AmortizationWithFees
 */

export const nbsp = '\xa0'

/**
 * Check if value is a number
 * @type {(value: any) => boolean}
 */
export const isNumber = (value) => Number.isFinite(parseFloat(value))

/**
 * Sum all numbers found in the array
 * @type {(arr: Array) => number}
 */
export const sumArray = (arr) => arr.filter(isNumber).reduce((acc, e) => acc += parseFloat(e), 0)

/**
 * Get monthly payments for a loan
 * @type {(args: AmortizationWithFees) => number}
 */
export const amortizationWithFees = ({ loanAmount, rate, period, principalFees = [], periodFees = [] }) => _amortization({
  loanAmount: loanAmount + sumArray(principalFees),
  rate,
  period
}) + sumArray(periodFees)

/**
 * Get the loan to value ratio
 * @arg {Object} args
 * @arg {LoanAmount} args.loanAmount
 * @arg {number} args.purchasePrice - the value of the object being loaned against
 * @returns {number}
 */
export function LTVratio({ loanAmount, purchasePrice }) {
  if (purchasePrice == 0) return 1
  return roundDecimals(loanAmount / purchasePrice, 4)
}

/**
 * Round n to the decimals specified
 * @arg {number} n - the number to round
 * @arg {number} [decimals = 2] - how many decimals the result will contain
 * @returns {number}
 */
export function roundDecimals(n, decimals = 2) {
  const rounding = decimals ? Math.pow(10, decimals) : 1
  return Math.round(n * rounding) / rounding
}

/**
 * Format a number in the Norwegian locale
 * @arg {number} n - the number to format
 * @arg {number} decimals - how many decimals the result will contain
 * @returns {string}
 */
export function internationalize(n, decimals) {
  const formatter = new Intl.NumberFormat('no', {
    style: 'decimal',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return formatter.format(n)
}

/**
 * Convert a percentage to a rate
 * @arg {number} n - the number to convert
 * @returns {number}
 */
export function percentageToRate(n) {
  const sigfig = n.toString().replace(/\D/, '').length
  return Number((n / 100).toPrecision(sigfig))
}

/**
 * Convert a rate to a percentage
 * @arg {number} n - the number to convert
 * @returns {number}
 */
export function rateToPercentage(n) {
  const sigfig = parseInt(n.toString().replace(/\D/, ''), 10).toString().length
  return Number((n * 100).toPrecision(sigfig))
}

/**
 * @typedef {object} MinMax
 * @property {number} min - the minimum bound
 * @property {number} max - the maximum bound
 */

/**
 * Clamp a value between min and max
 * @type {(v: any, minmax: MinMax) => number}
 */
export const clamp = (v, { min, max }) => isNumber(v) ? Math.min(Math.max(v, min), max) : min

/**
 * Format a number as Norwegian currency
 * @type {(n: number, decimals?: number) => string}
 */
export const toMoney = (n, decimals = 0) => `${internationalize(n, decimals)}${nbsp}kr`

/**
 * Vue 3 directive for toMoney
 * @type [string, function]
 */
export const vMoney = ['money', (el, binding) => el.innerText = toMoney(binding.value, binding.arg)]

/**
 * Format a number as a percentage
 * @type {(n: number, decimals?: number) => string}
 */
export const toPercentage = (n, decimals = 2) => `${internationalize(n * 100, decimals)}${nbsp}%`

/**
 * Vue 3 directive for toPercentage
 * @type [string, function]
 */
export const vPercent = ['percent', (el, binding) => el.innerText = toPercentage(binding.value, binding.arg)]

/**
 * Calculate the effective interest for a loan
 * @arg {Object} args
 * @arg {LoanAmount} args.loanAmount
 * @arg {number} args.monthlyPayment - the loan's monthly payment
 * @arg {Period} args.period
 * @returns {number}
 */
export function effectiveInterest({ loanAmount, monthlyPayment, period }) {
  const paymentsPerYear = 12.0
  let high = 2.0
  let low = 1.0
  let guess = 0.0
  let previousGuess = 0
  let precision = 5
  let guessLimit = Math.pow(10, -1 * precision)
  do {
    previousGuess = guess
    guess = (high - low) / 2.0 + low
    var prov = (monthlyPayment * guess * (1.0 - Math.pow(guess, period * paymentsPerYear))) /
      (1.0 - guess) /
      Math.pow(guess, period * paymentsPerYear + 1)
    if (prov < loanAmount) high = guess
    else low = guess
  } while (Math.abs(guess - previousGuess) > guessLimit)
  const foundRate = Math.pow(guess, paymentsPerYear)
  return roundDecimals(foundRate - 1, 4)
}

/**
 * Get monthly payments for a loan
 * @arg {AmortizationBase} args
 * @returns {number}
 */
export function _amortization({ loanAmount, rate, period }) {
    // https://github.com/essamjoubori/finance.js
    const ratePerPeriod = rate / 12
    const buildNumerator = (numInterestAccruals) => ratePerPeriod * Math.pow((1 + ratePerPeriod), numInterestAccruals)
    const numerator = buildNumerator(period * 12)
    const denominator = Math.pow((1 + ratePerPeriod), period * 12) - 1
    const am = loanAmount * (numerator / denominator)
    return roundDecimals(am)
}

/**
 * Get the month and year for an offset from a base date
 * @arg {number} i - the offset index
 * @arg {Date} d - the base date
 * @returns {{ year: number, month: number }}
 */
export function dateAtIndex(i, d = new Date()) {
    const offset = i + d.getMonth()
    const yearsAhead = Math.floor(offset / 12)
    const year = d.getFullYear() + yearsAhead
    const month = offset - (yearsAhead * 12)
    return { year, month }
}

/**
 * Groups an array of objects by the attribute specified
 * @type {(attr: string) => (arr: Array) => Object<string, Array>}
 */
export const _groupBy = attr => arr => arr.reduce((acc, e) => ((acc[e[attr]] = acc[e[attr]] || []).push(e), acc), {})

/**
 * Creates a payback schedule for a loan
 * @arg {AmortizationWithFees} args
 * @returns { Array }
 */
export function paymentPlanFromToday({ loanAmount, rate, period, principalFees = [], periodFees = [] }) {
  const months = period * 12
  const monthlyRate = rate / 12
  let remainder = loanAmount
  const baseDownPayment = _amortization({ loanAmount, rate, period })
  const date = new Date()
  return Array.from({ length: months }, (_, i) => {
    const feesPaid = sumArray(periodFees) + (i == 0 ? sumArray(principalFees) : 0)
    const interest = Math.floor(remainder * monthlyRate)
    const downPayment = Math.ceil(Math.min((baseDownPayment - interest), remainder))
    remainder -= downPayment
    return { downPayment, feesPaid, remainder, interest, ...dateAtIndex(i + 1, date) }
  })
}

// not in use anywhere
// export function paymentPlanSerial({ loanAmount, rate, period, etableringsgebyr = 0, termingebyr = 0, depotgebyr = 0 }) {
//   const months = period * 12
//   const monthlyRate = rate / 12
//   let remainder = loanAmount
//   let downPayment = Math.ceil(loanAmount / months)
//   return Array.from({ length: months }, () => {
//     const interest = Math.floor(remainder * monthlyRate)
//     downPayment = Math.ceil(Math.min(downPayment, remainder))
//     remainder -= downPayment
//     return { downPayment, remainder, interest }
//   })
// }
