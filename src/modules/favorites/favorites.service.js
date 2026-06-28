const prisma = require("../../db/prisma");

// GET /api/market/favorites
exports.getFavorites = (marketUserId) => {
  return prisma.favorite.findMany({
    where: { marketUserId },
    include: {
      product: {
        include: {
          category: true,
          images: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

// POST /api/market/favorites
exports.addFavorite = async (marketUserId, productId) => {
  const existing = await prisma.favorite.findUnique({
    where: { marketUserId_productId: { marketUserId, productId } },
  });

  if (existing) return existing;

  return prisma.favorite.create({
    data: { marketUserId, productId },
    include: {
      product: {
        include: {
          category: true,
          images: true,
        },
      },
    },
  });
};

// DELETE /api/market/favorites/:productId
exports.removeFavorite = async (marketUserId, productId) => {
  await prisma.favorite.delete({
    where: { marketUserId_productId: { marketUserId, productId } },
  });
  return { ok: true };
};

// GET /api/market/favorites/check/:productId
exports.checkFavorite = async (marketUserId, productId) => {
  const existing = await prisma.favorite.findUnique({
    where: { marketUserId_productId: { marketUserId, productId } },
  });
  return { isFavorite: !!existing };
};