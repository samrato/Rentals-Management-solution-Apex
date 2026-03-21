import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Users, MessageSquare, Sparkles } from 'lucide-react';
import '../styles/Community.css';

const Community = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get('/api/messages', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const emojis = ['😊', '😂', '🔥', '🚀', '🏡', '✨', '👍', '🙏', '💯', '❤️'];

  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await axios.post('/api/messages', { content: newMessage }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMessages([...messages, res.data]);
      setNewMessage('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="community-page">
      <div className="community-sidebar glass-card">
        <div className="sidebar-header">
          <Users size={24} />
          <span>Neighbors</span>
        </div>
        <div className="online-users">
          <h4>Neighbors</h4>
          <p className="subtext" style={{ fontSize: '0.8rem', opacity: 0.7, padding: '10px' }}>
            {user.role === 'landlord' ? 'Manage your community from here.' : 'Connect with your neighbors.'}
          </p>
        </div>
      </div>

      <div className="community-chat-container glass-card">
        <div className="chat-header">
          <div className="flex items-center gap-2">
            <h2><MessageSquare className="text-primary" /> Community Lounge</h2>
            <Sparkles size={16} className="text-secondary" />
          </div>
          <p>Connect and collaborate with your neighborhood.</p>
        </div>
        
        <div className="message-list" ref={scrollRef}>
          {messages.length > 0 ? messages.map((msg, index) => (
            <div key={index} className={`message-item ${msg.sender?._id === user?.id ? 'sent' : 'received'}`}>
              <span className="sender-name">
                {msg.sender?._id === user?.id ? 'You' : msg.sender?.name || 'Anonymous'}
              </span>
              <div className="message-bubble">
                {msg.content}
              </div>
            </div>
          )) : (
            <div className="flex flex-col items-center justify-center h-full opacity-50">
              <MessageSquare size={48} />
              <p>No messages yet. Start the conversation!</p>
            </div>
          )}
        </div>

        <div className="emoji-picker glass-card">
          {emojis.map(emoji => (
            <button 
              key={emoji} 
              type="button" 
              onClick={() => addEmoji(emoji)}
              className="emoji-btn"
            >
              {emoji}
            </button>
          ))}
        </div>

        <form className="chat-input" onSubmit={handleSendMessage}>
          <input 
            type="text" 
            placeholder="Share something with the community..." 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit" className="btn-primary">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Community;
