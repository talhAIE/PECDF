import client from './client'

export const fetchCommodities = () =>
  client.get('/commodities')

export const fetchSingleForecast = ({ hs_code, target_yyyymm, macro }) =>
  client.post('/forecast/single', { hs_code, target_yyyymm, macro })

export const fetchMultiHorizon = ({ hs_code, start_yyyymm, n_months, macro }) =>
  client.post('/forecast/multi-horizon', { hs_code, start_yyyymm, n_months, macro })

export const fetchAllCommodities = ({ target_yyyymm, macro }) =>
  client.post('/forecast/all-commodities', { target_yyyymm, macro })
