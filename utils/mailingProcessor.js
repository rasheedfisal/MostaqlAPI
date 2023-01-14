var nodemailer = require("nodemailer");

var transporter = nodemailer.createTransport({
  service: "outlook",
  auth: {
    user: process.env.MAILING_EMAIL,
    pass: process.env.MAILING_PWD,
  },
});

exports.sendMail = function (emailInfo) {
  transporter.sendMail(emailInfo, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Message sent: " + info.response);
    }
  });
};
