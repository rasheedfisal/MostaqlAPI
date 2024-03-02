const allowedOrigins = require("./allowedOrigins");

const corsOptions = {
  origin: (origin, callback) => {
    //if (allowedOrigins.indexOf(origin) !== -1) { // production
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) { // developemnt
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

module.exports = corsOptions;
