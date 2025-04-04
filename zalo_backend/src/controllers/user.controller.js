const { users } = require("../constants")
const userModel = require("../models/user.model")

const getAllUsers = async (req, res) => {
    // const users = await userModel.find()

    return res.json(users)
}

module.exports = getAllUsers