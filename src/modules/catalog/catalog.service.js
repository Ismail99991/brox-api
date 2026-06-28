const prisma = require("../../db/prisma");

// GET /api/products — поиск и фильтрация
exports.getProducts = ({ search, categoryId, minPrice, maxPrice, isActive, sortBy, sortOrder, page, limit } = {}) => {
  const where = {};

  // Фильтр по активности (по умолчанию только активные для публичного API)
  if (isActive !== undefined) {
    where.isActive = isActive === "true" || isActive === true;
  } else {
    where.isActive = true;
  }

  // Фильтр по категории
  if (categoryId) {
    where.categoryId = categoryId;
  }

  // Поиск по названию, артикулу, описанию
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { article: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  // Фильтр по цене
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = parseFloat(minPrice);
    if (maxPrice !== undefined) where.price.lte = parseFloat(maxPrice);
  }

  // Сортировка
  const orderBy = {};
  if (sortBy === "price" || sortBy === "title" || sortBy === "createdAt") {
    orderBy[sortBy] = sortOrder === "asc" ? "asc" : "desc";
  } else {
    orderBy.createdAt = "desc";
  }

  // Пагинация
  const take = Math.min(parseInt(limit) || 50, 100);
  const skip = ((parseInt(page) || 1) - 1) * take;

  return prisma.product.findMany({
    where,
    orderBy,
    skip,
    take,
    include: {
      category: { include: { image: true } },
      images: true,
    },
  });
};

// GET /api/products/count — количество товаров (для пагинации)
exports.getProductsCount = ({ search, categoryId, minPrice, maxPrice, isActive } = {}) => {
  const where = {};

  if (isActive !== undefined) {
    where.isActive = isActive === "true" || isActive === true;
  } else {
    where.isActive = true;
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { article: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = parseFloat(minPrice);
    if (maxPrice !== undefined) where.price.lte = parseFloat(maxPrice);
  }

  return prisma.product.count({ where });
};

exports.getProductBySlug = (slug) => {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      category: { include: { image: true } },
      images: true,
    },
  });
};

exports.getProductById = (id) => {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: { include: { image: true } },
      images: true,
    },
  });
};