import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import type { UIMessage } from "ai";

function InitialLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 justify-center px-4 h-full">
      <Card className="p-6 mx-auto w-full max-w-3xl text-center bg-background">
        <p className="mx-auto mb-6 w-2/3 text-lg text-muted-foreground">
          You can ask me about anything, I might or might not have a good
          answer, but you can still ask.
        </p>
        {children}
      </Card>
    </div>
  );
}

function ChattingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute right-0 bottom-0 left-64 border-t bg-background/80 backdrop-blur-sm border-orange-500/10">
      <div className="py-3 px-4 mx-auto w-full max-w-3xl">{children}</div>
    </div>
  );
}

function Messages({ messages }: { messages: Array<UIMessage> }) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (!messages.length) return null;

  return (
    <ScrollArea ref={messagesContainerRef} className="flex-1 pb-24">
      <div className="px-4 mx-auto space-y-3 w-full max-w-3xl">
        {messages.map(({ id, role, parts }) => (
          <Card
            key={id}
            className={
              role === "assistant"
                ? "bg-gradient-to-r from-orange-500/5 to-red-600/5"
                : ""
            }
          >
            <div className="flex gap-4 items-start p-4">
              <Avatar>
                <AvatarFallback>
                  {role === "assistant" ? "AI" : "Y"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                {parts.map((part, index) =>
                  part.type === "text" ? (
                    <div
                      key={index}
                      className="max-w-none prose dark:prose-invert"
                    >
                      <ReactMarkdown
                        rehypePlugins={[
                          rehypeRaw,
                          rehypeSanitize,
                          rehypeHighlight,
                        ]}
                        remarkPlugins={[remarkGfm]}
                      >
                        {part.text}
                      </ReactMarkdown>
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}

function ChatPage() {
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: import.meta.env.VITE_CHAT_ENDPOINT,
    }),
  });
  const [input, setInput] = useState("");

  const Layout = messages.length ? ChattingLayout : InitialLayout;

  return (
    <div className="flex relative bg-background h-[calc(100vh-32px)]">
      <div className="flex flex-col flex-1">
        <Messages messages={messages} />
        <Layout>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage({ text: input });
              setInput("");
            }}
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type something clever (or don't, we won't judge)..."
              rows={1}
              style={{ minHeight: "44px", maxHeight: "200px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 200) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage({ text: input });
                  setInput("");
                }
              }}
              className="pr-12 resize-none"
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              disabled={!input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </Layout>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/example/chat")({
  component: ChatPage,
});
