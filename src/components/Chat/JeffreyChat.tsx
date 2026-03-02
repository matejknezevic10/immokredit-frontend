// src/components/Chat/JeffreyChat.tsx
import React, { useState, useRef, useEffect } from 'react';
import api from '@/services/api';
import './JeffreyChat.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const JeffreyChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hallo! Ich bin Jeffrey, dein ImmoKredit-Assistent. 👋\n\nIch kann dir helfen mit:\n• Kundeninformationen aus Dokumenten\n• Deal-Status & fehlende Unterlagen\n• Dokumente zusammenfassen\n• Allgemeine Fragen\n\nWie kann ich dir helfen?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build history (exclude welcome message)
      const history = messages
        .slice(1)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await api.post('/chat', {
        message: trimmed,
        history,
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: err.response?.data?.error || 'Entschuldigung, etwas ist schiefgelaufen. Bitte versuche es nochmal.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        className={`jeffrey-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Chat schließen' : 'Jeffrey fragen'}
      >
        {isOpen ? '✕' : '👨‍💼'}
        {!isOpen && <span className="jeffrey-toggle-label">Jeffrey</span>}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="jeffrey-chat">
          <div className="jeffrey-header">
            <div className="jeffrey-header-info">
              <div className="jeffrey-avatar">👨‍💼</div>
              <div>
                <div className="jeffrey-name">Jeffrey</div>
                <div className="jeffrey-status">ImmoKredit Assistent</div>
              </div>
            </div>
            <button className="jeffrey-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="jeffrey-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`jeffrey-message ${msg.role}`}>
                {msg.role === 'assistant' && <div className="jeffrey-msg-avatar">👨‍💼</div>}
                <div className="jeffrey-msg-bubble">
                  <div className="jeffrey-msg-content">
                    {msg.content.split('\n').map((line, j) => (
                      <React.Fragment key={j}>
                        {line}
                        {j < msg.content.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="jeffrey-msg-time">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="jeffrey-message assistant">
                <div className="jeffrey-msg-avatar">👨‍💼</div>
                <div className="jeffrey-msg-bubble">
                  <div className="jeffrey-typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="jeffrey-input-area">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Frag Jeffrey..."
              className="jeffrey-input"
              disabled={isLoading}
            />
            <button
              className="jeffrey-send"
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};