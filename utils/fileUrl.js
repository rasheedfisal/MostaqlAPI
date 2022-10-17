const Sequelize = require("sequelize");

module.exports = {
  getPath: (req, filename) => {
    return [
      Sequelize.fn("concat", req.headers.host, "/", Sequelize.col(filename)),
      filename,
    ];
  },
};
