const userModel = require('../models/userModel');
async function getUsers() {
  const users = await userModel.findAllUsers();
  if (!users) {
    throw new Error("Users database is empty");
  }
  return users;
}

async function getUserById(id) {
  const user = await userModel.findUserById(id);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
}
module.exports = { getUsers, getUserById };
