import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

function ChatWindow({
  messages,
  onSend,
  isLoading,
  currentConversationId,
}) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-gray-900">

      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <h1 className="text-lg font-semibold text-white">
          AI Chatbot
        </h1>

        <p className="text-xs text-gray-500">
          {currentConversationId
            ? "Conversation"
            : "New conversation"}
        </p>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">

        <div className="mx-auto flex max-w-4xl flex-col gap-4">

          {messages.length === 0 && !isLoading && (
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="text-center">
                <div className="mb-4 text-5xl">
                  🤖
                </div>

                <h2 className="text-2xl font-semibold text-white">
                  How can I help you?
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Ask me anything.
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
            />
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-gray-800 px-4 py-3 text-sm text-gray-400">
                Thinking...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />

        </div>
      </div>

      {/* Input */}
      <ChatInput
        onSend={onSend}
        disabled={isLoading}
      />

    </main>
  );
}

export default ChatWindow;