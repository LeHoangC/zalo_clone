const messageModel = require("../models/message.model")

const getMessage = async (req, res) => {
    const { senderId, receiveId } = req.params
    const findMessages = await messageModel.find({
        $or: [
            { sender: senderId, receiver: receiveId },
            { sender: receiveId, receiver: senderId }
        ]
    }).sort({ createdAt: 1 })
    return res.json({ messages: findMessages })
}

module.exports = { getMessage }