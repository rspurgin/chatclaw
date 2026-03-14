import { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { socket } from "../../lib/socket";

interface ChatMessage {
  readonly id: string;
  readonly text: string;
}

export function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handler = (msg: string) => {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), text: msg }]);
    };
    socket.on("chat_message", handler);
    return () => {
      socket.off("chat_message", handler);
    };
  }, []);

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      socket.emit("chat_message", inputVal);
      setInputVal("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-900 rounded-xl overflow-hidden border border-gray-800 shadow-2xl">
      <div className="bg-dark-800 p-4 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
          Live Chat
        </h2>
        <span className="text-xs text-gray-400">WebSocket</span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-sm">
            <p>No messages yet.</p>
            <p className="mt-1">Send a message to start chatting!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="bg-dark-800 p-3 rounded-lg rounded-tl-none border border-gray-800 max-w-[85%] animate-fade-in-up"
            >
              <p className="text-sm text-gray-200 break-words">{msg.text}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="p-4 bg-dark-950 border-t border-gray-800 flex gap-2"
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-dark-800 text-white text-sm rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputVal.trim()}
          className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
