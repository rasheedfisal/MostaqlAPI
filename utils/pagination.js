module.exports = {
  getPagination: (page, size) => {
    const limit = size ? +size : 10;
    const offset = page ? (page * limit === limit ? 0 : page * limit) : 0;

    return { limit, offset };
  },
  getPagingData: (data, page, limit) => {
    const { count: totalItems, rows: results } = data;
    const currentPage = page ? +page : 0;
    const totalPages = Math.ceil(totalItems / limit);

    return { totalItems, results, totalPages, currentPage };
  },
};
