const {
  CommissionRate,
  WithdrawableAmountSetting,
  UserWallet,
} = require("../models");

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
  getCurrentMinAmountToWithdraw: () => {
    const result = WithdrawableAmountSetting.findOne()
      .then((amount) => {
        return amount;
      })
      .catch((error) => {
        return {};
      });

    return result;
  },
  isUserHaveMinimumAmount: async (id) => {
    try {
      const withdrawable = await WithdrawableAmountSetting.findOne();
      const wallet = await UserWallet.findOne({
        where: {
          user_id: id,
        },
      });
      if (wallet.credit >= withdrawable.amount) {
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  },
};
