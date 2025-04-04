const { Schema, model, Types } = require('mongoose')

const DOCUMENT_NAME = 'Message'
const COLLECTION_NAME = 'messages'

const conversationSchema = new Schema(
    {
        sender: { type: String, required: true },
        receiver: { type: String, required: true },
        text: { type: String, default: '' },
        imageUrl: { type: String, default: '' },
        time: { type: String, required: true },
        type: { type: String, default: 'text', enum: ['text', 'image'] },
        reactions: [{ type: String }], // Có thể mở rộng để lưu reactions nếu cần
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    }
)

module.exports = model(DOCUMENT_NAME, conversationSchema)
