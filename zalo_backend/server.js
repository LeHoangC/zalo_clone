const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

const fs = require('fs');
const messageModel = require('./src/models/message.model');
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

const users = {};
const messages = [];

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('register_user', (userId) => {
        users[socket.id] = userId;
        socket.emit('message_history', messages);
    });

    socket.on('send_message', async (data) => {
        const receiverSocketId = Object.keys(users).find(
            (socketId) => users[socketId] === data.receiver
        );

        const messageData = {
            id: Date.now(),
            sender: data.sender || false,
            receiver: data.receiver || true,
            time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            reactions: [],
            type: data.type || 'text'
        };

        if (data.type === 'image' && data.imageUrl) {
            messageData.imageUrl = data.imageUrl;
        }
        if (data.message) {
            messageData.text = data.message;
        }
        const newMessage = await messageModel.create(messageData);

        messages.push(messageData);
        io.to(receiverSocketId).emit('receive_message', newMessage);
    });

    // Xử lý signaling cho cuộc gọi
    socket.on('call_user', (data) => {
        const receiverSocketId = Object.keys(users).find(
            (socketId) => users[socketId] === data.receiverId
        );
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('incoming_call', {
                from: users[socket.id],
                offer: data.offer,
                isVideoCall: data.isVideoCall // Thêm thông tin này
            });
        }
    });

    socket.on('answer_call', (data) => {
        const callerSocketId = Object.keys(users).find(
            (socketId) => users[socketId] === data.callerId
        );
        if (callerSocketId) {
            io.to(callerSocketId).emit('call_accepted', {
                answer: data.answer
            });
        }
    });

    socket.on('ice_candidate', (data) => {
        const targetSocketId = Object.keys(users).find(
            (socketId) => users[socketId] === data.targetId
        );
        if (targetSocketId) {
            io.to(targetSocketId).emit('ice_candidate', {
                candidate: data.candidate
            });
        }
    });



    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        delete users[socket.id];
    });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', require('./src/routes'));
require('./src/dbs/init.mongodb');

app.post('/upload', upload.single('image'), (req, res) => {
    const imageUrl = `http://localhost:3000/uploads/${req.file.filename}`;
    res.json({ imageUrl });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server đang chạy tại cổng ${PORT}`);
});