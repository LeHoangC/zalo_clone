import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import socket from './config/socket'

function App() {
    const [username, setUsername] = useState('')
    const [currentUserData, setCurrentUserData] = useState({})
    const [password, setPassword] = useState('')

    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [selectedChat, setSelectedChat] = useState(null)

    useEffect(() => {
        if (isLoggedIn) {
            socket.emit('register_user', currentUserData._id)
        }
    }, [isLoggedIn, currentUserData])

    const handleLogin = async (e) => {
        e.preventDefault()

        const response = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        })

        if (response.status === 200) {
            setIsLoggedIn(true)
        }

        const data = await response.json()

        setCurrentUserData(data.user)
    }

    if (!isLoggedIn) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="w-96 bg-white p-8 rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold text-center mb-6">Đăng nhập để chat</h1>
                    <form onSubmit={handleLogin}>
                        <div className="mb-4">
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                Tên của bạn
                            </label>
                            <input
                                type="text"
                                id="username"
                                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Nhập tên của bạn"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Mât khẩu
                            </label>
                            <input
                                type="text"
                                id="password"
                                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Nhập tên của bạn"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
                        >
                            Bắt đầu chat
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-white">
            <Sidebar setSelectedChat={setSelectedChat} selectedChat={selectedChat} currentUsername={username} />
            <ChatWindow chat={selectedChat} currentUsername={username} currentUserData={currentUserData} />
        </div>
    )
}

export default App
