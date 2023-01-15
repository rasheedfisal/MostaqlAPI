var path = require("path");
var EmailTemplates = require("swig-email-templates");
var emailProcessor = require("./mailingProcessor");

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
        from: process.env.MAILING_EMAIL,
        to: usersList,
        subject: "New Project",
        text: text,
        html: html,
      };
      emailProcessor.sendMail(emailInfo);
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
        from: process.env.MAILING_EMAIL,
        to: user.email,
        subject: "Authorization Request",
        text: text,
        html: html,
      };
      emailProcessor.sendMail(emailInfo);
    } catch (error) {
      console.error(error);
    }
  },
};
