function parsePagination(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limitRaw = Number.parseInt(query.limit, 10) || 20;
  const limit = Math.min(100, Math.max(1, limitRaw));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function buildPagination({ page, limit, total }) {
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

module.exports = { parsePagination, buildPagination };
