const { CommissionRate } = require("../models");

module.exports = {
  getCurrentRate: () => {
    // Get Current Commission Rate
    CommissionRate.findOne({ where: { iscurrent: true } })
      .then((rate) => rate)
      .catch((error) => {
        return {};
      });
  },
};
