module.exports = {
  USDollarFormatter: (amount) => {
    const result = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

    return result;
  },
  SARFormatter: (amount) => {
    const result = new Intl.NumberFormat("en-US", {
      currency: "SAR",
      currencyDisplay: "symbol",
      currencySign: "standard",
      style: "currency",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    return { result, float: Number(amount) };
  },
};
