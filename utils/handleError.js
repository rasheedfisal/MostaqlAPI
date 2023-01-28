module.exports = {
  handleForbidden: (res, msg) => {
    if (msg === "Forbidden") {
      res.status(403).send({
        success: false,
        msg,
      });
    } else {
      res.status(500).send({
        success: false,
        msg: "Internal Server Error",
      });
    }
  },
  handleResponse: (res, msg, code) => {
    res.status(code).send({
      msg,
    });
  },
};
