import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { Send, MessageSquare } from 'lucide-react';

// Initialize socket outside or inside with memoization
const socket = io('http://localhost:5000', { autoConnect: true });

export default function TeamChat({ teamId, user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const isInitialLoad = useRef(true);

  // Scroll only the chat container to bottom, not the whole page
  const scrollToBottom = (instant = false) => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (!teamId || !user) return;

    isInitialLoad.current = true;

    // 1. Join the team socket room
    socket.emit('join_team', teamId);

    // 2. Fetch persisted message history
    const fetchHistory = async () => {
      try {
        const token = user.token?.startsWith('Bearer ') 
          ? user.token 
          : `Bearer ${user.token}`;

        const res = await axios.get(`http://localhost:5000/api/teams/${teamId}/messages`, {
          headers: { Authorization: token }
        });
        setMessages(res.data);
        // Instantly jump to bottom for the initial history load (no smooth scroll)
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
          isInitialLoad.current = false;
        }, 0);
      } catch (err) {
        console.error('Failed to load chat history:', err);
        isInitialLoad.current = false;
      }
    };
    fetchHistory();

    // 3. Single listener for real-time messages
    const handleReceive = (newMsg) => {
      // Prevent duplicate additions if already in list
      setMessages((prev) => {
        if (prev.some((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
    };

    socket.on('receive_message', handleReceive);

    return () => {
      socket.off('receive_message', handleReceive);
      isInitialLoad.current = true;
    };
  }, [teamId, user]);

  // Only smooth-scroll for new real-time messages, not for initial history load
  useEffect(() => {
    if (!isInitialLoad.current) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    socket.emit('send_message', {
      teamId,
      senderId: user._id,
      text: text.trim()
    });

    setText('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[calc(100vh-120px)] sticky top-20 shadow-xl overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
            <MessageSquare size={16} className="text-blue-500" /> Team Chat
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
          Live
        </span>
      </div>

      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3.5 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-500 gap-2">
            <MessageSquare size={28} className="text-slate-700" />
            <p>No messages yet.<br />Start coordinating with your teammates!</p>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isMe = (m.sender?._id || m.sender) === user._id;
            return (
              <div key={m._id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-slate-400 mb-1 px-1 flex items-center gap-1">
                  {isMe ? 'You' : m.sender?.name || 'Member'}
                </span>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed wrap-break-word shadow-sm ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900/60 flex gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 placeholder-slate-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white p-2.5 rounded-xl transition-all cursor-pointer"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}