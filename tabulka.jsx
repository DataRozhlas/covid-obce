// polyfills
import 'core-js/stable'
import 'whatwg-fetch'

import React from "react";
import ReactDOM from "react-dom";
import deburr from 'lodash/deburr'
import orderBy from 'lodash/orderBy'

import { computeStats, DataSource, HeatStrip, useIsMobile } from './shared.jsx'

const MunicipalitiesTable = () => {
  const [containerRef, isMobile] = useIsMobile()

  const [municipalities, setMunicipalities] = React.useState(null)

  React.useEffect(() => {
    fetch('https://data.irozhlas.cz/covid-uzis/obce.json').then(response => {
      response.json().then(payload => {        
        setMunicipalities(prepareMunicipalitiesData(payload))
      })
    })
  }, [setMunicipalities])

  const [sort, setSort] = React.useState(['last7DaysCasesPer100000', 'desc'])
  const toggleSort = React.useCallback(propertyToSortBy => {
    if (propertyToSortBy === sort[0]) {
      setSort([propertyToSortBy, sort[1] === 'asc' ? 'desc' : 'asc'])      
    } else {
      setSort([propertyToSortBy, 'desc'])
    }
  }, [sort, setSort])

  const [searchQuery, setSearchQuery] = React.useState('')

  const [onlyBigger, setOnlyBigger] = React.useState(true)

  const municipalitiesAfterSort = React.useMemo(() => {    
    return orderBy(municipalities, [sort[0]], [sort[1]])
  }, [municipalities, sort])

  const municipalitiesAfterSortAndSearch = React.useMemo(() => {
    const searchQueryNormalized = searchQuery.toLowerCase().trim()

    if (searchQueryNormalized.length < 2) {
      return municipalitiesAfterSort.filter(municipality => onlyBigger ? (municipality.population > 1000) : true)
    }

    return municipalitiesAfterSort
      .filter(municipality => municipality.searchName.includes(searchQueryNormalized) || municipality.searchNameUnaccented.includes(searchQueryNormalized))
  }, [municipalitiesAfterSort, searchQuery, onlyBigger])

  const usingSearchQuery = searchQuery.toLowerCase().trim().length >= 2

  const [showCount, setShowCount] = React.useState(15)

  const municipalitiesAfterSortAndSearchAndShowCount = React.useMemo(() => {
    return municipalitiesAfterSortAndSearch.slice(0, showCount)
  }, [municipalitiesAfterSortAndSearch, showCount])

  const [showCols, setShowCols] = React.useState('last7DaysCases')
  const switchCols = React.useCallback(cols => {
    setShowCols(cols)
    setSort([cols + 'Per100000', 'desc'])
  }, [setShowCols, setSort])
  
  if (!municipalities) {
    return null
  }

  return (
    <div className={`datarozhlas-covid-obce-container ${isMobile ? 'datarozhlas-covid-obce-mobile' : ''}`} ref={containerRef}>
      <h3 className="datarozhlas-covid-obce-headline">Pozitivně testovaní po obcích</h3>

      <input
        className="datarozhlas-covid-obce-search"
        type="text"
        value={searchQuery}
        onChange={e => setSearchQuery(e.currentTarget.value)}
        placeholder="Hledejte dle názvu obce…"
      />

      <div className="datarozhlas-covid-obce-population-filter">
        <button
          className={`datarozhlas-covid-obce-population-filter-button ${(onlyBigger && !usingSearchQuery) ? 'active' : ''}`}
          type="button"
          disabled={usingSearchQuery}
          onClick={() => setOnlyBigger(true)}
        >
          Jen s počtem obyvatel nad 1&thinsp;000
        </button>
        <button
          className={`datarozhlas-covid-obce-population-filter-button ${(!onlyBigger || usingSearchQuery) ? 'active' : ''}`}
          type="button"
          disabled={usingSearchQuery}
          onClick={() => setOnlyBigger(false)}
        >
          Všechny obce
        </button>
      </div>

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
            <th>Obce</th>
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
          {municipalitiesAfterSortAndSearchAndShowCount.map(municipality => {
            return (
              <tr key={`district-${municipality.uniqueName}`}>
                <td>{municipality.name} <span className="datarozhlas-covid-obce-name-suffix">{municipality.nameSuffix}</span></td>
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
            )
          })}
          {showCount <= municipalitiesAfterSortAndSearchAndShowCount.length && (
            <tr>
              <td colSpan={isMobile ? 4 : 6} className="datarozhlas-covid-obce-show-cell">
                <button type="button" onClick={() => setShowCount(showCount + 15)}>
                  Zobrazit více obcí
                </button>
              </td>
            </tr>
          )}
          {municipalitiesAfterSortAndSearchAndShowCount.length === 0 && (
            <tr>
              <td colSpan={isMobile ? 4 : 6}>Obec s hledaným názvem jsme nenašli</td>
            </tr>
          )}
        </tbody>
      </table>
      <DataSource />
    </div>
  )
}

const prepareMunicipalitiesData = (payload) => {
  let municipalities = []

  payload.forEach(payloadRow => {      
    const districtName = payloadRow[0]
    const authorityRegionName = payloadRow[1]
    const municipalityName = payloadRow[2]
    const population = payloadRow[3]
    const last7DaysCases = payloadRow[4]
    const casesPerWeek = payloadRow.slice(5, -1)

    // These two are twice in their respective districts and we need to differentiate them
    let nameSuffix
    if (
      (municipalityName === 'Březina' && districtName === 'Brno-venkov')
      || (municipalityName === 'Mezholezy' && districtName === 'Domažlice')
    ) {
      nameSuffix = `(${authorityRegionName}, ${districtName})`
    } else {
      nameSuffix = `(${districtName})`
    }

    const uniqueName = `${municipalityName} ${nameSuffix}`

    municipalities.push({
      name: municipalityName,
      nameSuffix,
      uniqueName,
      searchName: uniqueName.toLowerCase(),
      searchNameUnaccented: deburr(uniqueName).toLowerCase(),
      population,
      casesPerWeek,
      last7DaysCases
    })
  })

  // TODO
  const casesLevelsThresholds = {
    2: 76,
    3: 216,
    4: 474
  }

  municipalities = municipalities.map(municipality => {      
    return {
      ...municipality,
      ...computeStats(municipality, casesLevelsThresholds)
    }
  })

  return municipalities
}

const container = document.getElementById("datarozhlas-covid-obce-tabulka");
if (container) {
  ReactDOM.render(<MunicipalitiesTable />, container)
}
