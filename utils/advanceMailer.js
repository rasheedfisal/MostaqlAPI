var path = require("path");
var EmailTemplates = require("swig-email-templates");
var emailProcessor = require("./mailingProcessor");
const { USDollarFormatter } = require("./currencyFormatter");

var options = {
  root: path.join(__dirname, "..", "emailTemplates"),
};
var templates = new EmailTemplates(options);

module.exports = {
  sendToAllEnginners: async (usersList, project) => {
    try {
      var variables = {
        title: project.proj_title,
        description: project.proj_description,
        period: project.proj_period,
        skills: project.skills,
      };
      const { html, text, subject } = await templates.render(
        "newProjectCreated.html",
        variables
      );
      var emailInfo = {
        from: `Architect <${process.env.SENDGRID_USER}>`,
        to: usersList,
        subject: "New Project",
        text: text,
        html: html,
      };
      await emailProcessor.sendMail(emailInfo);
    } catch (error) {
      console.error(error);
    }
  },
  sendToUserAuthorize: async (user, status) => {
    try {
      var today = new Date();
      var date =
        today.getFullYear() +
        "-" +
        (today.getMonth() + 1) +
        "-" +
        today.getDate();
      var time =
        today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      var dateTime = date + " " + time;

      var variables = {
        username: user.fullname,
        status,
        time: dateTime,
      };
      const { html, text, subject } = await templates.render(
        "authorizeuser.html",
        variables
      );
      var emailInfo = {
        from: `Architect <${process.env.SENDGRID_USER}>`,
        to: user.email,
        subject: "Authorization Request",
        text: text,
        html: html,
      };
      await emailProcessor.sendMail(emailInfo);
    } catch (error) {
      console.error(error);
    }
  },

  sendResetPassword: async (user, reset_key) => {
    try {
      const fullPath = `${process.env.FRONTEND_BASE_URL}/reset/${user.id}/${reset_key}`;
      var today = new Date();
      var date =
        today.getFullYear() +
        "-" +
        (today.getMonth() + 1) +
        "-" +
        today.getDate();
      var time =
        today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      var dateTime = date + " " + time;

      var variables = {
        fullname: user.fullname,
        link: fullPath,
        time: dateTime,
      };
      const { html, text, subject } = await templates.render(
        "resetPassword.html",
        variables
      );
      var emailInfo = {
        from: `Architect <${process.env.SENDGRID_USER}>`,
        to: user.email,
        subject: "Reset Password",
        text: text,
        html: html,
      };
      await emailProcessor.sendMail(emailInfo);
      console.log("message sent");
    } catch (error) {
      console.error(error);
    }
  },

  sendEmailRequest: async ({
    req,
    path,
    name,
    requestName,
    requestId,
    description,
    amount,
    email,
    // attachment,
  }) => {
    try {
      const attachment = req.protocol + "://" + req.get("host") + "/" + path;
      var today = new Date();
      var date =
        today.getFullYear() +
        "-" +
        (today.getMonth() + 1) +
        "-" +
        today.getDate();
      var time =
        today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      var dateTime = date + " " + time;

      var variables = {
        name,
        requestName,
        requestId,
        description,
        amount: USDollarFormatter(amount),
        datetime: dateTime,
        attachment,
      };
      const { html, text, subject } = await templates.render(
        "paymentRequest.html",
        variables
      );
      var emailInfo = {
        from: `Architect <${process.env.SENDGRID_USER}>`,
        to: email,
        subject: requestName,
        text: text,
        html: html,
      };
      await emailProcessor.sendMail(emailInfo);
      console.log("message sent");
    } catch (error) {
      console.error(error);
    }
  },
};
