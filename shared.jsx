import React, { useLayoutEffect } from 'react'
import { Tooltip } from 'react-tippy';
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

  const percentageChangePerWeek = casesPer100000PerWeek.map((casesPer100000, index) => {
    if (index === 0) {
      return 0
    }

    const casesPer100000PreviousWeek = casesPer100000PerWeek[index - 1]
    if (casesPer100000PreviousWeek === 0) {
      return casesPer100000 === 0 ? 0 : 100
    }

    return Math.round(((casesPer100000 / casesPer100000PreviousWeek) * 100) - 100)
  })
  
  return {
    totalCases,
    totalCasesPer100000,
    last7DaysCases,
    last7DaysCasesPer100000,
    levelsPerWeek,
    casesPer100000PerWeek,
    percentageChangePerWeek
  }
}

export const HeatStrip = ({ municipalityOrDistrict }) => {
  const { casesPerWeek, casesPer100000PerWeek, levelsPerWeek } = municipalityOrDistrict

  return (
    <div className="datarozhlas-covid-obce-heat-strip">
      {levelsPerWeek.map((level, index) => (
        <Tooltip
          html={
            <div className="datarozhlas-covid-obce-tooltip-content">
              {weekDates[index] && 
                <div className="datarozhlas-covid-obce-tooltip-week">
                  Týden {weekDates[index]}
                </div>
              }
              <div className="datarozhlas-covid-obce-tooltip-abs">
                {casesPerWeek[index]} pozitivně testovaných
              </div>
              <div className="datarozhlas-covid-obce-tooltip-rel">
                {casesPer100000PerWeek[index]} na 100 tisíc obyvatel
              </div>
            </div>
          }
          position="bottom-end"
          trigger="mouseenter"
          duration={0}
          arrow
          unmountHTMLWhenHide
          interactive
          theme="light"
        >
          <div className={`datarozhlas-covid-obce-heat-strip-item heat-strip-level-${level}`} />
        </Tooltip>        
      ))}
    </div>
  )
}

export const ChangeHeatStrip = ({ municipalityOrDistrict }) => {
  const { casesPerWeek, casesPer100000PerWeek, percentageChangePerWeek } = municipalityOrDistrict
  
  return (
    <div className="datarozhlas-covid-obce-change-heat-strip">
      {percentageChangePerWeek.map((percentageChange, index) => (
        <Tooltip
          html={
            <div className="datarozhlas-covid-obce-tooltip-content">
              {weekDates[index] && 
                <div className="datarozhlas-covid-obce-tooltip-week">
                  Týden {weekDates[index]}
                </div>
              }
              <div className="datarozhlas-covid-obce-tooltip-abs">
                {casesPerWeek[index]} pozitivně testovaných
              </div>
              <div className="datarozhlas-covid-obce-tooltip-rel">
                {casesPer100000PerWeek[index]} na 100 tisíc obyvatel
              </div>
              {index > 0 &&
                <div className="datarozhlas-covid-obce-tooltip-change">
                  <span className={`datarozhlas-covid-obce-tooltip-change-indicator change-indicator-${decidePercentageChangeColorClass(percentageChange)}`} />
                  {percentageChange === 0 ? (
                    <>Žádná změna oproti předchozímu týdnu</>
                  ): (
                    <>{percentageChange > 0 ? 'Nárůst' : 'Pokles'} o {Math.abs(percentageChange)}&thinsp;% oproti předchozímu týdnu</>
                  )}              
                </div>
              }
            </div>
          }
          position="bottom-end"
          trigger="mouseenter"
          duration={0}
          arrow
          unmountHTMLWhenHide
          interactive
          theme="light"
        >
          <div
            className={`datarozhlas-covid-obce-change-heat-strip-item change-heat-strip-${decidePercentageChangeColorClass(percentageChange)}`}
            title={`${casesPerWeek[index]} pozitivně testovaných (${percentageChange > 0 ? 'nárůst' : 'pokles'} o ${Math.abs(percentageChange)} % oproti předchozímu týdnu)`}
          />
        </Tooltip>
      ))}
    </div>
  )
}

const decidePercentageChangeColorClass = (percentageChange) => {
  if (percentageChange > 140) {
    return 'more-2'
  } else if (percentageChange > 0) {
    return 'more-1'
  } else if (percentageChange === 0) {
    return 'same'
  } else if (percentageChange >= -60) {
    return 'less-1'
  } else {
    return 'less-2'
  }
}

const weekDates = [
  '24.2. – 1.3.', // 0
  '2.3. – 8.3.',
  '9.3. – 15.3.',
  '16.3. – 22.3.',
  '23.3. – 29.3.',
  '30.3. – 5.4.',
  '6.4. – 12.4.',
  '13.4. – 19.4.',
  '20.4. – 26.4.',
  '27.4. – 3.5.',  
  '4.5. – 10.5.', // 10
  '11.5. – 17.5.',
  '18.5. – 24.5.',
  '25.5. – 31.5.',
  '1.6. – 7.6.',
  '8.6. – 14.6.',
  '15.6. – 21.6.',
  '22.6. – 28.6.',
  '29.6. – 5.7.',
  '6.7. – 12.7.',
  '13.7. – 19.7.', // 20
  '20.7. - 26.7.',
  '27.7. – 2.8.',
  '3.8. – 9.8.',
  '10.8. – 16.8.',
  '17.8. – 23.8.',
  '24.8. – 30.8.',
  '31.8. – 6.9.',
  '7.9. – 13.9.',
  '14.9. – 20.9.',
  '21.9. – 27.9.', // 30
  '28.9. – 4.10.',
  '5.10. – 11.10.',
  '12.10. – 18.10.',
  '19.10. – 25.10.',
  '26.10. – 1.11.',
  '2.11. – 8.11.',
  '9.11. – 15.11.',
  '16.11. – 22.11.',
  '23.11. – 29.11.',
  '30.11. – 6.12.', // 40
  '7.12. – 13.12.',
  '14.12. – 20.12.',
  '21.12. – 27.12.',
  '28.12.2020 – 3.1.2021',
  '4.1. – 10.1.'
]

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
