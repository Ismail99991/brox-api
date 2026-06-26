const prisma = require("../../db/prisma");

// статус переходов
const allowedTransitions = {
  CREATED: ["PENDING", "CANCELED"],
  PENDING: ["PAID", "CANCELED"],
  PAID: ["IN_PROGRESS", "CANCELED"],
  IN_PROGRESS: ["SHIPPED"],
  SHIPPED: ["DONE"],
  DONE: [],
  CANCELED: [],
};

// CREATE ORDER
exports.createOrder = async ({ userId, items }) => {
  if (!items?.length) {
    throw new Error("No items in order");
  }

  const productIds = items.map(i => i.productId);

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  if (products.length !== items.length) {
    throw new Error("Some products not found");
  }

  let total = 0;

  const enrichedItems = items.map(i => {
    const product = products.find(p => p.id === i.productId);

    const quantity = i.quantity || 1;
    const price = product.price;

    total += price * quantity;

    return {
      productId: product.id,
      quantity,
      price,
    };
  });

  return prisma.order.create({
    data: {
      userId,
      total,
      status: "CREATED",
      items: {
        create: enrichedItems,
      },
    },
    include: {
      items: true,
    },
  });
};

// GET ALL ORDERS
exports.getOrders = () => {
  return prisma.order.findMany({
    include: {
      items: true,
      user: true,
      documents: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

// GET ONE ORDER
exports.getOrderById = (id) => {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      user: true,
      documents: true,
    },
  });
};

// UPDATE STATUS (SAFE)
exports.updateStatus = async (orderId, newStatus) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const allowed = allowedTransitions[order.status];

  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Invalid transition: ${order.status} → ${newStatus}`
    );
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
  });
};

// DELETE ORDER
exports.deleteOrder = (id) => {
  return prisma.order.delete({
    where: { id },
  });
};