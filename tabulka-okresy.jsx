// polyfills
import 'core-js/stable'
import 'whatwg-fetch'

import React from "react";
import ReactDOM from "react-dom";
import deburr from 'lodash/deburr'
import orderBy from 'lodash/orderBy'

import { computeStats, DataSource, HeatStrip, useIsMobile } from './shared.jsx'

const DistrictsTable = () => {
  const [containerRef, isMobile] = useIsMobile()

  const [districts, setDistricts] = React.useState(null)

  React.useEffect(() => {
    fetch('https://data.irozhlas.cz/covid-uzis/obce.json').then(response => {
      response.json().then(payload => {        
        setDistricts(prepareDistrictsData(payload))
      })
    })
  }, [setDistricts])

  const [openDistricts, setOpenDistricts] = React.useState([])
  const toggleDistrict = React.useCallback(districtName => {
    if (openDistricts.includes(districtName)) {
      setOpenDistricts(openDistricts.filter(i => i !== districtName))
    } else {
      setOpenDistricts([...openDistricts, districtName])
    }
  }, [openDistricts, setOpenDistricts])

  const [sort, setSort] = React.useState(['last7DaysCasesPer100000', 'desc'])
  const toggleSort = React.useCallback(propertyToSortBy => {
    if (propertyToSortBy === sort[0]) {
      setSort([propertyToSortBy, sort[1] === 'asc' ? 'desc' : 'asc'])      
    } else {
      setSort([propertyToSortBy, 'desc'])
    }
  }, [sort, setSort])

  const [searchQuery, setSearchQuery] = React.useState('')

  const districtsAfterSort = React.useMemo(() => {    
    return orderBy(districts, [sort[0]], [sort[1]]).map(district => {
      return {
        ...district,
        municipalities: orderBy(district.municipalities, [sort[0]], [sort[1]])
      }
    })
  }, [districts, sort])

  const districtsAfterSortAndSearch = React.useMemo(() => {
    const searchQueryNormalized = searchQuery.toLowerCase().trim()

    if (searchQueryNormalized.length < 2) {
      return districtsAfterSort
    }

    return districtsAfterSort
      .map(district => {
        return {
          ...district,
          municipalities: district.municipalities
            .filter(municipality => municipality.searchName.includes(searchQueryNormalized) || municipality.searchNameUnaccented.includes(searchQueryNormalized))
        }
      })
      .filter(district => district.searchName.includes(searchQueryNormalized) || district.searchNameUnaccented.includes(searchQueryNormalized) || district.municipalities.length > 0)
  }, [districtsAfterSort, searchQuery])

  const usingSearchQuery = searchQuery.toLowerCase().trim().length >= 2

  const [showAll, setShowAll] = React.useState(false)

  const districtsAfterSortAndSearchAndShowAll = React.useMemo(() => {
    return (showAll || usingSearchQuery) ? districtsAfterSortAndSearch : districtsAfterSortAndSearch.slice(0, 15)
  }, [districtsAfterSortAndSearch, showAll, usingSearchQuery])

  const [showCols, setShowCols] = React.useState('last7DaysCases')
  const switchCols = React.useCallback(cols => {
    setShowCols(cols)
    setSort([cols + 'Per100000', 'desc'])
  }, [setShowCols, setSort])

  if (!districts) {
    return null
  }

  return (
    <div className={`datarozhlas-covid-obce-container ${isMobile ? 'datarozhlas-covid-obce-mobile' : ''}`} ref={containerRef}>
      <h3 className="datarozhlas-covid-obce-headline">Pozitivně testovaní po okresech</h3>

      <input
        className="datarozhlas-covid-obce-search"
        type="text"
        value={searchQuery}
        onChange={e => setSearchQuery(e.currentTarget.value)}
        placeholder="Hledejte dle názvu okresu či obce…"
      />

      {isMobile && (
        <div className="datarozhlas-covid-obce-cols-switch">
          <button
            className={`datarozhlas-covid-obce-cols-switch-button ${(showCols === 'last7DaysCases') ? 'active' : ''}`}
            type="button"
            onClick={() => switchCols('last7DaysCases')}
          >
            Posledních 7 dní
          </button>
          <button
            className={`datarozhlas-covid-obce-cols-switch-button ${(showCols === 'totalCases') ? 'active' : ''}`}
            type="button"
            onClick={() => switchCols('totalCases')}
          >
            Celková čísla
          </button>
        </div>
      )}

      <table className="datarozhlas-covid-obce-table">
        <thead>
          <tr>
            <th></th>
            <th></th>
            {(!isMobile || showCols === 'totalCases') && (
              <>
                <th>
                  <button type="button" onClick={() => toggleSort('totalCases')}>
                    Celkem
                    {sort[0] === 'totalCases' && sort[1] === 'asc' && (
                      <>&nbsp;↑</>
                    )}
                    {sort[0] === 'totalCases' && sort[1] === 'desc' && (
                      <>&nbsp;↓</>
                    )}
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort('totalCasesPer100000')}>
                    Na&nbsp;100 tisíc
                    {sort[0] === 'totalCasesPer100000' && sort[1] === 'asc' && (
                      <>&nbsp;↑</>
                    )}
                    {sort[0] === 'totalCasesPer100000' && sort[1] === 'desc' && (
                      <>&nbsp;↓</>
                    )}
                  </button>
                </th>
              </>
            )}
            {(!isMobile || showCols === 'last7DaysCases') && (
              <>
                <th>
                  <button type="button" onClick={() => toggleSort('last7DaysCases')}>
                    Posl. 7&nbsp;dní
                    {sort[0] === 'last7DaysCases' && sort[1] === 'asc' && (
                      <>&nbsp;↑</>
                    )}
                    {sort[0] === 'last7DaysCases' && sort[1] === 'desc' && (
                      <>&nbsp;↓</>
                    )}
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort('last7DaysCasesPer100000')}>
                    Na&nbsp;100 tisíc
                    {sort[0] === 'last7DaysCasesPer100000' && sort[1] === 'asc' && (
                      <>&nbsp;↑</>
                    )}
                    {sort[0] === 'last7DaysCasesPer100000' && sort[1] === 'desc' && (
                      <>&nbsp;↓</>
                    )}
                  </button>
                </th>
              </>
            )}
            <th className="datarozhlas-covid-obce-hs-legend-cell">
              <div className="datarozhlas-covid-obce-hs-legend-title">
                POZ.&nbsp;TESTOVANÍ PO TÝDNECH NA 100 TISÍC
              </div>
              <div className="datarozhlas-covid-obce-hs-legend">
                <div className="datarozhlas-covid-obce-hs-legend-1" />
                <div className="datarozhlas-covid-obce-hs-legend-2" />
                <div className="datarozhlas-covid-obce-hs-legend-3" />
                <div className="datarozhlas-covid-obce-hs-legend-4" />
              </div>
              <div className="datarozhlas-covid-obce-hs-legend-labels">
                <div>MÉNĚ</div>
                <div>VÍCE</div>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {districtsAfterSortAndSearchAndShowAll.map(district => {
            return (
              <>
                <tr key={`district-${district.name}`}>
                  <td>
                    <button
                      className="datarozhlas-covid-obce-expand-button"
                      type="button"
                      onClick={() => toggleDistrict(district.name)}
                      disabled={usingSearchQuery}
                    >
                      {openDistricts.includes(district.name) ? '–' : '+'}
                    </button>
                  </td>
                  <td><strong>{district.name}</strong></td>
                  {(!isMobile || showCols === 'totalCases') && (
                    <>
                      <td className="datarozhlas-covid-obce-num-cell">{district.totalCases}</td>
                      <td className="datarozhlas-covid-obce-capita-cell">{district.totalCasesPer100000}</td>
                    </>
                  )}
                  {(!isMobile || showCols === 'last7DaysCases') && (
                    <>
                      <td className="datarozhlas-covid-obce-num-cell">{district.last7DaysCases}</td>
                      <td className="datarozhlas-covid-obce-capita-cell">{district.last7DaysCasesPer100000}</td>
                    </>
                  )}              
                  <td className="datarozhlas-covid-obce-heat-strip-cell">
                    <HeatStrip levelsPerWeek={district.levelsPerWeek} />
                  </td>
                </tr>

                {(openDistricts.includes(district.name) || usingSearchQuery) && (
                  <>
                    {district.municipalities.map(municipality => (
                      <tr key={`district-${district.name}-municipality-${municipality.name}`}>
                        <td></td>
                        <td>{municipality.name}</td>
                        {(!isMobile || showCols === 'totalCases') && (
                          <>
                            <td className="datarozhlas-covid-obce-num-cell">{municipality.totalCases}</td>
                            <td className="datarozhlas-covid-obce-capita-cell">{municipality.totalCasesPer100000}</td>
                          </>
                        )}
                        {(!isMobile || showCols === 'last7DaysCases') && (
                          <>
                            <td className="datarozhlas-covid-obce-num-cell">{municipality.last7DaysCases}</td>
                            <td className="datarozhlas-covid-obce-capita-cell">{municipality.last7DaysCasesPer100000}</td>
                          </>
                        )}
                        <td className="datarozhlas-covid-obce-heat-strip-cell">
                          <HeatStrip levelsPerWeek={municipality.levelsPerWeek} />
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </>
            )
          })}
          {!usingSearchQuery && (
            <tr>
              <td colSpan={isMobile ? 5 : 7} className="datarozhlas-covid-obce-show-cell">
                <button type="button" onClick={() => setShowAll(!showAll)}>
                  {showAll ? 'Zobrazit méně okresů' : 'Zobrazit všechny okresy'}
                </button>
              </td>
            </tr>
          )}
          {districtsAfterSortAndSearch.length === 0 && (
            <tr>
              <td colSpan={isMobile ? 5 : 7}>Obec ani okres s hledaným názvem jsme nenašli</td>
            </tr>
          )}
        </tbody>
      </table>
      <DataSource />
    </div>
  )
}

const prepareDistrictsData = (payload) => {
  let districts = {}

  payload.forEach(payloadRow => {      
    const districtName = payloadRow[0]
    const authorityRegionName = payloadRow[1]
    let municipalityName = payloadRow[2]
    const population = payloadRow[3]
    const last7DaysCases = payloadRow[4]
    const casesPerWeek = payloadRow.slice(5, -1)

    // These two are twice in their respective districts and we need to differentiate them
    if (
      (municipalityName === 'Březina' && districtName === 'Brno-venkov')
      || (municipalityName === 'Mezholezy' && districtName === 'Domažlice')
    ) {
      municipalityName += ` (${authorityRegionName})`
    }

    if (!districts[districtName]) {
      districts[districtName] = {
        name: districtName,
        searchName: districtName.toLowerCase(),
        searchNameUnaccented: deburr(districtName).toLowerCase(),
        population: 0,
        casesPerWeek: casesPerWeek.map(() => 0),
        last7DaysCases: 0,
        municipalities: []
      }
    }
    districts[districtName].population += population
    districts[districtName].casesPerWeek = districts[districtName].casesPerWeek.map((cases, index) => {
      return cases + casesPerWeek[index]
    })
    districts[districtName].last7DaysCases += last7DaysCases
    districts[districtName].municipalities.push({
      name: municipalityName,
      searchName: municipalityName.toLowerCase(),
      searchNameUnaccented: deburr(municipalityName).toLowerCase(),
      population,
      casesPerWeek,
      last7DaysCases
    })
  })

  // let maxCasesPer100000 = 0
  // Object.values(districts).forEach(district => {
  //   maxCasesPer100000 = Math.max(maxCasesPer100000, getMaxCasesInWeekPer100000(district))

  //   district.municipalities.forEach(municipality => {
  //     maxCasesPer100000 = Math.max(maxCasesPer100000, getMaxCasesInWeekPer100000(municipality))
  //   })
  // })

  // let allCasesPerWeekValues = []
  // Object.values(districts).forEach(district => {
  //   const casesPer100000PerWeek = district.casesPerWeek.map(cases => district.population > 0 ? Math.round((cases / district.population) * 100000) : 0)
  //   allCasesPerWeekValues = allCasesPerWeekValues.concat(casesPer100000PerWeek.filter(casesPer100000 => casesPer100000 > 0))

  //   district.municipalities.forEach(municipality => {
  //     const casesPer100000PerWeek = municipality.casesPerWeek.map(cases => municipality.population > 0 ? Math.round((cases / municipality.population) * 100000) : 0)
  //     allCasesPerWeekValues = allCasesPerWeekValues.concat(casesPer100000PerWeek.filter(casesPer100000 => casesPer100000 > 0))
  //   })
  // })

  // allCasesPerWeekValues = allCasesPerWeekValues.sort((a, b) => a - b)

  // console.log('-------', {
  //   p25: computeQuantile(allCasesPerWeekValues, .25),
  //   median: computeQuantile(allCasesPerWeekValues, .5),
  //   p75: computeQuantile(allCasesPerWeekValues, .75)
  // })

  // const casesLevelsThresholds = {
  //   2: computeQuantile(allCasesPerWeekValues, .25),
  //   3: computeQuantile(allCasesPerWeekValues, .5),
  //   4: computeQuantile(allCasesPerWeekValues, .75)
  // }

  // It would be great to compute these percentiles, but that takes way too long,
  // so we just hardcode them here for now
  const casesLevelsThresholds = {
    2: 76,
    3: 216,
    4: 474
  }

  // console.log('-------', {
  //   maxCasesPer100000,
  //   casesLevelsThresholds
  // })

  districts = Object.values(districts).map(district => {      
    return {
      ...district,
      ...computeStats(district, casesLevelsThresholds),
      municipalities: district.municipalities.map(municipality => {      
        return {
          ...municipality,
          ...computeStats(municipality, casesLevelsThresholds)
        }
      })
    }
  })

  return districts
}

const getMaxCasesInWeekPer100000 = (municipalityOrDistrict) => {
  const {
    casesPerWeek,
    population
  } = municipalityOrDistrict

  const casesPer100000PerWeek = casesPerWeek.map(cases => population > 0 ? Math.round((cases / population) * 100000) : 0)

  return Math.max(...casesPer100000PerWeek)
}

const computeQuantile = (arr, q) => {
  const sorted = arr;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  } else {
      return sorted[base];
  }
};

const container = document.getElementById("datarozhlas-covid-obce-tabulka-okresy");
if (container) {
  ReactDOM.render(<DistrictsTable />, container)
}
