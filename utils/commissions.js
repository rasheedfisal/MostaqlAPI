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
  isUserHaveMinimumAmount: (id) => {
    const result = WithdrawableAmountSetting.findOne()
      .then((withdrawable) => {
        UserWallet.findOne({
          where: {
            user_id: id,
          },
        })
          .then((wallet) => {
            if (wallet.credit >= withdrawable.amount) {
              return true;
            }
            return false;
          })
          .catch((_) => {
            return false;
          });
      })
      .catch((_) => {
        return false;
      });

    return result;
  },
};
