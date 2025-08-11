"use client";

import React, { useRef, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { v4 as uuidv4 } from "uuid";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function ChatPage() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: import.meta.env.VITE_CHAT_ENDPOINT,
    }),
  });

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="flex flex-col bg-background text-foreground">
      <div className="overflow-y-auto flex-1 p-4 mb-[5rem]">
        <div className="flex flex-col space-y-4">
          {messages.map(({ id, role, parts }) => (
            <div
              key={id}
              className={cn(
                "flex",
                role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[70%] p-3 rounded-xl shadow-md",
                  role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground",
                )}
              >
                {parts.map((part, index) =>
                  part.type === "text" ? (
                    <ReactMarkdown
                      key={`${id}-${index}`}
                      className="max-w-none break-words prose prose-sm dark:prose-invert"
                      rehypePlugins={[
                        rehypeRaw,
                        rehypeSanitize,
                        [rehypeHighlight, { detect: true }],
                      ]}
                      remarkPlugins={[remarkGfm]}
                    >
                      {part.text}
                    </ReactMarkdown>
                  ) : null,
                )}
              </div>
            </div>
          ))}
          {status === "submitted" && (
            <div className="flex justify-start">
              <div className="p-3 rounded-xl bg-secondary text-secondary-foreground">
                <span className="animate-pulse">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="fixed right-0 bottom-0 left-0 p-4 border-t bg-background">
        <form
          onSubmit={handleSubmit}
          className="flex gap-2 mx-auto w-full max-w-4xl"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 resize-none min-h-[40px] max-h-[120px]"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            disabled={!input.trim() || status === "submitted"}
            className="h-auto"
          >
            <Send size={18} />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/example/chat")({
  component: ChatPage,
});
