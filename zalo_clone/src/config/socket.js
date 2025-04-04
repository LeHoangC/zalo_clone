import io from 'socket.io-client';

// Khởi tạo socket connection
const socket = io('http://localhost:3000');

export default socket;