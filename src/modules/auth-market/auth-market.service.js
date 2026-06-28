const prisma = require("../../db/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const JWT_SECRET = process.env.MARKET_JWT_SECRET || "market-dev-secret-change-in-production";

// Регистрация нового клиента
exports.register = async ({ email, password, name, phone }) => {
  const existing = await prisma.marketUser.findUnique({ where: { email } });
  if (existing) throw new Error("Email already in use");

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.marketUser.create({
    data: { email, passwordHash, name, phone },
    select: { id: true, email: true, name: true, phone: true, createdAt: true },
  });

  const token = jwt.sign(
    { marketUserId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "30d" }
  );

  return { ok: true, token, user };
};

// Логин клиента
exports.login = async (email, password) => {
  const user = await prisma.marketUser.findUnique({ where: { email } });
  if (!user) return { ok: false };

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return { ok: false };

  const token = jwt.sign(
    { marketUserId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "30d" }
  );

  return {
    ok: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
    },
  };
};

// Получить профиль
exports.getProfile = async (marketUserId) => {
  return prisma.marketUser.findUnique({
    where: { id: marketUserId },
    select: { id: true, email: true, name: true, phone: true, createdAt: true },
  });
};

// Обновить профиль
exports.updateProfile = async (marketUserId, data) => {
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.email !== undefined) updateData.email = data.email;

  return prisma.marketUser.update({
    where: { id: marketUserId },
    data: updateData,
    select: { id: true, email: true, name: true, phone: true, createdAt: true },
  });
};

// Запрос на сброс пароля
exports.forgotPassword = async (email) => {
  const user = await prisma.marketUser.findUnique({ where: { email } });
  if (!user) return { ok: true };

  await prisma.passwordResetToken.updateMany({
    where: { marketUserId: user.id, used: false },
    data: { used: true },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { marketUserId: user.id, token, expiresAt },
  });

  return { ok: true, resetToken: token };
};

// Сброс пароля
exports.resetPassword = async (token, newPassword) => {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
    throw new Error("Invalid or expired reset token");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.marketUser.update({
      where: { id: resetToken.marketUserId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    }),
  ]);

  return { ok: true };
};