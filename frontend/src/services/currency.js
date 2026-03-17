const KEY = 'abs_currency';

export const SUPPORTED = ['USD', 'INR', 'EUR'];

export const RATES = {
  USD: 1,
  INR: 83,
  EUR: 0.92
};

export const getCurrency = () => {
  const c = localStorage.getItem(KEY) || 'USD';
  return SUPPORTED.includes(c) ? c : 'USD';
};

export const setCurrency = (currency) => {
  localStorage.setItem(KEY, currency);
};

export const convertFromUsd = (usdAmount, targetCurrency) => {
  const rate = RATES[targetCurrency] ?? 1;
  return usdAmount * rate;
};

