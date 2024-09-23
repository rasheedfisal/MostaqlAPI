const { QueryTypes } = require("sequelize");
const {
  sequelize,
  UserAccountFeedRequest,
  UserWallet,
  Notification,
  ReadNotification,
  User,
  Transactions,
} = require("../models");
const { sendNotification } = require("../utils/advanceNotifier");
const { sendEmailRequest } = require("../utils/advanceMailer");
const { handleForbidden, handleResponse } = require("../utils/handleError");
const Helper = require("../utils/helper");
const helper = new Helper();

async function createAccountFeedRequest(
  { authUser, amount, attachment },
  res,
  req
) {
  try {
    await helper.checkPermission(authUser.role_id, "feed_request_account_add");

    if (!amount)
      return handleResponse(res, "Please pass Required Fields.", 400);

    await sequelize.transaction(async (t) => {
      // chain all your queries here. make sure you return them.
      const request = await UserAccountFeedRequest.create(
        {
          user_id: authUser.id,
          amount,
          attachment,
          accepted: true,
        },
        { transaction: t }
      );

      const notification = await Notification.create(
        {
          title: "Account Feed Request",
          description: `user ${authUser.fullname} is requesting to add money into his account based on the attachment he sent, please view the attachment below`,
          type: "user-to-admin",
          sender_id: authUser.id,
        },
        { transaction: t }
      );

      const users = await sequelize.query(
        "select * from users where role_id in(select a.id from roles as a " +
          "inner join rolepermissions as ro on a.id = ro.role_id " +
          "inner join permissions as p on ro.perm_id = p.id " +
          "where p.perm_name = 'can_access_dashboard')",
        {
          type: QueryTypes.SELECT,
          model: User,
          mapToModel: true,
        },
        { transaction: t }
      );

      var promises = [];
      users.map((a) => {
        var newPromise = ReadNotification.create(
          {
            notification_id: notification.id,
            receiver_id: a.id,
          },
          { transaction: t }
        );
        promises.push(newPromise);
      });
      await Promise.all(promises);

      var notifyPromises = [];
      users.map((a) => {
        const notifyPromise = sendNotification(
          notification.title,
          notification.description,
          a.id
        );
        notifyPromises.push(notifyPromise);
      });
      await Promise.all(notifyPromises);

      await sendEmailRequest({
        req,
        path: attachment,
        name: "Staff Members",
        requestName: notification.title,
        requestId: request.id,
        description: notification.description,
        amount: request.amount,
        email: users.map((a) => a.email),
      });

      //   return handleResponse(res, "Resources Created Successfully", 201);
      return res.status(201).send({
        requestId: request.id,
      });
    });
  } catch (error) {
    console.log("error", error);

    return handleForbidden(res, error);
  }
}

async function updateAccountFeedRequest({ id, authUser, accepted }, res) {
  try {
    await helper.checkPermission(
      authUser.role_id,
      "feed_request_account_approve_reject"
    );
    if (!id) return handleResponse(res, "Please pass required fields.", 400);

    const request = await UserAccountFeedRequest.findByPk(id);

    if (!request) return handleResponse(res, "Request Not Found.", 404);

    await sequelize.transaction(async (t) => {
      // chain all your queries here. make sure you return them.
      await UserAccountFeedRequest.update(
        {
          accepted,
        },
        {
          where: {
            id,
          },
        },
        { transaction: t }
      );

      const user = await sequelize.query(
        "select * from users where id = (select user_id from useraccountfeedrequests where id= :feedId)",
        {
          replacements: { feedId: id },
          type: QueryTypes.SELECT,
          model: User,
          mapToModel: true,
        },
        { transaction: t }
      );

      const notify = await Notification.create(
        {
          title: "Account Feed Request",
          description: `hello ${
            user[0].fullname
          }, your request for feeding your account was ${
            accepted ? "accepted" : "rejected"
          }`,
          type: "admin-to-user",
          sender_id: authUser.id,
        },
        { transaction: t }
      );
      await ReadNotification.create(
        {
          notification_id: notify.id,
          receiver_id: user[0].id,
        },
        { transaction: t }
      );

      await sendNotification(notify.title, notify.description, user[0].id);

      return handleResponse(res, "Resources Updated Successfully.", 200);
    });
  } catch (error) {
    console.log(error);
    return handleForbidden(res, error);
  }
}

async function transferFeedMoneyToUser({ authUser, id, refrenceInfo }, res) {
  try {
    await helper.checkPermission(authUser.role_id, "feed_request_account_add");
    // await helper.checkPermission(
    //   authUser.role_id,
    //   "feed_request_account_approve_reject"
    // );

    if (!id) return handleResponse(res, "Please pass required fields.", 400);

    const request = await UserAccountFeedRequest.findByPk(id);

    if (!request) return handleResponse(res, "Request Not Found.", 404);
    await sequelize.transaction(async (t) => {
      // chain all your queries here. make sure you return them.
      const user = await sequelize.query(
        "select * from users where id = (select user_id from useraccountfeedrequests where id= :feedId)",
        {
          replacements: { feedId: request.id },
          type: QueryTypes.SELECT,
          model: User,
          mapToModel: true,
        },
        { transaction: t }
      );
      await Transactions.create(
        {
          beneficiary_id: user[0].id,
          type: "dr",
          amount: +request.amount,
          message: `${request.amount} have been added from your account`,
          user_id: authUser.id,
        },
        { transaction: t }
      );
      await UserAccountFeedRequest.update(
        {
          accepted: true,
          is_transfered: true,
          refrenceInfo,
        },
        {
          where: {
            id: request.id,
          },
        },
        { transaction: t }
      );
      const wallet = await UserWallet.findOne(
        {
          where: {
            user_id: user[0].id,
          },
        },
        { transaction: t }
      );
      if (wallet) {
        await UserWallet.update(
          {
            credit: +wallet.credit + +request.amount,
          },
          {
            where: {
              id: wallet.id,
            },
          },
          { transaction: t }
        );
      } else {
        await UserWallet.create(
          {
            user_id: user[0].id,
            credit: +request.amount,
          },
          { transaction: t }
        );
      }
      const notify = await Notification.create(
        {
          title: "Money Transfer",
          description: `hello ${user[0].fullname}, ${request.amount} have been added from your account as requested`,
          type: "admin-to-user",
          sender_id: authUser.id,
        },
        { transaction: t }
      );
      await ReadNotification.create(
        {
          notification_id: notify.id,
          receiver_id: user[0].id,
        },
        { transaction: t }
      );
      await sendNotification(notify.title, notify.description, user[0].id);
      return handleResponse(res, "Resources Updated Successfully.", 200);
    });
  } catch (error) {
    console.log(error);
    return handleForbidden(res, error);
  }
}

async function getAccountFeedRequest(requestId) {
  return await UserAccountFeedRequest.findByPk(requestId);
}
async function getAccountFeedRequestWithUser() {
  return await UserAccountFeedRequest.findOne({
    include: [
      {
        model: User,
      },
    ],
  });
}

module.exports = {
  createAccountFeedRequest,
  updateAccountFeedRequest,
  transferFeedMoneyToUser,
  getAccountFeedRequest,
  getAccountFeedRequestWithUser,
};
