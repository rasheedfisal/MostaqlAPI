const express = require("express");
const router = express.Router();
const {
  sequelize,
  UserWithdrawalRequest,
  UserAccountFeedRequest,
  UserCreditCardRequest,
  UserPaypalRequest,
  UserWallet,
  Notification,
  ReadNotification,
  User,
  Role,
  Transactions,
} = require("../models");
const passport = require("passport");
require("../config/passport")(passport);
const Helper = require("../utils/helper");
const helper = new Helper();
const multer = require("multer");
const { getPagination, getPagingData } = require("../utils/pagination");
const { getPath, getNestedPath } = require("../utils/fileUrl");
const { QueryTypes } = require("sequelize");
const { sendNotification } = require("../utils/advanceNotifier");
const { isUserHaveMinimumAmount } = require("../utils/commissions");
const { handleForbidden, handleResponse } = require("../utils/handleError");
const { sendEmailRequest } = require("../utils/advanceMailer");
const {
  updateAccountFeedRequest,
  createAccountFeedRequest,
  transferFeedMoneyToUser,
  getAccountFeedRequest,
} = require("../services/payment");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().replace(/:/g, "_") + "use_" + file.originalname
    );
  },
});

const imageFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "application/msword" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.mimetype === "text/plain" ||
    file.mimetype === "application/vnd.ms-excel" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.mimetype === "application/pdf"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
});

////////// feed account request ///////////////

// payment checkout
router.get(
  "/checkout",
  passport.authenticate("jwt", {
    session: false,
  }),
  async function (req, res) {
    const { requestId } = req.query;

    if (!requestId) {
      return res.redirect("/");
    }

    const feedRequest = await getAccountFeedRequest(requestId);

    if (!feedRequest) {
      return res.redirect("/");
    }

    const amount = currencyFormatter.SARFormatter(feedRequest.amount);
    const amount_without_vat = currencyFormatter.SARFormatter(
      feedRequest.amount
    );
    const vat_percent_amount = currencyFormatter.SARFormatter(
      (feedRequest.amount * 10) / 100
    );
    const refund_guarantee = currencyFormatter.SARFormatter(4);
    const amount_with_vat = currencyFormatter.SARFormatter(
      amount_without_vat.float +
        vat_percent_amount.float +
        refund_guarantee.float
    );
    res.render("checkout-v2", {
      amount: amount.result,
      amount_without_vat: amount_without_vat.result,
      vat_percent_amount: vat_percent_amount.result,
      refund_guarantee: refund_guarantee.result,
      amount_with_vat: amount_with_vat.result,
      requestId,
    });
  }
);

// Create a new Feed Request
router.post(
  "/feed",
  upload.single("attachment"),
  passport.authenticate("jwt", {
    session: false,
  }),
  async function (req, res) {
    const {
      user,
      body: { amount },
      file: { path },
    } = req;
    return await createAccountFeedRequest(
      { authUser: user, amount, attachment: path },
      res
    );
  }
);

