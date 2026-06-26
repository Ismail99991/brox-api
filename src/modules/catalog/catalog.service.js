const prisma = require("../../db/prisma");

exports.getProducts = () => {
  return prisma.product.findMany({
    include: {
      category: { include: { image: true } },
      images: true,
    },
  });
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