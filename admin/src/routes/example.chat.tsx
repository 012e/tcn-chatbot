"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

function ChatPage() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: import.meta.env.VITE_CHAT_ENDPOINT,
    }),
  });

  const [input, setInput] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  // Scroll the messages container to bottom after DOM updates
  useLayoutEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    // schedule after layout/paint to ensure accurate scrollHeight
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="flex flex-col w-full h-full min-h-0">
      <div
        ref={messagesContainerRef}
        className="overflow-y-auto flex-1 p-4 mb-16 min-h-0"
        id="chat-messages"
      >
        {messages.map(({ id, role, parts }) => {
          const isAssistant = role === "assistant";
          return (
            <div
              key={id}
              className={`my-2 flex ${isAssistant ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`px-4 py-2 rounded-lg max-w-[80%] whitespace-pre-wrap break-words ${
                  isAssistant
                    ? "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-900"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                }`}
              >
                {parts.map((part, i) =>
                  part.type === "text" ? (
                    <ReactMarkdown
                      key={i}
                      className="max-w-none prose prose-sm"
                      rehypePlugins={[
                        rehypeRaw,
                        rehypeSanitize,
                        rehypeHighlight,
                      ]}
                      remarkPlugins={[remarkGfm]}
                    >
                      {part.text}
                    </ReactMarkdown>
                  ) : null,
                )}
              </div>
            </div>
          );
        })}

        {status === "submitted" && (
          <div className="text-sm text-gray-500">Loading...</div>
        )}
      </div>

      {/* Fixed input bar (only this is fixed to the bottom of the screen).
          h-16 is used for a consistent height; messages container has pb-16. */}
      <form
        onSubmit={handleSubmit}
        className="flex fixed right-0 bottom-0 left-0 z-50 gap-2 items-center py-3 px-4 h-16 bg-white border-t"
      >
        <input
          className="flex py-2 px-3 w-full h-10 text-sm placeholder-gray-500 rounded-md border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:outline-none"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <button
          type="submit"
          className="flex justify-center items-center py-2 px-4 h-10 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50"
          disabled={!input.trim()}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

export const Route = createFileRoute("/example/chat")({
  component: ChatPage,
});