// Get All Account Feed
router.get(
  "/feed",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    const { page, size } = req.query;
    const { limit, offset } = getPagination(page, size);
    helper
      .checkPermission(req.user.role_id, "feed_request_account_get_all")
      .then((rolePerm) => {
        UserAccountFeedRequest.findAndCountAll({
          limit,
          offset,
          include: [
            {
              model: User,
              include: [
                { model: Role, attributes: ["role_name"] },
                {
                  model: UserWallet,
                  as: "wallet",
                },
              ],
            },
          ],
          attributes: [
            "id",
            "amount",
            getPath(req, "attachment"),
            "accepted",
            "is_transfered",
            "createdAt",
          ],
          distinct: true,
          order: [["createdAt", "desc"]],
        })
          .then((requests) => {
            res.status(200).send(getPagingData(requests, page, limit));
          })
          .catch((error) => {
            console.log(error);
            res.status(500).send({ msg: error });
          });
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

// Get All Account Feed by User
router.get(
  "/feed/user",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "feed_request_account_get")
      .then((rolePerm) => {
        UserAccountFeedRequest.findAll({
          include: [
            {
              model: User,
              attributes: [
                "id",
                "email",
                "fullname",
                "phone",
                getPath(req, "imgPath"),
                "is_active",
                "createdAt",
              ],
              include: {
                model: Role,
                attributes: ["role_name"],
              },
            },
          ],
          attributes: [
            "id",
            "amount",
            getPath(req, "attachment"),
            "accepted",
            "createdAt",
          ],
          distinct: true,
          order: [["createdAt", "desc"]],
          where: {
            user_id: req.user.id,
          },
        })
          .then((requests) => {
            res.status(200).send(getPagingData(requests, page, limit));
          })
          .catch((error) => {
            res.status(500).send({ msg: error });
          });
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

// Approve or Reject Account Feed Request
router.put(
  "/feed/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  async function (req, res) {
    const {
      user,
      body: { accepted },
      params: { id },
    } = req;
    return await updateAccountFeedRequest(
      { id, authUser: user, accepted },
      res
    );
  }
);

// transfer account feed money
router.put(
  "/feed/transfer/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  async function (req, res) {
    const {
      user,
      params: { id },
      body: { refrenceInfo },
    } = req;
    return await transferFeedMoneyToUser(
      { authUser: user, id, refrenceInfo },
      res
    );
  }
);

////////// withdrawal request ///////////////

// Create a withdraw Request with paypal
router.post(
  "/withdraw/paypal",
  upload.single("attachment"),
  passport.authenticate("jwt", {
    session: false,
  }),
  async function (req, res) {
    try {
      await helper.checkPermission(
        req.user.role_id,
        "withdraw_request_account_add"
      );

      if (!req.body.amount || !req.body.email)
        return handleResponse(res, "Please Pass Required Fields.", 400);

      const isTrue = await isUserHaveMinimumAmount(req.user.id);

      if (!isTrue)
        return handleResponse(res, "User Doesn't have Sufficient Credit.", 400);

      await sequelize.transaction(async (t) => {
        // chain all your queries here. make sure you return them.
        const request = await UserWithdrawalRequest.create(
          {
            amount: req.body.amount,
            user_id: req.user.id,
            attachment: req.file?.path,
            type: "paypal",
          },
          { transaction: t }
        );
        await UserPaypalRequest.create(
          {
            withdraw_id: request.id,
            email: req.body.email,
          },
          { transaction: t }
        );
        const notify = await Notification.create(
          {
            title: "Paypal Withdrawal Request",
            description: `user ${req.user.fullname} is requesting to withdraw money from his account based on the attachment he sent, please view the attachment below`,
            type: "admin-to-user",
            sender_id: req.user.id,
          },
          { transaction: t }
        );
        const users = await sequelize.query(
          "select id from users where role_id in(select a.id from roles as a " +
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
              notification_id: notify.id,
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
            notify.title,
            notify.description,
            a.id
          );
          notifyPromises.push(notifyPromise);
        });
        await Promise.all(notifyPromises);

        await sendEmailRequest({
          req,
          path: req.file?.path,
          name: "Staff Members",
          requestName: notify.title,
          requestId: request.id,
          description: notify.description,
          amount: request.amount,
          email: users.map((a) => a.email),
        });
        return handleResponse(res, "Resources Updated Successfully.", 200);
      });
    } catch (error) {
      return handleForbidden(res, error);
    }
  }
);

// Create a withdraw Request with creditcard
router.post(
  "/withdraw/creditcard",
  upload.single("attachment"),
  passport.authenticate("jwt", {
    session: false,
  }),
  async function (req, res) {
    try {
      await helper.checkPermission(
        req.user.role_id,
        "withdraw_request_account_add"
      );

      if (
        !req.body.amount ||
        !req.body.name ||
        !req.body.card_number ||
        !req.body.expiration ||
        !req.body.security_code
      )
        return handleResponse(res, "Please Pass Required Fields.", 400);

      const isTrue = await isUserHaveMinimumAmount(req.user.id);
      if (!isTrue)
        return handleResponse(res, "User Doesn't have Sufficient Credit", 400);

      await sequelize.transaction(async (t) => {
        // chain all your queries here. make sure you return them.
        const request = await UserWithdrawalRequest.create(
          {
            amount: req.body.amount,
            user_id: req.user.id,
            attachment: req.file?.path,
            type: "creditcard",
          },
          { transaction: t }
        );
        await UserCreditCardRequest.create(
          {
            withdraw_id: request.id,
            name: req.body.name,
            card_number: req.body.card_number,
            expiration: req.body.expiration,
            security_code: req.body.security_code,
          },
          { transaction: t }
        );
        const notify = await Notification.create(
          {
            title: "Credit Card Withdrawal Request",
            description: `user ${req.user.fullname} is requesting to withdraw money from his account based on the attachment he sent, please view the attachment below`,
            type: "admin-to-user",
            sender_id: req.user.id,
          },
          { transaction: t }
        );
        const users = await sequelize.query(
          "select id from users where role_id in(select a.id from roles as a " +
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
              notification_id: notify.id,
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
            notify.title,
            notify.description,
            a.id
          );
          notifyPromises.push(notifyPromise);
        });
        await Promise.all(notifyPromises);

        await sendEmailRequest({
          req,
          path: req.file?.path,
          name: "Staff Members",
          requestName: notify.title,
          requestId: request.id,
          description: notify.description,
          amount: request.amount,
          email: users.map((a) => a.email),
        });
        return handleResponse(res, "Resourse created Successfully", 201);
      });
    } catch (error) {
      return handleForbidden(res, error);
    }
  }
);

