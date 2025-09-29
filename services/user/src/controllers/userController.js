const userModel = require('../models/userModel');
async function getUsers() {
  const users = await userModel.findAllUsers();
  return users;
}
module.exports = { getUsers };
