const { CommissionRate } = require("../models");

module.exports = {
  getCurrentRate: () => {
    // Get Current Commission Rate
    const result = CommissionRate.findOne({ where: { iscurrent: true } })
      .then((rate) => {
        return rate;
      })
      .catch((error) => {
        return {};
      });

    return result;
  },
};
