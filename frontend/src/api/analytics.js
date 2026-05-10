import client from './client'

export const fetchSeasonality = (hs_code) =>
  client.get(`/seasonality/${hs_code}`)

export const fetchAllSeasonality = () =>
  client.get('/seasonality')

export const fetchMomentum = () =>
  client.get('/momentum')

export const fetchCommodityMomentum = (hs_code) =>
  client.get(`/momentum/${hs_code}`)

export const fetchHistorical = (hs_code, months = 24) =>
  client.get(`/historical/${hs_code}`, { params: { months } })

/** Actual vs predicted on test window — champion model + historic macros per month */
export const fetchModelFitSeries = (hs_code, start_yyyymm, end_yyyymm) =>
  client.get(`/model-fit/${hs_code}`, { params: { start_yyyymm, end_yyyymm } })

export const fetchCurrencySensitivity = ({ target_yyyymm, pkr_min = 260, pkr_max = 330 }) =>
  client.get('/sensitivity/currency', { params: { target_yyyymm, pkr_min, pkr_max } })

export const fetchCurrencySensitivitySingle = (hs_code, { target_yyyymm, pkr_min = 260, pkr_max = 330 }) =>
  client.get(`/sensitivity/currency/${hs_code}`, { params: { target_yyyymm, pkr_min, pkr_max } })
