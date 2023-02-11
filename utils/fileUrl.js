const Sequelize = require("sequelize");
let fullPath = "";
module.exports = {
  getPath: (req, filename) => {
    fullPath = req.protocol + "://" + req.get("host") + "/";
    return [
      Sequelize.fn("concat", fullPath, Sequelize.col(filename)),
      filename,
    ];
  },
  getNestedPath: (req, filename, col_name) => {
    fullPath = req.protocol + "://" + req.get("host") + "/";

    return [
      Sequelize.fn("concat", fullPath, Sequelize.col(filename)),
      col_name,
    ];
  },
};
