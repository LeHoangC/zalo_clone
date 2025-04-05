import React, { useState, useEffect, useRef } from 'react'
import { Phone, Video, Info, Smile, Paperclip, Send } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import socket from '../config/socket'
import Peer from 'simple-peer'

const ChatWindow = ({ chat, currentUsername, currentUserData }) => {
    const [newMessage, setNewMessage] = useState('')
    const [messages, setMessages] = useState([])
    const [selectedImage, setSelectedImage] = useState(null)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const messagesEndRef = useRef(null)
    const fileInputRef = useRef(null)

    const [isUserTyping, setIsUserTyping] = useState(false)
    const typingTimeoutRef = useRef(null)

    const [peer, setPeer] = useState(null) // Peer instance cho WebRTC
    const [callActive, setCallActive] = useState(false) // Trạng thái cuộc gọi

    const localAudioRef = useRef(null) // Ref cho audio của mình
    const remoteAudioRef = useRef(null) // Ref cho audio của đối phương

    const [isVideoCall, setIsVideoCall] = useState(false) // Phân biệt voice hay video
    const localVideoRef = useRef(null) // Ref cho video của mình
    const remoteVideoRef = useRef(null) // Ref cho video của đối phương

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            const imageUrl = URL.createObjectURL(file)
            setSelectedImage({ file, url: imageUrl })
        }
    }

    const handleEmojiClick = (emojiObject) => {
        setNewMessage((prev) => prev + emojiObject.emoji)
        setShowEmojiPicker(false)
    }

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (newMessage.trim() || selectedImage) {
            const messageData = {
                sender: currentUserData._id || false,
                receiver: chat._id || null,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }

            if (selectedImage) {
                const formData = new FormData()
                formData.append('image', selectedImage.file)
                const response = await fetch('http://localhost:3000/upload', {
                    method: 'POST',
                    body: formData,
                })
                const { imageUrl } = await response.json()
                messageData.imageUrl = imageUrl
                messageData.type = 'image'
            }

            if (newMessage.trim()) {
                messageData.message = newMessage
                if (!messageData.type) messageData.type = 'text'
            }

            setMessages((prev) => [...prev, { ...messageData, _id: Date.now(), text: messageData.message }])
            socket.emit('send_message', messageData)
            setNewMessage('')
            setSelectedImage(null)
        }
    }

    useEffect(() => {
        const fetchMessages = async () => {
            const response = await fetch(`http://localhost:3000/message/${currentUserData._id}/${chat._id}`)
            const data = await response.json()
            setMessages(data.messages)
        }

        if (chat) {
            fetchMessages()
        }
    }, [chat, chat?._id, currentUserData._id])

    useEffect(() => {
        socket.on('receive_message', (data) => {
            if (chat && chat._id == data.sender) {
                setMessages((prev) => [...prev, data])
            }
        })

        return () => {
            socket.off('receive_message')
        }
    }, [currentUsername, chat])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleTyping = (e) => {
        setNewMessage(e.target.value)

        // Gửi sự kiện typing khi người dùng bắt đầu nhập
        socket.emit('typing', {
            sender: currentUserData._id,
            receiver: chat._id,
            isTyping: true,
        })

        // Clear timeout trước đó nếu có
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        }

        // Set timeout mới để báo khi người dùng ngừng gõ
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing', {
                sender: currentUserData._id,
                receiver: chat._id,
                isTyping: false,
            })
        }, 2000) // 2 giây sau khi người dùng ngừng gõ
    }

    useEffect(() => {
        socket.on('user_typing', (data) => {
            if (chat && chat._id === data.sender) {
                setIsUserTyping(data.isTyping)
            }
        })

        return () => {
            socket.off('user_typing')
        }
    }, [chat])

    // Thêm clean-up cho timeout khi component unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }
        }
    }, [])

    // Bắt đầu cuộc gọi
    const startCall = async (isVideo = false) => {
        try {
            const constraints = { audio: true, video: isVideo ? { width: 640, height: 480 } : false }
            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            if (!stream) throw new Error('Không thể lấy stream')

            if (localAudioRef.current) {
                localAudioRef.current.srcObject = stream
            } else {
                console.warn('localAudioRef.current is null')
            }

            if (isVideo && localVideoRef.current) {
                localVideoRef.current.srcObject = stream
            } else if (isVideo) {
                console.warn('localVideoRef.current is null')
            }

            const p = new Peer({ initiator: true, trickle: false, stream })
            setPeer(p)
            setIsVideoCall(isVideo)

            p.on('signal', (data) => {
                socket.emit('call_user', {
                    receiverId: chat._id,
                    offer: data,
                    isVideoCall: isVideo, // Gửi isVideoCall
                })
            })

            p.on('stream', (remoteStream) => {
                if (remoteAudioRef.current) {
                    remoteAudioRef.current.srcObject = remoteStream
                }
                if (isVideo && remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream
                }
                setCallActive(true)
            })

            p.on('error', (err) => console.error('Peer error:', err))
        } catch (err) {
            console.error('Lỗi trong startCall:', err)
        }
    }

    // Nhận cuộc gọi đến
    useEffect(() => {
        socket.on('incoming_call', async (data) => {
            try {
                setIsVideoCall(data.isVideoCall)
                const constraints = { audio: true, video: data.isVideoCall ? { width: 640, height: 480 } : false }
                const stream = await navigator.mediaDevices.getUserMedia(constraints)
                if (localAudioRef.current) localAudioRef.current.srcObject = stream
                if (data.isVideoCall && localVideoRef.current) localVideoRef.current.srcObject = stream

                const p = new Peer({ initiator: false, trickle: false, stream })
                setPeer(p)

                p.on('signal', (signalData) => {
                    socket.emit('answer_call', {
                        callerId: data.from,
                        answer: signalData,
                    })
                })

                p.on('stream', (remoteStream) => {
                    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream
                    if (data.isVideoCall && remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
                    setCallActive(true)
                })

                p.signal(data.offer)
            } catch (err) {
                console.error('Lỗi khi nhận cuộc gọi:', err)
            }
        })

        socket.on('call_accepted', (data) => {
            peer?.signal(data.answer)
        })

        socket.on('ice_candidate', (data) => {
            peer?.addIceCandidate(new RTCIceCandidate(data.candidate))
        })

        return () => {
            socket.off('incoming_call')
            socket.off('call_accepted')
            socket.off('ice_candidate')
        }
    }, [peer, chat])

    useEffect(() => {
        if (peer) {
            peer.on('icecandidate', (event) => {
                if (event.candidate) {
                    socket.emit('ice_candidate', {
                        targetId: chat._id,
                        candidate: event.candidate,
                    })
                }
            })
        }
    }, [peer, chat])

    const endCall = () => {
        if (peer) {
            peer.destroy()
        }
        setPeer(null)
        setCallActive(false)
        setIsVideoCall(false)
        localAudioRef.current.srcObject = null
        remoteAudioRef.current.srcObject = null
        if (localVideoRef.current) localVideoRef.current.srcObject = null
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
    }

    const toggleMic = () => {
        const audioTrack = localAudioRef.current.srcObject?.getAudioTracks()[0]
        if (audioTrack) audioTrack.enabled = !audioTrack.enabled
    }

    if (!chat) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <p className="text-gray-500">Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-2 border-b">
                <div className="flex items-center">
                    <img src={chat.avatar} alt={chat.name} className="w-10 h-10 mr-2 rounded-full object-cover" />
                    <div>
                        <h2 className="font-medium">{chat.name}</h2>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => startCall(false)} className="p-1 hover:bg-gray-100 rounded-full">
                        <Phone size={18} className="text-gray-600" />
                    </button>
                    <button onClick={() => startCall(true)} className="p-1 hover:bg-gray-100 rounded-full">
                        <Video size={18} className="text-gray-600" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded-full">
                        <Info size={18} className="text-gray-600" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages?.map((message) => (
                    <div
                        key={message._id}
                        className={`flex ${message.sender != currentUserData._id ? 'justify-start' : 'justify-end'}`}
                    >
                        <div className="max-w-xs">
                            <div
                                className={
                                    message.sender == currentUserData._id
                                        ? 'bg-blue-500 text-white rounded-lg p-2 shadow-sm'
                                        : 'bg-white rounded-lg p-2 shadow-sm'
                                }
                            >
                                {message.imageUrl && (
                                    <img src={message.imageUrl} alt="Sent image" className="max-w-full rounded mb-1" />
                                )}
                                {message.text && <p className="text-sm">{message.text}</p>}
                                <span
                                    className={
                                        message.sender == currentUserData._id
                                            ? 'text-xs text-blue-100'
                                            : 'text-xs text-gray-500'
                                    }
                                >
                                    {message.time}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
                {isUserTyping && (
                    <div className="flex justify-start">
                        <div className="max-w-xs">
                            <div className="bg-gray-200 text-gray-700 rounded-lg p-2 shadow-sm">
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div
                className="p-4 bg-gray-100 flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4"
                style={{ display: callActive && isVideoCall ? 'flex' : 'none' }}
            >
                {console.log('Rendering video, callActive:', callActive, 'isVideoCall:', isVideoCall)}
                <div className="relative">
                    <video ref={localVideoRef} autoPlay muted className="w-64 h-48 rounded-lg shadow-lg" />
                    <span className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-1 rounded">Bạn</span>
                </div>
                <div className="relative">
                    <video ref={remoteVideoRef} autoPlay className="w-64 h-48 rounded-lg shadow-lg" />
                    {/* <span className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-1 rounded">
                        {chat.name}
                    </span> */}
                </div>
            </div>
            <audio ref={localAudioRef} autoPlay muted />
            <audio ref={remoteAudioRef} autoPlay />

            {/* Call controls */}
            {callActive && (
                <div className="p-2 bg-gray-100 flex justify-center space-x-4">
                    <button onClick={toggleMic} className="p-2 bg-blue-500 text-white rounded">
                        Tắt/Bật Mic
                    </button>
                    <button onClick={endCall} className="p-2 bg-red-500 text-white rounded">
                        Kết thúc cuộc gọi
                    </button>
                </div>
            )}

            {/* Input */}
            <div className="border-t p-2">
                {selectedImage && (
                    <div className="mb-2">
                        <img src={selectedImage.url} alt="Preview" className="max-w-xs rounded" />
                        <button onClick={() => setSelectedImage(null)} className="text-red-500">
                            Xóa
                        </button>
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="p-2 text-gray-600 hover:text-blue-500"
                    >
                        <Paperclip size={20} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-2 text-gray-600 hover:text-blue-500"
                    >
                        <Smile size={20} />
                    </button>
                    <input
                        type="text"
                        placeholder={`Nhập @, tin nhắn tới ${chat.name}`}
                        className="flex-1 p-2 rounded-lg border focus:outline-none focus:border-blue-500"
                        value={newMessage}
                        onChange={handleTyping}
                    />
                    <button type="submit" className="p-2 text-blue-500">
                        <Send size={20} />
                    </button>
                </form>
                {showEmojiPicker && (
                    <div className="absolute bottom-14 left-0 z-10">
                        <EmojiPicker onEmojiClick={handleEmojiClick} />
                    </div>
                )}
            </div>
        </div>
    )
}

export default ChatWindow
