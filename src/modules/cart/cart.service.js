const prisma = require("../../db/prisma");

exports.getCart = (marketUserId) => {
  return prisma.cartItem.findMany({
    where: { marketUserId },
    include: {
      product: {
        include: {
          category: true,
          images: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
};

exports.addToCart = async (marketUserId, productId, quantity = 1) => {
  const existing = await prisma.cartItem.findUnique({
    where: { marketUserId_productId: { marketUserId, productId } },
  });

  if (existing) {
    return prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
      include: {
        product: {
          include: {
            category: true,
            images: true,
          },
        },
      },
    });
  }

  return prisma.cartItem.create({
    data: { marketUserId, productId, quantity },
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

exports.updateQuantity = async (marketUserId, productId, quantity) => {
  if (quantity < 1) {
    await prisma.cartItem.delete({
      where: { marketUserId_productId: { marketUserId, productId } },
    });
    return { ok: true, deleted: true };
  }

  return prisma.cartItem.update({
    where: { marketUserId_productId: { marketUserId, productId } },
    data: { quantity },
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

exports.removeFromCart = async (marketUserId, productId) => {
  await prisma.cartItem.delete({
    where: { marketUserId_productId: { marketUserId, productId } },
  });
  return { ok: true };
};

exports.clearCart = async (marketUserId) => {
  await prisma.cartItem.deleteMany({ where: { marketUserId } });
  return { ok: true };
};