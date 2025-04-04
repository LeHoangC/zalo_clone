const { users } = require("../constants");
const userModel = require("../models/user.model");

const register = async (req, res) => {
    try {
        const { username, password } = req.body;
        // Check if username already exists

        const existingUser = await userModel.findOne({ name: username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const user = await userModel.create({ name: username, password });
        res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error });
    }
}

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        // Check if username and password are correct

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const user = users.find(user => user.name === username && user.password === password);
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        res.status(200).json({ message: 'Oke', user });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error });
    }
}

module.exports = { register, login }