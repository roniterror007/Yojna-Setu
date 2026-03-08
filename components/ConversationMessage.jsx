'use client';
import { Volume2, User, Bot } from 'lucide-react';

export default function ConversationMessage({ message, onSpeak }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start`}>
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm
        ${isUser
          ? 'bg-blue-500/20 border border-blue-500/30'
          : 'bg-bharat-green/20 border border-bharat-green/30'
        }
      `}>
        {isUser ? <User size={14} className="text-blue-400" /> : <Bot size={14} className="text-bharat-green" />}
      </div>

      {/* Message bubble */}
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`
          rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${isUser
            ? 'bg-blue-600/20 border border-blue-500/20 text-gray-100 rounded-tr-sm'
            : 'bg-bharat-card border border-bharat-border text-gray-200 rounded-tl-sm'
          }
        `}>
          {/* If assistant message with text property (parsed response) */}
          {!isUser && message.displayText ? (
            <p className="whitespace-pre-wrap">{message.displayText}</p>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {/* Speak button for assistant messages */}
        {!isUser && message.displayText && onSpeak && (
          <button
            onClick={() => onSpeak(message.displayText, message.language)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-bharat-green transition-colors px-1"
          >
            <Volume2 size={12} />
            <span>Speak</span>
          </button>
        )}

        {/* Timestamp */}
        <span className="text-gray-600 text-xs px-1">
          {new Date(message.timestamp || Date.now()).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}
