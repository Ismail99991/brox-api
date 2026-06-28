const prisma = require("../../db/prisma");

// POST /api/market/callback — заказ обратного звонка (публичный)
exports.createCallback = (data) => {
  return prisma.callbackRequest.create({
    data: {
      name: data.name,
      phone: data.phone,
      comment: data.comment || null,
    },
  });
};

// POST /api/market/quote-request — запрос КП (авторизованный маркет-пользователь)
exports.createQuoteRequest = async ({ marketUserId, productId, message, payload }) => {
  return prisma.quoteRequest.create({
    data: {
      marketUserId,
      productId: productId || null,
      message: message || null,
      payload: payload || null,
      status: "NEW",
    },
    include: {
      product: true,
      marketUser: {
        select: { id: true, email: true, name: true, phone: true },
      },
    },
  });
};

// GET /api/market/quote-request — свои заявки
exports.getMyQuoteRequests = (marketUserId) => {
  return prisma.quoteRequest.findMany({
    where: { marketUserId },
    include: {
      product: true,
      attachments: true,
    },
    orderBy: { createdAt: "desc" },
  });
};