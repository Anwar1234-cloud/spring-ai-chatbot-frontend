import { useEffect, useState } from "react";

import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";

import {
  getConversations,
  getMessages,
  sendMessage,
} from "./services/chatApi";

function App() {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Load conversations when application starts
  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    try {
      setError("");

      const data = await getConversations();

      setConversations(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load conversations.");
    }
  }

  // Select an existing conversation
  async function handleSelectConversation(conversationId) {
    try {
      setError("");

      setCurrentConversationId(conversationId);

      const data = await getMessages(conversationId);

      setMessages(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load conversation.");
    }
  }

  // Start a new conversation
  function handleNewChat() {
    setCurrentConversationId(null);
    setMessages([]);
    setError("");
  }

  // Send message to Spring Boot
  async function handleSendMessage(message) {
    try {
      setError("");
      setIsLoading(true);

      // Optimistically show user's message
      const temporaryUserMessage = {
        id: `temp-${Date.now()}`,
        role: "USER",
        content: message,
        createdAt: new Date().toISOString(),
      };

      setMessages((previous) => [
        ...previous,
        temporaryUserMessage,
      ]);

      const response = await sendMessage(
        message,
        currentConversationId
      );

      // Backend returns the conversation ID
      const conversationId = response.conversationId;

      setCurrentConversationId(conversationId);

      // Add AI response
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "ASSISTANT",
        content: response.response,
        createdAt: new Date().toISOString(),
      };

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);

      // Refresh sidebar
      await loadConversations();

    } catch (err) {
      console.error(err);
      setError("Something went wrong while sending the message.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-900">

      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
      />

      <ChatWindow
        messages={messages}
        onSend={handleSendMessage}
        isLoading={isLoading}
        currentConversationId={currentConversationId}
      />

      {error && (
        <div className="fixed bottom-20 right-5 rounded-lg bg-red-600 px-4 py-3 text-sm text-white shadow-lg">
          {error}
        </div>
      )}

    </div>
  );
}

export default App;