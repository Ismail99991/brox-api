const prisma = require("../../db/prisma");

exports.getAll = () => {
  return prisma.category.findMany({
    include: { image: true },
    orderBy: { createdAt: "desc" },
  });
};

exports.getById = (id) => {
  return prisma.category.findUnique({
    where: { id },
    include: { image: true },
  });
};

exports.create = (data) => {
  return prisma.category.create({
    data: {
      name: data.name,
      slug: data.slug,
      title: data.title,
      description: data.description,
      imageId: data.imageId || null,
    },
    include: { image: true },
  });
};

exports.update = (id, data) => {
  return prisma.category.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.imageId !== undefined && { imageId: data.imageId }),
    },
    include: { image: true },
  });
};

exports.remove = (id) => {
  return prisma.category.delete({ where: { id } });
};