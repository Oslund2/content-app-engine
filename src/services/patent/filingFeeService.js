// src/services/patent/filingFeeService.js
// USPTO Filing Fee Calculator — 2024 fee schedule

const USPTO_FEES_2024 = {
  provisional: { regular: 325, small_entity: 130, micro_entity: 65 },
  non_provisional: {
    basic: { regular: 1820, small_entity: 728, micro_entity: 364 },
    search: { regular: 700, small_entity: 280, micro_entity: 140 },
    examination: { regular: 800, small_entity: 320, micro_entity: 160 },
  },
  continuation: {
    basic: { regular: 1820, small_entity: 728, micro_entity: 364 },
    search: { regular: 700, small_entity: 280, micro_entity: 140 },
    examination: { regular: 800, small_entity: 320, micro_entity: 160 },
  },
  applicationSize: { regular: 450, small_entity: 180, micro_entity: 90 },
  excessClaims: {
    over20Total: { regular: 100, small_entity: 40, micro_entity: 20 },
    over3Independent: { regular: 480, small_entity: 192, micro_entity: 96 },
    multipleDependent: { regular: 860, small_entity: 344, micro_entity: 172 },
  },
}

export function calculateFilingFee(input) {
  const { filingType, entityStatus, pageCount, totalClaims, independentClaims, multipleDependent } = input
  let baseFee = 0, searchFee = 0, examinationFee = 0, applicationSizeFee = 0, claimsFee = 0

  if (filingType === 'provisional') {
    baseFee = USPTO_FEES_2024.provisional[entityStatus]
  } else {
    const feeCategory = (filingType === 'continuation' || filingType === 'cip' || filingType === 'divisional') ? 'continuation' : 'non_provisional'
    baseFee = USPTO_FEES_2024[feeCategory].basic[entityStatus]
    searchFee = USPTO_FEES_2024[feeCategory].search[entityStatus]
    examinationFee = USPTO_FEES_2024[feeCategory].examination[entityStatus]
    if (totalClaims > 20) claimsFee += (totalClaims - 20) * USPTO_FEES_2024.excessClaims.over20Total[entityStatus]
    if (independentClaims > 3) claimsFee += (independentClaims - 3) * USPTO_FEES_2024.excessClaims.over3Independent[entityStatus]
    if (multipleDependent) claimsFee += USPTO_FEES_2024.excessClaims.multipleDependent[entityStatus]
  }
  if (pageCount > 100) {
    applicationSizeFee = Math.ceil((pageCount - 100) / 50) * USPTO_FEES_2024.applicationSize[entityStatus]
  }
  const totalFee = baseFee + applicationSizeFee + searchFee + examinationFee + claimsFee
  const regularTotal = calculateRegularFee(filingType, pageCount, totalClaims, independentClaims, multipleDependent)
  return {
    baseFee, applicationSizeFee, searchFee, examinationFee, claimsFee, totalFee,
    savings: { fromRegular: regularTotal - totalFee, percentage: regularTotal > 0 ? Math.round(((regularTotal - totalFee) / regularTotal) * 100) : 0 },
  }
}

function calculateRegularFee(filingType, pageCount, totalClaims, independentClaims, multipleDependent) {
  let total = 0
  if (filingType === 'provisional') {
    total = USPTO_FEES_2024.provisional.regular
  } else {
    total = USPTO_FEES_2024.non_provisional.basic.regular + USPTO_FEES_2024.non_provisional.search.regular + USPTO_FEES_2024.non_provisional.examination.regular
    if (totalClaims > 20) total += (totalClaims - 20) * USPTO_FEES_2024.excessClaims.over20Total.regular
    if (independentClaims > 3) total += (independentClaims - 3) * USPTO_FEES_2024.excessClaims.over3Independent.regular
    if (multipleDependent) total += USPTO_FEES_2024.excessClaims.multipleDependent.regular
  }
  if (pageCount > 100) total += Math.ceil((pageCount - 100) / 50) * USPTO_FEES_2024.applicationSize.regular
  return total
}

export function getEntityStatusDescription(status) {
  switch (status) {
    case 'micro_entity': return {
      title: 'Micro Entity', description: 'Lowest fees available - 75% reduction from regular fees',
      qualifications: ['Qualifies as small entity', 'Has not been named as inventor on more than 4 previously filed patent applications', 'Did not have gross income exceeding 3x median household income in prior year', 'Has not assigned/licensed rights to entity exceeding gross income limit'],
    }
    case 'small_entity': return {
      title: 'Small Entity', description: '60% reduction from regular fees',
      qualifications: ['Individual inventor(s)', 'Small business with fewer than 500 employees', 'Nonprofit organization', 'Has not assigned/licensed rights to large entity'],
    }
    default: return {
      title: 'Regular Entity', description: 'Standard USPTO fees',
      qualifications: ['Large corporations', 'Entities with 500+ employees', 'Does not qualify for small or micro entity status'],
    }
  }
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

export function estimatePageCount(specificationWords, _abstractWords, claimsCount, drawingsCount) {
  return Math.ceil(specificationWords / 300) + 1 + Math.ceil(claimsCount * 0.5) + drawingsCount
}

export function calculateFilingDeadlines(provisionalFilingDate) {
  const deadlines = []
  if (provisionalFilingDate) {
    const conversionDeadline = new Date(provisionalFilingDate)
    conversionDeadline.setFullYear(conversionDeadline.getFullYear() + 1)
    const daysRemaining = Math.ceil((conversionDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    deadlines.push({ type: 'Non-Provisional Conversion', deadline: conversionDeadline, daysRemaining, isUrgent: daysRemaining <= 60 && daysRemaining > 0, isPast: daysRemaining < 0 })
  }
  return deadlines
}

export function compareEntityFees(filingType, pageCount, totalClaims, independentClaims) {
  const calc = (es) => calculateFilingFee({ filingType, entityStatus: es, pageCount, totalClaims, independentClaims, multipleDependent: false }).totalFee
  return { regular: calc('regular'), smallEntity: calc('small_entity'), microEntity: calc('micro_entity') }
}
