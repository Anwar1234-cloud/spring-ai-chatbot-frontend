import { useEffect, useState } from "react";

import {
    getConversations,
    getConversationMessages,
    sendMessage,
} from "./services/chatApi";

import "./App.css";

function App() {
    const [conversations, setConversations] = useState([]);
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [messages, setMessages] = useState([]);

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [error, setError] = useState("");

    /*
     * Load conversations when application starts
     */
    useEffect(() => {
        loadConversations();
    }, []);

    /*
     * Load conversation list only.
     *
     * IMPORTANT:
     * This function does NOT automatically select a conversation.
     */
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

    /*
     * Select an existing conversation
     */
    async function selectConversation(conversationId) {
        try {
            setSelectedConversationId(conversationId);
            setLoadingMessages(true);
            setError("");

            console.log(
                "Selected conversation:",
                conversationId
            );

            const data =
                await getConversationMessages(conversationId);

            setMessages(data);
        } catch (err) {
            console.error(err);
            setError("Unable to load messages.");
        } finally {
            setLoadingMessages(false);
        }
    }

    /*
     * Create a completely new chat
     */
    function handleNewChat() {
        console.log("Starting new chat");

        setSelectedConversationId(null);
        setMessages([]);
        setInput("");
        setError("");
    }

    /*
     * Send message
     */
    async function handleSendMessage() {
        const message = input.trim();

        if (!message || loading) {
            return;
        }

        setError("");
        setLoading(true);

        /*
         * Save the conversation ID that is being used
         * for THIS request.
         */
        const currentConversationId =
            selectedConversationId;

        console.log("Sending message:", message);
        console.log(
            "Conversation ID being sent:",
            currentConversationId
        );

        /*
         * Immediately display user's message
         */
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

        setInput("");

        try {
            /*
             * Send message + CURRENT conversation ID
             */
            const data = await sendMessage(
                message,
                currentConversationId
            );

            console.log("Backend response:", data);

            console.log(
                "Conversation ID returned by backend:",
                data.conversationId
            );

            /*
             * VERY IMPORTANT
             *
             * Always save the conversation ID returned
             * by the backend.
             *
             * This works for both:
             *
             * 1. New conversation
             * 2. Existing conversation
             */
            setSelectedConversationId(
                data.conversationId
            );

            /*
             * Display AI response
             */
            const assistantMessage = {
                id: `assistant-${Date.now()}`,
                role: "ASSISTANT",
                content: data.response,
                createdAt: new Date().toISOString(),
            };

            setMessages((previous) => [
                ...previous,
                assistantMessage,
            ]);

            /*
             * Refresh sidebar.
             *
             * IMPORTANT:
             * loadConversations() only refreshes the list.
             * It does NOT change the selected conversation.
             */
            await loadConversations();

        } catch (err) {
            console.error(err);

            setError(
                "Something went wrong while sending the message."
            );

            /*
             * Remove temporary user message
             * if API failed
             */
            setMessages((previous) =>
                previous.filter(
                    (msg) =>
                        msg.id !==
                        temporaryUserMessage.id
                )
            );
        } finally {
            setLoading(false);
        }
    }

    /*
     * Send message when Enter is pressed
     */
    function handleKeyDown(event) {
        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {
            event.preventDefault();
            handleSendMessage();
        }
    }

    /*
     * Sort conversations without mutating state
     */
    const sortedConversations = [...conversations].sort(
        (a, b) =>
            new Date(b.updatedAt) -
            new Date(a.updatedAt)
    );

    return (
        <div className="app">

            {/* ================= SIDEBAR ================= */}

            <aside className="sidebar">

                <button
                    className="new-chat-button"
                    onClick={handleNewChat}
                >
                    <span>+</span>
                    New Chat
                </button>

                <div className="conversation-title">
                    CONVERSATIONS
                </div>

                <div className="conversation-list">

                    {conversations.length === 0 && (
                        <div className="empty-conversations">
                            No conversations yet
                        </div>
                    )}

                    {sortedConversations.map(
                        (conversation) => (
                            <button
                                key={conversation.id}
                                className={`conversation-item ${
                                    selectedConversationId ===
                                    conversation.id
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() =>
                                    selectConversation(
                                        conversation.id
                                    )
                                }
                            >
                               <div className="conversation-name">
                                   {conversation.title || "New Conversation"}
                               </div>

                                <div className="conversation-date">
                                    {formatDate(
                                        conversation.updatedAt
                                    )}
                                </div>
                            </button>
                        )
                    )}
                </div>

                <div className="sidebar-footer">

                    <div className="bot-name">
                        🤖 AI Chatbot
                    </div>

                    <div className="bot-description">
                        Spring AI + Ollama
                    </div>

                </div>

            </aside>

            {/* ================= CHAT AREA ================= */}

            <main className="chat-area">

                {/* HEADER */}

                <header className="chat-header">

                    <h1>
                        AI Chatbot
                    </h1>

                    <p>
                        {selectedConversationId
                            ? "Conversation"
                            : "New conversation"}
                    </p>

                </header>

                {/* MESSAGES */}

                <div className="messages-container">

                    {loadingMessages && (
                        <div className="loading-message">
                            Loading conversation...
                        </div>
                    )}

                    {!loadingMessages &&
                        messages.length === 0 && (
                            <div className="welcome-message">

                                <div className="welcome-icon">
                                    🤖
                                </div>

                                <h2>
                                    How can I help you?
                                </h2>

                                <p>
                                    Start a conversation
                                    with your AI assistant.
                                </p>

                            </div>
                        )}

                    {messages.map((message) => (

                        <div
                            key={message.id}
                            className={`message-row ${
                                message.role === "USER"
                                    ? "user-row"
                                    : "assistant-row"
                            }`}
                        >

                            <div
                                className={`message-bubble ${
                                    message.role === "USER"
                                        ? "user-message"
                                        : "assistant-message"
                                }`}
                            >
                                {message.content}
                            </div>

                        </div>

                    ))}

                    {loading && (
                        <div className="message-row assistant-row">

                            <div className="message-bubble assistant-message typing">
                                Thinking...
                            </div>

                        </div>
                    )}

                </div>

                {/* ERROR */}

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {/* INPUT */}

                <div className="input-area">

                    <div className="input-wrapper">

                        <textarea
                            value={input}
                            onChange={(event) =>
                                setInput(
                                    event.target.value
                                )
                            }
                            onKeyDown={handleKeyDown}
                            placeholder="Message AI..."
                            rows={1}
                            disabled={loading}
                        />

                        <button
                            className="send-button"
                            onClick={handleSendMessage}
                            disabled={
                                loading ||
                                !input.trim()
                            }
                        >
                            ➤
                        </button>

                    </div>

                    <div className="input-footer">
                        AI can make mistakes. Check
                        important information.
                    </div>

                </div>

            </main>

        </div>
    );
}

/*
 * Format conversation date
 */
function formatDate(dateString) {
    if (!dateString) {
        return "";
    }

    const date = new Date(dateString);

    return date.toLocaleString("en-IN", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

export default App;