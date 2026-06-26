const prisma = require("../../db/prisma");
const bcrypt = require("bcrypt");

exports.getUsers = () => {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      avatarId: true,
      avatar: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

exports.getUserById = (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      avatarId: true,
      avatar: true,
      createdAt: true,
    },
  });
};

exports.createUser = async ({ email, password }) => {
  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: { email, passwordHash },
    select: { id: true, email: true, avatar: true, createdAt: true },
  });
};

exports.updateUser = async (id, { email, password }) => {
  const data = {};

  if (email) data.email = email;
  if (password) data.passwordHash = await bcrypt.hash(password, 10);

  return prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, avatar: true, createdAt: true },
  });
};

exports.deleteUser = (id) => {
  return prisma.user.delete({
    where: { id },
  });
};