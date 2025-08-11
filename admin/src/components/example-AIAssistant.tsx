import { useEffect, useRef, useState } from "react";
import { useStore } from "@tanstack/react-store";
import { Send, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

import { showAIAssistant } from "../store/example-assistant";

import type { UIMessage } from "ai";

function Messages({ messages }: { messages: Array<UIMessage> }) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (!messages.length) {
    return (
      <div className="flex flex-1 justify-center items-center text-sm text-gray-400">
        Ask me anything! I'm here to help.
      </div>
    );
  }

  return (
    <div ref={messagesContainerRef} className="overflow-y-auto flex-1">
      {messages.map(({ id, role, parts }) => (
        <div
          key={id}
          className={`py-3 ${
            role === "assistant"
              ? "bg-gradient-to-r from-orange-500/5 to-red-600/5"
              : "bg-transparent"
          }`}
        >
          {parts.map((part) => {
            if (part.type === "text") {
              return (
                <div className="flex gap-2 items-start px-4">
                  {role === "assistant" ? (
                    <div className="flex flex-shrink-0 justify-center items-center w-6 h-6 text-xs font-medium text-white bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
                      AI
                    </div>
                  ) : (
                    <div className="flex flex-shrink-0 justify-center items-center w-6 h-6 text-xs font-medium text-white bg-gray-700 rounded-lg">
                      Y
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <ReactMarkdown
                      className="max-w-none prose prose-sm dark:prose-invert"
                      rehypePlugins={[
                        rehypeRaw,
                        rehypeSanitize,
                        rehypeHighlight,
                        remarkGfm,
                      ]}
                    >
                      {part.text}
                    </ReactMarkdown>
                  </div>
                </div>
              );
            }
          })}
        </div>
      ))}
    </div>
  );
}

export default function AIAssistant() {
  const isOpen = useStore(showAIAssistant);
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/demo-chat",
    }),
  });
  const [input, setInput] = useState("");

  return (
    <div className="relative z-50">
      <button
        onClick={() => showAIAssistant.setState((state) => !state)}
        className="flex gap-2 items-center py-1 px-3 text-white bg-gradient-to-r from-orange-500 to-red-600 rounded-lg transition-opacity hover:opacity-90"
      >
        <div className="flex justify-center items-center w-5 h-5 text-xs font-medium rounded-lg bg-white/20">
          AI
        </div>
        AI Assistant
      </button>

      {isOpen && (
        <div className="flex absolute right-0 top-full flex-col mt-2 bg-gray-900 rounded-lg border shadow-xl w-[700px] h-[600px] border-orange-500/20">
          <div className="flex justify-between items-center p-3 border-b border-orange-500/20">
            <h3 className="font-semibold text-white">AI Assistant</h3>
            <button
              onClick={() => showAIAssistant.setState((state) => !state)}
              className="text-gray-400 transition-colors hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <Messages messages={messages} />

          <div className="p-3 border-t border-orange-500/20">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage({ text: input });
                setInput("");
              }}
            >
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="overflow-hidden py-2 pr-10 pl-3 w-full text-sm placeholder-gray-400 text-white rounded-lg border resize-none focus:border-transparent focus:ring-2 focus:outline-none border-orange-500/20 bg-gray-800/50 focus:ring-orange-500/50"
                  rows={1}
                  style={{ minHeight: "36px", maxHeight: "120px" }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height =
                      Math.min(target.scrollHeight, 120) + "px";
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage({ text: input });
                      setInput("");
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="absolute right-2 top-1/2 p-1.5 text-orange-500 transition-colors -translate-y-1/2 hover:text-orange-400 focus:outline-none disabled:text-gray-500"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
