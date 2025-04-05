const mongoose = require('mongoose')
mongoose.set('strictQuery', true)

const connectString = ""

class Database {
    constructor() {
        this.connect()
    }

    connect(type = 'mongodb') {
        if (1 === 1) {
            mongoose.set('debug', true)
            mongoose.set('debug', { color: true })
        }
        mongoose
            .connect(connectString, {
                useNewUrlParser: true,
            })
            .then((_) => {
                console.log('Connected mongodb success')
            })
            .catch((err) => console.log(`Error Connect Mongodb`, err))
    }

    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database()
        }

        return Database.instance
    }
}

const instanceMongodb = Database.getInstance()
module.exports = instanceMongodb
