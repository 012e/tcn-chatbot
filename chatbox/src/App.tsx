"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { DefaultChatTransport } from "ai";

export default function App() {
  const [input, setInput] = useState("");

  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api:
        import.meta.env.VITE_CHAT_ENDPOINT ?? "http://localhost:8786/api/chat",
    }),
  });

  return (
    <div className="flex flex-col py-24 mx-auto w-full max-w-md stretch">
      {messages.map((message) => (
        <div key={message.id} className="whitespace-pre-wrap">
          {message.role === "user" ? "User: " : "AI: "}
          {message.parts.map((part, i) => {
            switch (part.type) {
              case "text":
                return <div key={`${message.id}-${i}`}>{part.text}</div>;
            }
          })}
        </div>
      ))}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput("");
        }}
      >
        <input
          className="fixed bottom-0 p-2 mb-8 w-full max-w-md rounded border shadow-xl border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800"
          value={input}
          placeholder="Say something..."
          onChange={(e) => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}