// Get All Withdrawals
router.get(
  "/withdraw",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    const { page, size } = req.query;
    const { limit, offset } = getPagination(page, size);
    helper
      .checkPermission(req.user.role_id, "withdraw_request_get_all")
      .then((rolePerm) => {
        UserWithdrawalRequest.findAndCountAll({
          limit,
          offset,
          include: [
            {
              model: User,
              include: [
                {
                  model: Role,
                  attributes: ["role_name"],
                },
                {
                  model: UserWallet,
                  as: "wallet",
                },
              ],
            },

            {
              model: UserPaypalRequest,
              as: "paypal",
            },
            {
              model: UserCreditCardRequest,
              as: "creditcard",
            },
          ],
          attributes: [
            "id",
            "amount",
            getPath(req, "attachment"),
            "accepted",
            "is_transfered",
            "type",
            "createdAt",
          ],
          distinct: true,
          order: [["createdAt", "desc"]],
        })
          .then((requests) => {
            res.status(200).send(getPagingData(requests, page, limit));
          })
          .catch((error) => {
            res.status(500).send({ msg: error });
          });
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

// Get All Withdraw by User
router.get(
  "/withdraw/user",
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res) {
    helper
      .checkPermission(req.user.role_id, "withdraw_request_get")
      .then((rolePerm) => {
        UserWithdrawalRequest.findAll({
          include: [
            {
              model: User,
              attributes: [
                "id",
                "email",
                "fullname",
                "phone",
                getPath(req, "imgPath"),
                "is_active",
                "createdAt",
              ],
              include: {
                model: Role,
                attributes: ["role_name"],
              },
            },
            {
              model: UserPaypalRequest,
              as: "paypal",
            },
            {
              model: UserCreditCardRequest,
              as: "creditcard",
            },
          ],
          attributes: [
            "id",
            "amount",
            getPath(req, "attachment"),
            "accepted",
            "type",
            "createdAt",
          ],
          distinct: true,
          order: [["createdAt", "desc"]],
          where: {
            user_id: req.user.id,
          },
        })
          .then((requests) => {
            res.status(200).send(getPagingData(requests, page, limit));
          })
          .catch((error) => {
            res.status(500).send({ msg: error });
          });
      })
      .catch((error) => {
        res.status(403).send({ msg: error });
      });
  }
);

// Approve or Reject Withdrawal Request
router.put(
  "/withdraw/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  async function (req, res) {
    try {
      await helper.checkPermission(
        req.user.role_id,
        "withdraw_request_approve_reject"
      );

      if (!req.params.id)
        return handleResponse(res, "Please Pass Required Fields.", 400);

      const request = await UserWithdrawalRequest.findByPk(req.params.id);

      if (!request) return handleResponse(res, "Request Not Found.", 404);

      await sequelize.transaction(async (t) => {
        // chain all your queries here. make sure you return them.
        await UserWithdrawalRequest.update(
          {
            accepted: req.body?.accepted,
          },
          {
            where: {
              id: req.params.id,
            },
          },
          { transaction: t }
        );
        const user = await sequelize.query(
          "select * from users where id = (select user_id from userwithdrawalrequests where id= :reqId)",
          {
            replacements: { reqId: req.params.id },
            type: QueryTypes.SELECT,
            model: User,
            mapToModel: true,
          },
          { transaction: t }
        );
        const notify = await Notification.create(
          {
            title: "Withrawal Request",
            description: `hello ${
              user[0].fullname
            }, your request for withdraw money from your account was ${
              req.body?.accepted ? "accepted" : "rejected"
            }`,
            type: "admin-to-user",
            sender_id: req.user.id,
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
      return handleForbidden(res, error);
    }
  }
);

// Transfer withdraw request Money
router.put(
  "/withdraw/transfer/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  async function (req, res) {
    try {
      await helper.checkPermission(
        req.user.role_id,
        "withdraw_request_approve_reject"
      );

      if (!req.params.id)
        return handleResponse(res, "Please Pass Required Fields.");

      const request = await UserWithdrawalRequest.findByPk(req.params.id);

      if (!request?.accepted)
        return handleResponse(res, "Request was not Approved.", 400);

      await sequelize.transaction(async (t) => {
        // chain all your queries here. make sure you return them.
        const user = await sequelize.query(
          "select * from users where id = (select user_id from userwithdrawalrequests where id= :reqId)",
          {
            replacements: { reqId: req.params.id },
            type: QueryTypes.SELECT,
            model: User,
            mapToModel: true,
          },
          { transaction: t }
        );
        await Transactions.create(
          {
            beneficiary_id: user[0].id,
            type: "cr",
            amount: +request.amount,
            message: `${request.amount} have been withdrawn from your account`,
            user_id: req.user.id,
          },
          { transaction: t }
        );
        await UserWithdrawalRequest.update(
          {
            is_transfered: true,
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
              credit: +wallet.credit - +request.amount,
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
            description: `hello ${user[0].fullname}, ${request.amount} was withdrawn from your account as requested`,
            type: "admin-to-user",
            sender_id: req.user.id,
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
);

module.exports = router;
