module.exports = {
  USDollarFormatter: (amount) => {
    const result = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

    return result;
  },
};
