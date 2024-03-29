require("dotenv").config();
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const verifyJWT = require("./middlewares/verifyJWT");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var rolesRouter = require("./routes/roles");
var permsRouter = require("./routes/permissions");
var authRouter = require("./routes/auth");
var RangeRouter = require("./routes/pricerange");
var CategoryRouter = require("./routes/category");
var UserProfileRouter = require("./routes/userprofile");
var ProjectRouter = require("./routes/project");
var ProjectOfferRouter = require("./routes/projectoffers");
var ConversationsRouter = require("./routes/conversations");
var CommissionsRouter = require("./routes/commissionrate");
var CommonQuestionsRouter = require("./routes/commonquestions");
var UserReviewsRouter = require("./routes/userreviews");
var ResetPasswordRouter = require("./routes/resetpassword");
var SiteInfoRouter = require("./routes/siteinfo");
var SiteInfoAdminRouter = require("./routes/siteinfoadmin");
var PaymentsRouter = require("./routes/payments");
var SupportBoxRouter = require("./routes/supportbox");
var NotificationRouter = require("./routes/notification");
const pubClient = require("./utils/redisClient");

var app = express();

app.use(cors(corsOptions));

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const apiV1 = "/api/v1";

app.use("/", indexRouter);
app.use(`${apiV1}/auth`, authRouter);
app.use(`${apiV1}/reset`, ResetPasswordRouter);
app.use(`${apiV1}/site`, SiteInfoRouter);

app.use(verifyJWT);

app.use(`${apiV1}/users`, usersRouter);
app.use(`${apiV1}/roles`, rolesRouter);
app.use(`${apiV1}/permissions`, permsRouter);
app.use(`${apiV1}/pricerange`, RangeRouter);
app.use(`${apiV1}/category`, CategoryRouter);
app.use(`${apiV1}/profile`, UserProfileRouter);
app.use(`${apiV1}/project`, ProjectRouter);
app.use(`${apiV1}/offer`, ProjectOfferRouter);
app.use(`${apiV1}/conversations`, ConversationsRouter);
app.use(`${apiV1}/rate`, CommissionsRouter);
app.use(`${apiV1}/questions`, CommonQuestionsRouter);
app.use(`${apiV1}/reviews`, UserReviewsRouter);
app.use(`${apiV1}/siteadmin`, SiteInfoAdminRouter);
app.use(`${apiV1}/payments`, PaymentsRouter);
app.use(`${apiV1}/support`, SupportBoxRouter);
app.use(`${apiV1}/notification`, NotificationRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});
(async () => {
  await pubClient.connect();
})();

module.exports = app;
