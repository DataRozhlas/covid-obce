import React, { useLayoutEffect } from 'react'
import debounce from 'lodash/debounce'

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

const useDimensions = () => {
  const [node, setNode] = React.useState(null)
  const [dimensions, setDimensions] = React.useState({})

  const ref = React.useCallback(node => {
    setNode(node)
  }, [setNode])

  const measure = React.useCallback(debounce(() => {
    window.requestAnimationFrame(() => {
      const { width, height } = node.getBoundingClientRect()
      setDimensions({ width, height })
    })
  }, 200), [node, setDimensions])
  
  useLayoutEffect(() => {
    if (node) {
      measure()

      window.addEventListener("resize", measure);
      return () => {
        window.removeEventListener("resize", measure);
      }
    }
  }, [node, measure])

  return [ref, dimensions]
}

export const useIsMobile = () => {
  const [containerRef, containerDimensions] = useDimensions()

  const isMobile = React.useMemo(() => {
    return containerDimensions && containerDimensions.width < 550
  }, [containerDimensions])

  return [containerRef, isMobile]
}

export const DataSource = () => (
  <div className="datarozhlas-covid-obce-source">Zdroje dat: <a href="https://www.czso.cz/csu/czso/pocet-obyvatel-v-obcich-k-112019" target="_blank">ČSÚ</a>, <a href="http://services.cuzk.cz/shp/stat/epsg-5514/1.zip" target="_blank">ČÚZK</a>, <a href="https://share.uzis.cz/s/dCZBiARJ27ayeoS" target="_blank">ÚZIS</a></div>
)
