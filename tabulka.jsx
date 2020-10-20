import React from "react";
import ReactDOM from "react-dom";
import deburr from 'lodash/deburr'
import orderBy from 'lodash/orderBy'

const MunicipalitiesTable = () => {
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
    return (showAll || usingSearchQuery) ? districtsAfterSortAndSearch : districtsAfterSortAndSearch.slice(0, 10)
  }, [districtsAfterSortAndSearch, showAll, usingSearchQuery])

  if (!districts) {
    return null
  }

  // console.log('------', {
  //   districts,
  //   districtsSorted
  // })

  return (
    <>
      <input
        type="text"
        value={searchQuery}
        onChange={e => setSearchQuery(e.currentTarget.value)}
        placeholder="Hledejte obec…"
      />
      <table class="municipalities-table">
        <thead>
          <tr>
            <th></th>
            <th></th>
            <th class="align-right">
              <button type="button" onClick={() => toggleSort('totalCases')}>
                Počet detekovaných
                {sort[0] === 'totalCases' && sort[1] === 'asc' && (
                  <> ↑</>
                )}
                {sort[0] === 'totalCases' && sort[1] === 'desc' && (
                  <> ↓</>
                )}
              </button>
            </th>
            <th class="align-right">
              <button type="button" onClick={() => toggleSort('totalCasesPer100000')}>
                Na 100 000
                {sort[0] === 'totalCasesPer100000' && sort[1] === 'asc' && (
                  <> ↑</>
                )}
                {sort[0] === 'totalCasesPer100000' && sort[1] === 'desc' && (
                  <> ↓</>
                )}
              </button>
            </th>
            <th class="align-right">
              <button type="button" onClick={() => toggleSort('last7DaysCases')}>
                Detekovaných za 7 dní
                {sort[0] === 'last7DaysCases' && sort[1] === 'asc' && (
                  <> ↑</>
                )}
                {sort[0] === 'last7DaysCases' && sort[1] === 'desc' && (
                  <> ↓</>
                )}
              </button>
            </th>
            <th class="align-right">
              <button type="button" onClick={() => toggleSort('last7DaysCasesPer100000')}>
                Na 100 000
                {sort[0] === 'last7DaysCasesPer100000' && sort[1] === 'asc' && (
                  <> ↑</>
                )}
                {sort[0] === 'last7DaysCasesPer100000' && sort[1] === 'desc' && (
                  <> ↓</>
                )}
              </button>
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
                      type="button"
                      onClick={() => toggleDistrict(district.name)}
                      disabled={usingSearchQuery}
                    >
                      {openDistricts.includes(district.name) ? '-' : '+'}
                    </button>
                  </td>
                  <td><strong>{district.name}</strong></td>
                  <td class="align-right">{district.totalCases}</td>
                  <td class="align-right">{district.totalCasesPer100000}</td>
                  <td class="align-right">{district.last7DaysCases}</td>
                  <td class="align-right">{district.last7DaysCasesPer100000}</td>
                </tr>

                {(openDistricts.includes(district.name) || usingSearchQuery) && (
                  <>
                    {district.municipalities.map(municipality => (
                      <tr key={`district-${district.name}-municipality-${municipality.name}`}>
                        <td></td>
                        <td>{municipality.name}</td>
                        <td class="align-right">{municipality.totalCases}</td>
                        <td class="align-right">{municipality.totalCasesPer100000}</td>
                        <td class="align-right">{municipality.last7DaysCases}</td>
                        <td class="align-right">{municipality.last7DaysCasesPer100000}</td>
                      </tr>
                    ))}
                  </>
                )}
              </>
            )
          })}
          {!usingSearchQuery && (
            <tr>
              <td colSpan={6}>
                <button type="button" onClick={() => setShowAll(!showAll)}>
                  {showAll ? 'Zobrazit méně' : 'Zobrazit vše'}
                </button>
              </td>
            </tr>
          )}
          {districtsAfterSortAndSearch.length === 0 && (
            <tr>
              <td colSpan={6}>Obec s hledaným názvem jsme nenašli</td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  )
}

const prepareDistrictsData = (payload) => {
  let districts = {}

  payload.forEach((payloadRow, index) => {      
    const districtName = payloadRow[0]
    const authorityRegionName = payloadRow[1]
    let municipalityName = payloadRow[2]
    const population = payloadRow[3]
    const casesPerWeek = payloadRow.slice(4, -1)
    const last7DaysCases = payloadRow[payloadRow.length - 1]

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

  districts = Object.values(districts).map(district => {      
    return {
      ...district,
      ...computeStats(district),
      municipalities: district.municipalities.map(municipality => {      
        return {
          ...municipality,
          ...computeStats(municipality)
        }
      })
    }
  })

  return districts
}

const computeStats = (municipalityOrDistrict) => {
  const {
    population,
    casesPerWeek,
    last7DaysCases
  } = municipalityOrDistrict

  const totalCases = casesPerWeek.reduce((carry, cases) => carry + cases, 0)

  let totalCasesPer100000 = 0
  let last7DaysCasesPer100000 = 0

  // Few municipalities have zero population and right now also zero cases, but if they
  // get any cases, we don't want this computation to fail, so we just leave the per capita
  // stats zero too
  if (population > 0) {
    totalCasesPer100000 = Math.round((totalCases / population) * 100000)
    last7DaysCasesPer100000 = Math.round((last7DaysCases / population) * 100000)
  }
  
  return {
    totalCases,
    totalCasesPer100000,
    last7DaysCases,
    last7DaysCasesPer100000
  }
}

const container = document.getElementById("datarozhlas-covid-obce-tabulka");
if (container) {
  ReactDOM.render(<MunicipalitiesTable />, container)
}
