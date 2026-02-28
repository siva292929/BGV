import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageCircle, Send, X, ChevronLeft } from 'lucide-react';

// Individual chat view
const ChatView = ({ currentUserId, partnerId, partnerName, partnerRole, onBack }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    const fetchMessages = async () => {
        if (!currentUserId || !partnerId) return;
        try {
            const res = await axios.get(`http://localhost:5000/api/chat/messages/${currentUserId}/${partnerId}`);
            setMessages(res.data);
            await axios.patch('http://localhost:5000/api/chat/mark-read', {
                senderId: partnerId,
                receiverId: currentUserId
            });
        } catch (err) {
            console.error("Failed to fetch messages", err);
        }
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [currentUserId, partnerId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim()) return;
        setSending(true);
        try {
            await axios.post('http://localhost:5000/api/chat/send', {
                senderId: currentUserId,
                receiverId: partnerId,
                message: newMessage.trim()
            });
            setNewMessage('');
            await fetchMessages();
        } catch (err) {
            console.error("Failed to send message", err);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            <div className="bg-slate-950 px-5 py-4 flex items-center gap-3">
                <button onClick={onBack} className="text-slate-400 hover:text-white p-1 transition-colors">
                    <ChevronLeft size={18} />
                </button>
                <div className="w-9 h-9 bg-indigo-600/30 rounded-xl flex items-center justify-center text-indigo-300 font-bold text-xs">
                    {partnerName?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{partnerName}</p>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{partnerRole}</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {messages.length === 0 && (
                    <div className="text-center py-12">
                        <MessageCircle className="mx-auto text-slate-300 mb-4" size={36} />
                        <p className="text-slate-400 font-bold text-sm">No messages yet</p>
                        <p className="text-slate-300 text-xs mt-1">Start the conversation!</p>
                    </div>
                )}
                {messages.map((msg, i) => {
                    const isMine = (msg.sender?._id || msg.sender) === currentUserId;
                    return (
                        <div key={msg._id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${isMine
                                ? 'bg-indigo-600 text-white rounded-br-lg'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-lg shadow-sm'
                                }`}>
                                <p className="break-words">{msg.message}</p>
                                <p className={`text-[10px] mt-1 ${isMine ? 'text-indigo-200' : 'text-slate-400'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-white border-t border-slate-100">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button
                        onClick={handleSend}
                        disabled={sending || !newMessage.trim()}
                        className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </>
    );
};

// Main Hub — fetches allowed contacts from server
const ChatHub = ({ currentUserId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeChat, setActiveChat] = useState(null);
    const [convoList, setConvoList] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchContacts = async () => {
        if (!currentUserId) return;
        try {
            const res = await axios.get(`http://localhost:5000/api/chat/contacts/${currentUserId}`);
            setContacts(res.data);
        } catch (err) {
            console.error("Failed to load contacts", err);
        }
    };

    const fetchConversations = async () => {
        if (!currentUserId) return;
        try {
            const res = await axios.get(`http://localhost:5000/api/chat/conversations/${currentUserId}`);
            setConvoList(res.data);
            const total = res.data.reduce((sum, c) => sum + (c.unread || 0), 0);
            setUnreadCount(total);
        } catch (err) {
            console.error("Failed to load conversations", err);
        }
    };

    useEffect(() => {
        fetchContacts();
        fetchConversations();
        const interval = setInterval(fetchConversations, 5000);
        return () => clearInterval(interval);
    }, [currentUserId]);

    // Build display: conversations + contacts without conversations yet
    const serverPartnerIds = convoList.map(c => c.partnerId);
    const displayList = [];

    for (const conv of convoList) {
        const match = contacts.find(c => c.id === conv.partnerId);
        displayList.push({
            id: conv.partnerId,
            name: conv.partner?.name || match?.name || 'Unknown',
            role: conv.partner?.role || match?.role || '',
            lastMessage: conv.lastMessage,
            lastMessageAt: conv.lastMessageAt,
            unread: conv.unread || 0
        });
    }

    for (const contact of contacts) {
        if (!serverPartnerIds.includes(contact.id)) {
            displayList.push({
                id: contact.id,
                name: contact.name,
                role: contact.role,
                lastMessage: null,
                lastMessageAt: null,
                unread: 0
            });
        }
    }

    if (!isOpen) {
        return (
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-indigo-600 text-white p-4 rounded-2xl shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all hover:scale-105 relative"
                >
                    <MessageCircle size={24} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center animate-bounce">
                            {unreadCount}
                        </span>
                    )}
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-96 h-[520px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden">
            {activeChat ? (
                <ChatView
                    currentUserId={currentUserId}
                    partnerId={activeChat.id}
                    partnerName={activeChat.name}
                    partnerRole={activeChat.role}
                    onBack={() => { setActiveChat(null); fetchConversations(); }}
                />
            ) : (
                <>
                    <div className="bg-slate-950 px-6 py-4 flex items-center justify-between">
                        <div>
                            <p className="text-white font-black text-sm">Messages</p>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                {displayList.length} contact{displayList.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-red-400 p-1 transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {displayList.length === 0 ? (
                            <div className="text-center py-16">
                                <MessageCircle className="mx-auto text-slate-200 mb-4" size={48} />
                                <p className="text-slate-400 font-bold text-sm">No contacts available</p>
                                <p className="text-slate-300 text-xs mt-1">Chat will appear once verification starts</p>
                            </div>
                        ) : (
                            displayList.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => setActiveChat(conv)}
                                    className="w-full px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-all border-b border-slate-50 text-left"
                                >
                                    <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                                        {conv.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-slate-900 text-sm truncate">{conv.name}</p>
                                            {conv.unread > 0 && (
                                                <span className="bg-indigo-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                                                    {conv.unread}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between mt-0.5">
                                            <p className="text-slate-400 text-xs truncate flex-1">
                                                {conv.lastMessage || <span className="italic">No messages yet</span>}
                                            </p>
                                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider ml-2 flex-shrink-0">{conv.role}</span>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ChatHub;
