import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import {
  sumArray,
  amortizationWithFees,
  paymentPlanFromToday,
  _amortization,
  _groupBy,
  effectiveInterest,
  roundDecimals,
  isNumber,
  toMoney,
  toPercentage,
  percentageToRate,
  rateToPercentage,
  dateAtIndex,
  clamp,
} from './index.js'

const Finance = suite('Finance')

Finance('isNumber', () => {
  assert.ok(isNumber(10))
  assert.ok(isNumber('10'))
  assert.ok(isNumber(10.5))
  assert.ok(isNumber('10.5'))
  assert.ok(isNumber(0))
  assert.ok(isNumber('0'))
  assert.ok(isNumber(-10))
  assert.ok(isNumber('-10'))
  assert.not(isNumber(null))
  assert.not(isNumber(undefined))
  assert.not(isNumber('NaN'))
  assert.not(isNumber(NaN))
  assert.not(isNumber('ten'))
  assert.not(isNumber(''))
})

Finance('sumArray', () => {
  const values = [1, 2, 3, 4]
  const dirtyValues = [1, undefined, 2, 3, undefined, 4]
  const nullValues = [1, null, 2, 3, undefined, 4]
  const floatValues = [1.5, 3.5, 4.5, 0.25, 0.25, undefined]
  const floatValuesAsStrings = ["1.5", "3.5", 4.5, 0.25, 0.25, undefined]
  assert.is(sumArray(values), 10)
  assert.is(sumArray(dirtyValues), 10)
  assert.is(sumArray(nullValues), 10)
  assert.is(sumArray(floatValues), 10)
  assert.is(sumArray(floatValues), sumArray(floatValuesAsStrings))
})

Finance('amortization', () => {
  assert.is(_amortization({ loanAmount: 20000, rate: 0.075, period: 5 }), 400.76);
  assert.is(_amortization({ loanAmount: 25000, rate: 0.049, period: 5 }), 470.64);
  assert.is(_amortization({ loanAmount: 2100000, rate: 0.0197, period: 25 }), 8870.3);
})

Finance('amortizationWithFees', () => {
  let etableringsgebyr = 1000
  let depotgebyr = 1000
  let termingebyr = 100
  assert.is(amortizationWithFees({ loanAmount: 20000, rate: 0.075, period: 5 }), 400.76);
  assert.is(amortizationWithFees({ loanAmount: 19000, rate: 0.075, period: 5, principalFees: [etableringsgebyr] }), 400.76);
  etableringsgebyr = 2000
  assert.is(amortizationWithFees({ loanAmount: 2100000, rate: 0.0197, period: 25, principalFees: [etableringsgebyr, depotgebyr], periodFees: [termingebyr] }), 8982.97);
})

const between = (midpoint, value) => value >= (midpoint - .0003) && value <= (midpoint + .0003)

Finance('effectiveInterest', () => {
  const r1 = effectiveInterest({ loanAmount: 17000, monthlyPayment: 518, period: 5 })
  assert.ok(between(.3046, r1))

  const r2 = effectiveInterest({ loanAmount: 25000, monthlyPayment: 561, period: 5 })
  assert.ok(between(.1311, r2))

  const r3 = effectiveInterest({ loanAmount: 2100000, monthlyPayment: 8870, period: 25 })
  assert.ok(between(.0199, r3))

  const r4 = effectiveInterest({ loanAmount: 4000000, monthlyPayment: 24622, period: 40 })
  assert.ok(between(.0714, r4))
})

Finance('percentage and rate conversions', () => {
  assert.is(percentageToRate(3.5), 0.035)
  assert.is(percentageToRate(2.52), 0.0252)
  assert.is(percentageToRate(10.02), 0.1002)
  assert.is(rateToPercentage(0.035), 3.5)
  assert.is(rateToPercentage(0.0252), 2.52)
  assert.is(rateToPercentage(0.1002), 10.02)
})

Finance('payment plan serial', () => {
  // const plan1 = paymentPlanSerial({ loanAmount: 4000000, rate: 0.025, period: 25 })
  // const plan2 = paymentPlanSerial({ loanAmount: 100000, rate: 0.05, period: 1, etableringsgebyr: 1000, termingebyr: 100, depotgebyr: 100 })
  // assert.is(plan1[plan1.length - 1].remainder, 0) // there shouldn't be any remainder at the end
  // assert.is(plan1[plan1.length - 1].downPayment, plan1[plan1.length - 2].remainder) // the last payment is just the remainder
  // assert.ok(plan1[plan1.length - 1].downPayment < 4000000 / 25 * 12) // the last payment is just the remainder, which is less than a normal payment
  // assert.is(plan1.length, 25 * 12) // there should be montly payments
  // t.snapshot(plan2)
})

Finance('payment plan normal', () => {
  const plan3 = paymentPlanFromToday({ loanAmount: 4000000, rate: 0.025, period: 25 })
  const plan4 = paymentPlanFromToday({ loanAmount: 100000, rate: 0.05, period: 1, etableringsgebyr: 1000, termingebyr: 100, depotgebyr: 100 })
  assert.is(plan3[plan3.length - 1].remainder, 0) // there shouldn't be any remainder at the end
  assert.is(plan3[plan3.length - 1].downPayment, plan3[plan3.length - 2].remainder) // the last payment is just the remainder
  // t.snapshot(plan4)
})

Finance('date indexing', () => {
  const now = new Date("October 26 1985 09:00")
  assert.equal(dateAtIndex(1, now), { year: now.getFullYear(), month: now.getMonth() + 1 })
  assert.is(dateAtIndex(4, now).year, now.getFullYear() + 1)
})

Finance('group by', () => {
  const arr = [{ year: 2020, v: 'a' }, { year: 2020, v: 'b' }, { year: 2021, v: 'c' }]
  const grouped = _groupBy('year')(arr)
  assert.is(grouped['2020'].length, 2)
  assert.is(Object.values(grouped).flat().length, arr.length)
  assert.is(grouped['2021'][0].v, 'c')
})

Finance('clamp', () => {
  const settings = { min: 0, max: 100 }
  assert.is(clamp(1000, settings), 100)
  assert.is(clamp(-1000, settings), 0)
  assert.is(clamp(100, settings), 100)
  assert.is(clamp(50, settings), 50)
  assert.is(clamp(NaN, settings), 0)
  assert.is(clamp(undefined, settings), 0)
  assert.is(clamp(null, settings), 0)
  assert.is(clamp('wombat', settings), 0)
})

Finance('formatting tools', () => {
  assert.is(roundDecimals(20.002), 20.0)
  assert.is(roundDecimals(20.005), 20.01)
  assert.is(roundDecimals(20.902, 0), 21)
  assert.is(roundDecimals(20.945, 2), 20.95)
  assert.is(roundDecimals(20.94543, 4), 20.9454)

  assert.is(toMoney(9287), '9 287 kr')
  assert.is(toMoney(9287).charCodeAt(1), 160)
  assert.is(toMoney(2.69), '3 kr')
  assert.is(toMoney(2.69, 2), '2,69 kr')
  assert.is(toMoney(2.69, 2).charCodeAt(4), 160)

  assert.is(toPercentage(.50), '50,00 %')
  assert.is(toPercentage(.50, 0), '50 %')
  assert.is(toPercentage(.50555), '50,56 %')
  assert.is(toPercentage(.011), '1,10 %')
})

Finance.run()
