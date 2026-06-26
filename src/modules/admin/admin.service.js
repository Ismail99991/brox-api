const prisma = require("../../db/prisma");

// CREATE
exports.createProduct = async (data) => {
  const { imageIds, ...productData } = data;

  const product = await prisma.product.create({
    data: {
      title: productData.title,
      slug: productData.slug,
      description: productData.description,
      price: productData.priceType === "FIXED" ? productData.price : null,
      priceType: productData.priceType || "FIXED",
      characteristics: productData.characteristics || [],
      article: productData.article || null,
      categoryId: productData.categoryId,
    },
  });

  // Привязываем загруженные файлы к продукту
  if (imageIds?.length) {
    await prisma.file.updateMany({
      where: { id: { in: imageIds } },
      data: { productId: product.id },
    });
  }

  return prisma.product.findUnique({
    where: { id: product.id },
    include: {
      category: true,
      images: true,
    },
  });
};

// UPDATE
exports.updateProduct = async (id, data) => {
  const { imageIds, ...productData } = data;

  const updateData = {
    ...(productData.title !== undefined && { title: productData.title }),
    ...(productData.slug !== undefined && { slug: productData.slug }),
    ...(productData.description !== undefined && { description: productData.description }),
    ...(productData.priceType !== undefined && { priceType: productData.priceType }),
    ...(productData.price !== undefined && { price: productData.priceType === "FIXED" ? productData.price : null }),
    ...(productData.characteristics !== undefined && { characteristics: productData.characteristics }),
    ...(productData.article !== undefined && { article: productData.article }),
    ...(productData.categoryId !== undefined && { categoryId: productData.categoryId }),
    ...(productData.isActive !== undefined && { isActive: productData.isActive }),
  };

  // Если priceType = QUOTE, сбрасываем price
  if (productData.priceType === "QUOTE") {
    updateData.price = null;
  }

  await prisma.product.update({
    where: { id },
    data: updateData,
  });

  // Обновляем привязку файлов
  if (imageIds !== undefined) {
    // Отвязываем старые файлы
    await prisma.file.updateMany({
      where: { productId: id },
      data: { productId: null },
    });
    // Привязываем новые
    if (imageIds.length) {
      await prisma.file.updateMany({
        where: { id: { in: imageIds } },
        data: { productId: id },
      });
    }
  }

  return prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      images: true,
    },
  });
};

// DELETE
exports.deleteProduct = (id) => {
  return prisma.product.delete({
    where: { id },
  });
};