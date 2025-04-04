// components/Sidebar.jsx
import React, { useState } from 'react'
import {
    Search,
    Settings,
    ChevronDown,
    MoreHorizontal,
    Image,
    Users,
    ClipboardList,
    Clock,
    Cloud,
    Phone,
} from 'lucide-react'
import { UserPlus } from 'lucide-react'
import { useEffect } from 'react'
import { MessageCircleMore } from 'lucide-react'
import { NotebookTabs } from 'lucide-react'
import { SquareCheck } from 'lucide-react'
import { SquareDashed } from 'lucide-react'
import { BriefcaseBusiness } from 'lucide-react'

// Thay vì sử dụng Headless UI, chúng ta sẽ tự xây dựng tab đơn giản
const Sidebar = ({ setSelectedChat, selectedChat, currentUsername }) => {
    const [activeTab, setActiveTab] = useState('all')
    const [contactList, setContactList] = useState([])

    useEffect(() => {
        const fetchContacts = async () => {
            const response = await fetch('http://localhost:3000/user/getAll')
            const data = await response.json()
            setContactList(data.filter((user) => user.name !== currentUsername))
        }
        fetchContacts()
    }, [currentUsername])

    return (
        <div className="flex h-screen">
            {/* Sidebar Menu */}
            <div className="w-20 bg-blue-500 flex flex-col justify-between">
                <div className="flex flex-col items-center py-4">
                    <button className="mb-4">
                        <img
                            src="https://images.pexels.com/photos/31421048/pexels-photo-31421048/free-photo-of-hoa-anh-dao-n-r-vao-mua-xuan.jpeg?auto=compress&cs=tinysrgb&w=600"
                            alt="Profile"
                            className="w-12 h-12 rounded-full object-cover"
                        />
                    </button>
                    <button className="mb-4 p-2 text-white bg-blue-700 rounded-md">
                        <MessageCircleMore size={24} />
                    </button>
                    <button className="mb-4 p-2 text-white hover:bg-blue-700 rounded-md">
                        <NotebookTabs size={24} />
                    </button>
                    <button className="mb-4 p-2 text-white hover:bg-blue-700 rounded-md">
                        <SquareCheck size={24} />
                    </button>
                </div>

                <div className="flex flex-col items-center py-4">
                    <button className="mb-4 p-2 text-white hover:bg-blue-700 rounded-md">
                        <Cloud size={24} />
                    </button>
                    <div className="mb-4 w-[60%] h-0.5 bg-white"></div>
                    <button className="mb-4 p-2 text-white hover:bg-blue-700 rounded-md">
                        <SquareDashed size={24} />
                    </button>
                    <button className="mb-4 p-2 text-white hover:bg-blue-700 rounded-md">
                        <BriefcaseBusiness size={24} />
                    </button>
                    <button className="p-2 text-white hover:bg-blue-700 rounded-md">
                        <Settings size={24} />
                    </button>
                </div>
            </div>

            {/* Main Sidebar */}
            <div className="w-80 flex flex-col border-r bg-white">
                {/* Header */}
                <div className="p-2 flex items-center justify-between border-b">
                    <div className="flex items-center bg-gray-100 rounded-full p-1 w-full mr-2">
                        <Search size={16} className="text-gray-500 ml-2" />
                        <input
                            className="bg-transparent outline-none px-2 py-1 text-sm w-full"
                            placeholder="Tìm kiếm"
                        />
                    </div>

                    <button className="p-1 hover:bg-gray-100 rounded-full">
                        <UserPlus size={18} className="text-gray-600" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded-full">
                        <Users size={18} className="text-gray-600" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                    <button
                        className={`py-2 px-2 text-sm font-medium flex-1 text-center border-b-2 ${
                            activeTab === 'all' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-600'
                        }`}
                        onClick={() => setActiveTab('all')}
                    >
                        Tất cả
                    </button>
                    <button
                        className={`py-2 px-2 text-sm font-medium flex-1 text-center border-b-2 ${
                            activeTab === 'unread'
                                ? 'border-blue-500 text-blue-500'
                                : 'border-transparent text-gray-600'
                        }`}
                        onClick={() => setActiveTab('unread')}
                    >
                        Chưa đọc
                    </button>

                    <button className="p-2 text-gray-600 hover:bg-gray-100">
                        <div className="flex items-center text-sm">
                            <span>Phân loại</span>
                            <ChevronDown size={14} />
                        </div>
                    </button>
                    <button className="p-2 text-gray-600 hover:bg-gray-100">
                        <MoreHorizontal size={16} />
                    </button>
                </div>

                {/* Contact List */}
                <div className="flex-1 overflow-y-auto">
                    {contactList?.map((contact) => (
                        <div
                            key={contact._id}
                            className={`flex items-center p-2 cursor-pointer hover:bg-gray-100 ${
                                selectedChat?._id === contact._id ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => setSelectedChat(contact)}
                        >
                            <div className="relative mr-2">
                                <img
                                    src={
                                        'https://images.pexels.com/photos/31421048/pexels-photo-31421048/free-photo-of-hoa-anh-dao-n-r-vao-mua-xuan.jpeg?auto=compress&cs=tinysrgb&w=600'
                                    }
                                    alt={contact.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null
                                        e.target.src = 'https://via.placeholder.com/48'
                                    }}
                                />

                                {/* {contact.isCloudMessage && (
                                    <div className="absolute bottom-0 right-0 bg-white p-1 rounded-full border border-white">
                                        <Cloud size={10} className="text-blue-500" />
                                    </div>
                                )} */}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-medium text-sm truncate">{contact.name}</h3>
                                    {/* <span className="text-xs text-gray-500">{contact.time}</span> */}
                                </div>
                                {/* <p className="text-xs text-gray-500 truncate">{contact.lastMessage}</p> */}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Sidebar
