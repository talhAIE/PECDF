import client from './client'

export const fetchSingleVariable = ({
  hs_code,
  target_yyyymm,
  variable,
  range_min,
  range_max,
  fixed_pkr,
  fixed_oil,
  fixed_conf,
  n_months = 1
}) =>
  client.post('/scenario/single-variable', {
    hs_code,
    target_yyyymm,
    variable,
    range_min,
    range_max,
    fixed_pkr,
    fixed_oil,
    fixed_conf,
    n_months
  })

export const fetchMultiVariable = ({
  hs_code,
  target_yyyymm,
  pkr_values,
  oil_values,
  fixed_conf,
  n_months = 1
}) =>
  client.post('/scenario/multi-variable', {
    hs_code,
    target_yyyymm,
    pkr_values,
    oil_values,
    fixed_conf,
    n_months
  })
