export const useExperimentState = createGlobalState(() => {

  const { choice } = useConditions()
  const { pRight, length } = choice({
    pRight: range(0.1, 0.9, 0.1),
    length: [30]
  })
  const eCorrect = expectedCorrect(pRight, length)
  const ePoints = eCorrect - (length - eCorrect)
  useInspect({ pRight, length, eCorrect, ePoints }, 'experimentState')

  return reactive({
    initialPoints: round(0.9 * length - ePoints),
  })
})

const binomialCoeff = (n: number, k: number): number => {
  if (k < 0 || k > n) return 0
  if (k === 0 || k === n) return 1
  let result = 1
  for (let i = 0; i < k; i++) result = result * (n - i) / (i + 1)
  return result
}

const binomialPMF = (n: number, k: number, p: number): number =>
  binomialCoeff(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k)

const expectedCorrect = (pRight: number, length: number): number =>
  R.sumBy(R.range(0, length), t => {
    return R.sumBy(R.range(0, t + 1), k => {
      const pK = binomialPMF(t, k, pRight)
      const predictiveP = (k + 1) / (t + 2)
      return predictiveP > 0.5 ? pK * pRight
           : predictiveP < 0.5 ? pK * (1 - pRight)
           : pK * 0.5
    })
  })