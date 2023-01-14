module.exports = {
  getPagination: (page, size) => {
    const limit = size ? +size : 10;
    const offset = (page - 1) * limit; // mysql offset starts at 0
    //const offset = (page - 1) * limit + 1; // for future refrence if some database offset starts at 1

    return { limit, offset };
  },
  getPagingData: (data, page, limit) => {
    const { count: totalItems, rows: results } = data;
    const currentPage = page ? +page : 0;
    const totalPages = Math.ceil(totalItems / limit);

    return { totalItems, results, totalPages, currentPage };
  },
};

// 1, 10
// limit = 10
//offset = 10
