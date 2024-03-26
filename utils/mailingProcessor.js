// var nodemailer = require("nodemailer");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// var transporter = nodemailer.createTransport({
//   service: "outlook",
//   auth: {
//     user: process.env.MAILING_EMAIL,
//     pass: process.env.MAILING_PWD,
//   },
// });
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
  try {
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
    const msg = {
      to: emailInfo.to, // Change to your recipient
      from: `${emailInfo.subject} <${process.env.SENDGRID_USER}>`, // Change to your verified sender
      subject: emailInfo.subject,
      //text: "and easy to do anywhere, even with Node.js",
      html: emailInfo.html,
    };
    await sgMail.send(msg);
  } catch (error) {
    console.log(error);
  }

  // transporter.sendMail(emailInfo, function (error, info) {
  //   if (error) {
  //     console.log(error);
  //   } else {
  //     console.log("Message sent: " + info.response);
  //   }
  // });
};
