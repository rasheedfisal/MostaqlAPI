var nodemailer = require("nodemailer");
// const sgMail = require("@sendgrid/mail");
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

var transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_API_KEY,
  },
});
// var transporter = nodemailer.createTransport({
//   host: "mail.sudasofttech.com",
//   port: 587,
//   secure: false, // true for 465, false for other ports
//   auth: {
//     user: process.env.MAILING_EMAIL, // your domain email address
//     pass: process.env.MAILING_PWD, // your password
//   },
// });

exports.sendMail = async function (emailInfo) {
  // const formData = new FormData();
  // formData.append("ToEmail", emailInfo.to);
  // formData.append("Subjuect", emailInfo.subject);
  // formData.append("Body", emailInfo.html);
  //try {
  // const response = await fetch(process.env.EMAIL_SERVICE_ENDPOINT_URL, {
  //   method: "POST",
  //   headers: {
  //     XApiKey: process.env.EMAIL_KEY_AUTH,
  //   },
  //   // body: JSON.stringify({
  //   //   email: email.value,
  //   //   password: password.value,
  //   // }),
  //   body: formData,
  // });
  // const msg = {
  //   to: emailInfo.to, // Change to your recipient
  //   from: `Architect <${process.env.SENDGRID_USER}>`, // Change to your verified sender
  //   subject: emailInfo.subject,
  //   cc: ["rasheed.remix777@gmail.com", "yasser8351@gmail.com"],
  //   //text: "and easy to do anywhere, even with Node.js",
  //   html: emailInfo.html,
  // };
  // const sended = await sgMail.send(msg);
  //   console.log("sended: ", sended);
  // } catch (error) {
  //   console.log(error);
  // }
  transporter.sendMail(emailInfo, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Message sent: " + info.response);
    }
  });
};
