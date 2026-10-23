﻿﻿import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Send, User, Loader2, ArrowLeft, MessageSquare } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';

const CHATS_POLL_INTERVAL = 8000;
const MESSAGES_POLL_INTERVAL = 4000;

const MessagesPage = ({ language = 'ar' }) => {
  const isRtl = language === 'ar';
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const hasAttemptedAutoChatCreation = useRef(false);

  const userId = user?._id || user?.uid;
  const userName = user?.name || user?.displayName || (isRtl ? 'مستخدم' : 'User');
  const targetHostId = searchParams.get('hostId');
  const targetHostName = searchParams.get('hostName') || (isRtl ? 'مضيف' : 'Host');

  const fetchChats = useCallback(async () => {
    if (authLoading || !user || !userId) return;
    try {
      const response = await api.get('/chats', { params: { userId } });
      const chatData = response.data || [];
      setChats(chatData);

      // Only attempt to auto-create/select a chat with targetHostId ONCE per page
      // visit (via the ref flag), regardless of how many times fetchChats reruns
      // through polling. Using `loading` as a gate here was fragile.
      if (targetHostId && !hasAttemptedAutoChatCreation.current) {
        hasAttemptedAutoChatCreation.current = true;
        const existingChat = chatData.find((c) => c.participants?.includes(targetHostId));
        if (existingChat) {
          setSelectedChat(existingChat);
        } else {
          const created = await api.post('/chats', {
            participants: [userId, targetHostId],
            participantNames: { [userId]: userName, [targetHostId]: targetHostName },
          });
          setSelectedChat(created.data);
          setChats((prev) => [created.data, ...prev]);
        }
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, userName, targetHostId, targetHostName, authLoading, user]);

  const fetchMessages = useCallback(async () => {
    if (authLoading || !user || !selectedChat?._id) return;
    try {
      const response = await api.get(`/messages/${selectedChat._id}`);
      setMessages(response.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [selectedChat?._id, authLoading, user]);

  // Fetch chats on mount, then poll only while the tab is visible.
  useEffect(() => {
    fetchChats();

    let interval = null;
    const startPolling = () => {
      if (interval) return;
      interval = setInterval(fetchChats, CHATS_POLL_INTERVAL);
    };
    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) stopPolling();
      else {
        fetchChats();
        startPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [fetchChats]);

  // Fetch messages when the selected chat changes, then poll only while visible.
  useEffect(() => {
    fetchMessages();

    // Scroll to bottom when switching to a different chat.
    const scrollTimeout = setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'auto' });
    }, 100);

    let interval = null;
    const startPolling = () => {
      if (interval) return;
      interval = setInterval(fetchMessages, MESSAGES_POLL_INTERVAL);
    };
    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) stopPolling();
      else {
        fetchMessages();
        startPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearTimeout(scrollTimeout);
      stopPolling();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [fetchMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat?._id || !userId) return;

    try {
      const response = await api.post('/messages', {
        chatId: selectedChat._id,
        senderId: userId,
        text: newMessage,
      });
      setMessages((prev) => [...prev, response.data]);
      setNewMessage('');
      fetchChats();
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="animate-spin text-[#2DB4A0]" size={40} />
      </div>
    );
  }

  const activeOtherId = selectedChat?.participants?.find((id) => id !== userId);
  const activeOtherName = selectedChat?.participantNames?.[activeOtherId] || (isRtl ? 'مستخدم' : 'User');

  return (
    <main className="flex min-h-[calc(100vh-80px)] bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Sidebar - Chats List */}
      <aside className={`flex w-full shrink-0 flex-col border-e border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 md:w-80 ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="border-b border-gray-100 dark:border-gray-800 p-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{isRtl ? 'الرسائل' : 'Messages'}</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.length > 0 ? (
            chats.map((chat) => {
              const otherId = chat.participants?.find((id) => id !== userId);
              const otherName = chat.participantNames?.[otherId] || (isRtl ? 'مستخدم' : 'User');
              const isSelected = selectedChat?._id === chat._id;

              return (
                <button
                  type="button"
                  key={chat._id}
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full border-b border-gray-50 dark:border-gray-800/50 p-4 text-start transition cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                    isSelected ? 'border-s-4 border-s-[#2DB4A0] bg-[#2DB4A0]/10 dark:bg-[#2DB4A0]/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                      <User size={20} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{otherName}</p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {chat.lastMessage || (isRtl ? 'بلا رسائل بعد' : 'No messages yet')}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-10 text-center text-sm italic text-gray-400 dark:text-gray-500">
              {isRtl ? 'ماكايناش محادثات دابا' : 'No chats yet'}
            </div>
          )}
        </div>
      </aside>

      {/* Main Conversation Section */}
      <section className={`flex flex-1 flex-col bg-white dark:bg-gray-900 ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
        {selectedChat ? (
          <>
            <header className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 p-4">
              <button
                type="button"
                onClick={() => setSelectedChat(null)}
                className="p-2 md:hidden text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
              >
                <ArrowLeft size={20} className={isRtl ? 'rotate-180' : ''} />
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2DB4A0]/10 text-[#2DB4A0]">
                <User size={20} />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{activeOtherName}</p>
              </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50/60 dark:bg-gray-950/40 p-6">
              {messages.map((msg) => {
                const mine = msg.senderId === userId;
                return (
                  <div key={msg._id || msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] sm:max-w-[60%] rounded-2xl p-3 text-sm font-medium ${
                        mine
                          ? 'rounded-br-none bg-[#2DB4A0] text-white shadow-xs'
                          : 'rounded-bl-none border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            {/* Message Input Form */}
            <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-gray-100 dark:border-gray-800 p-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                maxLength={2000}
                placeholder={isRtl ? 'اكتب رسالتك...' : 'Type your message...'}
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-white outline-none focus:border-[#2DB4A0] dark:focus:border-[#2DB4A0]"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="rounded-xl bg-[#2DB4A0] p-3 text-white transition hover:bg-[#249181] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-600">
            <MessageSquare size={62} strokeWidth={1} />
            <p className="text-sm font-medium">{isRtl ? 'اختار محادثة باش تبدا' : 'Select a conversation to start'}</p>
          </div>
        )}
      </section>
    </main>
  );
};

export default MessagesPage;