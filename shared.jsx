import React from 'react'

export const computeStats = (municipalityOrDistrict, casesLevelsThresholds) => {
  const {
    population,
    casesPerWeek,
    last7DaysCases
  } = municipalityOrDistrict

  const totalCases = casesPerWeek.reduce((carry, cases) => carry + cases, 0)
  const casesPer100000PerWeek = casesPerWeek.map(cases => population > 0 ? Math.round((cases / population) * 100000) : 0)

  let totalCasesPer100000 = 0
  let last7DaysCasesPer100000 = 0

  // Few municipalities have zero population and right now also zero cases, but if they
  // get any cases, we don't want this computation to fail, so we just leave the per capita
  // stats zero too
  if (population > 0) {
    totalCasesPer100000 = Math.round((totalCases / population) * 100000)
    last7DaysCasesPer100000 = Math.round((last7DaysCases / population) * 100000)
  }

  const levelsPerWeek = casesPer100000PerWeek.map(casesPer100000 => {
    if (casesPer100000 === 0) {
      return 0
    }

    for (const level of [4, 3, 2]) {
      if (casesPer100000 >= casesLevelsThresholds[level]) {
        return level
      }
    }

    return 1
  })
  
  return {
    totalCases,
    totalCasesPer100000,
    last7DaysCases,
    last7DaysCasesPer100000,
    levelsPerWeek
  }
}

export const HeatStrip = ({ levelsPerWeek }) => {
  return (
    <div className="datarozhlas-covid-obce-heat-strip">
      {levelsPerWeek.map((level, index) => (
        <div key={index} className={`datarozhlas-covid-obce-heat-strip-item heat-strip-level-${level}`} />
      ))}
    </div>
  )
}
