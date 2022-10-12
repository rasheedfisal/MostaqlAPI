module.exports = {
  development: {
    username: process.env.USERNAME_DEV,
    password: process.env.PASSWORD_DEV,
    database: process.env.DATABASE_DEV,
    host: process.env.HOST_DEV,
    dialect: process.env.DAILECT_DEV,
  },
  test: {
    username: process.env.USERNAME_TEST,
    password: process.env.PASSWORD_TEST,
    database: process.env.DATABASE_TEST,
    host: process.env.HOST_TEST,
    dialect: process.env.DAILECT_TEST,
  },
  production: {
    username: process.env.USERNAME_PROD,
    password: process.env.PASSWORD_PROD,
    database: process.env.DATABASE_PROD,
    host: process.env.HOST_PROD,
    dialect: process.env.DAILECT_PROD,
  },
};
