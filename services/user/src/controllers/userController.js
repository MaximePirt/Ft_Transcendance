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

async function updateUser(userId, updateData)
{
  const update = await userModel.updateUserById(userId, updateData);
  if (!update) {
    throw new Error('User not found or update failed');
  }
  return update;
}
module.exports = { getUsers,
                   getUserById,
                   updateUser };

