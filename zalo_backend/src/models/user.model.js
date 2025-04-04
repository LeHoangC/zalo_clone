const { Schema, model, Types } = require('mongoose')
const slugify = require('slugify')

const DOCUMENT_NAME = 'User'
const COLLECTION_NAME = 'users'

const userSchema = new Schema(
    {
        name: {
            type: String,
            trim: true,
            maxLength: 100,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        slug: {
            type: String,
            required: true,
        }
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    }
)

userSchema.index({ name: 'text' })

userSchema.pre('validate', function (next) {
    const randomId = Math.floor(Math.random() * 90000 + 10000)
    this.slug = slugify(`${this.name}.${randomId.toString()}`, { lower: true, locale: 'vi' })
    next()
})

module.exports = model(DOCUMENT_NAME, userSchema)
