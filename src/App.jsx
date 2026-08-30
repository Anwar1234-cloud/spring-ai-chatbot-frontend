import { useEffect, useState } from "react";

import {
    getConversations,
    getConversationMessages,
    sendMessage,
    deleteConversation,
    regenerateResponse,
    saveFeedback,
    sendPdf,
} from "./services/chatApi";

import "./App.css";

function App() {
    const [conversations, setConversations] = useState([]);
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [feedback, setFeedback] = useState({});
    const [feedbackMessage, setFeedbackMessage] = useState({});
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null); 

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [error, setError] = useState("");


    /*
     * Load conversations when application starts
     */
useEffect(() => {
    initializeChat();
}, []);

async function initializeChat() {
    try {
        setError("");

        const data = await getConversations();

        const sorted = [...data].sort(
            (a, b) =>
                new Date(b.updatedAt) -
                new Date(a.updatedAt)
        );

        setConversations(sorted);

        if (sorted.length > 0) {
            await selectConversation(sorted[0].id);
        }
    } catch (err) {
        console.error(err);
        setError("Unable to load conversations.");
    }
}

   
async function loadConversations() {
    try {
        setError("");

        const data = await getConversations();

        const sorted = [...data].sort(
            (a, b) =>
                new Date(b.updatedAt) -
                new Date(a.updatedAt)
        );

        setConversations(sorted);

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
    function handleFileSelect(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    // Allow only PDF and images
    const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
        setError("Only PDF and image files are allowed.");
        event.target.value = "";
        return;
    }

    // Maximum 10 MB
    if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10 MB.");
        event.target.value = "";
        return;
    }

    setError("");
    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
        const previewUrl = URL.createObjectURL(file);
        setFilePreview(previewUrl);
    } else {
        setFilePreview(null);
    }
}

function removeSelectedFile() {
    if (filePreview) {
        URL.revokeObjectURL(filePreview);
    }

    setSelectedFile(null);
    setFilePreview(null);

    const fileInput =
        document.getElementById("file-input");

    if (fileInput) {
        fileInput.value = "";
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

        removeSelectedFile();
    }
    async function handleDeleteConversation(
    conversationId
) {
    const confirmed = window.confirm(
        "Are you sure you want to delete this conversation?"
    );

    if (!confirmed) {
        return;
    }

    try {
        setError("");

        await deleteConversation(conversationId);

        // Remove from sidebar immediately
        setConversations((previous) =>
            previous.filter(
                (conversation) =>
                    conversation.id !== conversationId
            )
        );

        // If deleted conversation was selected
        if (
            selectedConversationId ===
            conversationId
        ) {
            setSelectedConversationId(null);
            setMessages([]);
            setInput("");
        }

    } catch (err) {
        console.error(err);

        setError(
            "Unable to delete conversation."
        );
    }
}

    /*
     * Send message
     */
async function handleSendMessage() {
    const message = input.trim();

    if ((!message && !selectedFile) || loading) {
        return;
    }

    setError("");
    setLoading(true);

    const currentConversationId =
        selectedConversationId;

    const currentFile = selectedFile;

    console.log("Sending message:", message);
    console.log(
        "Conversation ID:",
        currentConversationId
    );

    if (currentFile) {
        console.log(
            "File:",
            currentFile.name,
            currentFile.type,
            currentFile.size
        );
    }

    /*
     * Show user's message immediately
     */
    const temporaryUserMessage = {
        id: `temp-${Date.now()}`,
        role: "USER",
        content: currentFile
            ? `${currentFile.name}${message ? `\n${message}` : ""}`
            : message,
        createdAt: new Date().toISOString(),
    };

    setMessages((previous) => [
        ...previous,
        temporaryUserMessage,
    ]);

    setInput("");

    try {
        let data;

        /*
         * ============================
         * PDF / FILE MESSAGE
         * ============================
         */
        if (currentFile) {

            data = await sendPdf(
                currentFile,
                message,
                currentConversationId
            );

        }

        /*
         * ============================
         * NORMAL TEXT MESSAGE
         * ============================
         */
        else {

            data = await sendMessage(
                message,
                currentConversationId,
                selectedFile
            );

        }

        console.log(
            "Backend response:",
            data
        );

        console.log(
            "Conversation ID returned:",
            data.conversationId
        );

        /*
         * Save conversation ID
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
         * Clear attachment after successful send
         */
        removeSelectedFile();

        /*
         * Refresh sidebar
         */
        await loadConversations();

    } catch (err) {

        console.error(
            "Send message error:",
            err
        );

        setError(
            "Something went wrong while sending the message."
        );

        /*
         * Remove temporary user message
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
 * Copy AI response
 */
async function handleCopyResponse(content) {
    try {
        await navigator.clipboard.writeText(content);

        // Optional: show feedback
        setError("");
        alert("Response copied!");
    } catch (err) {
        console.error(err);
        setError("Unable to copy response.");
    }
}

async function handleFeedback(messageId, type) {
    try {
        setError("");

        console.log(
            "Saving feedback:",
            messageId,
            type
        );

        await saveFeedback(messageId, type);

        // Save selected feedback in frontend
        setFeedback((previous) => ({
            ...previous,
            [messageId]: type,
        }));

        // Show confirmation to user
        setFeedbackMessage((previous) => ({
            ...previous,
            [messageId]:
                type === "LIKE"
                    ? "Liked 👍"
                    : "Disliked 👎",
        }));

        console.log("Feedback saved successfully");

    } catch (err) {
        console.error(err);

        setError("Unable to save feedback.");
    }
}


/*
 * Regenerate the last AI response
 */
async function handleRegenerate(messageId) {

    if (loading) {
        return;
    }

    if (!selectedConversationId) {
        return;
    }

    setLoading(true);
    setError("");

    try {

        console.log(
            "Regenerating assistant message:",
            messageId
        );

        console.log(
            "Conversation:",
            selectedConversationId
        );

        const data = await regenerateResponse(
            selectedConversationId,
            messageId
        );

        console.log(
            "Regenerate response:",
            data
        );

        /*
         * Reload messages from PostgreSQL.
         *
         * This is important because the database
         * now contains the new assistant message
         * with its real PostgreSQL ID.
         */
        const updatedMessages =
            await getConversationMessages(
                selectedConversationId
            );

        setMessages(updatedMessages);

        /*
         * Refresh sidebar
         */
        await loadConversations();

    } catch (err) {

        console.error(err);

        setError(
            "Something went wrong while regenerating response."
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
                <div
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

                    <div className="conversation-info">

                        <div className="conversation-name">
                            {conversation.title ||
                                "New Conversation"}
                        </div>

                        <div className="conversation-date">
                            {formatDate(
                                conversation.updatedAt
                            )}
                        </div>

                    </div>

                    <button
                        className="delete-button"
                        onClick={(event) => {
                            event.stopPropagation();

                            handleDeleteConversation(
                                conversation.id
                            );
                        }}
                    >
                        🗑️
                    </button>

                </div>
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

        <div className="message-content-wrapper">

            <div
                className={`message-bubble ${
                    message.role === "USER"
                        ? "user-message"
                        : "assistant-message"
                }`}
            >
                {message.content}
            </div>

            {/* ================= ASSISTANT ACTIONS ================= */}

{message.role === "ASSISTANT" && (
    <div className="message-actions">

       <button
    className={
        feedback[message.id] === "LIKE"
            ? "feedback-button selected"
            : "feedback-button"
    }
    onClick={() =>
        handleFeedback(message.id, "LIKE")
    }
>
    👍
</button>

<button
    className={
        feedback[message.id] === "DISLIKE"
            ? "feedback-button selected"
            : "feedback-button"
    }
    onClick={() =>
        handleFeedback(message.id, "DISLIKE")
    }
>
    👎
</button>

        <button
            className="message-action-button"
            onClick={() =>
                handleCopyResponse(
                    message.content
                )
            }
            title="Copy response"
        >
            📋
        </button>

        <button
            className="message-action-button"
            onClick={() =>
                handleRegenerate(
                    message.id
                )
            }
            disabled={loading}
            title="Regenerate response"
        >
            🔄
        </button>

    </div>
)}

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

{/* FILE PREVIEW */}
{selectedFile && (
    <div className="attachment-preview">

        {filePreview ? (
            <div className="image-preview-wrapper">
                <img
                    src={filePreview}
                    alt={selectedFile.name}
                    className="image-preview"
                />
            </div>
        ) : (
            <div className="pdf-preview">
                <span className="pdf-icon">📄</span>

                <div className="file-info">
                    <div className="file-name">
                        {selectedFile.name}
                    </div>

                    <div className="file-size">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                </div>
            </div>
        )}

        <button
            type="button"
            className="remove-file-button"
            onClick={removeSelectedFile}
            disabled={loading}
        >
            ✕
        </button>

    </div>
)}

{/* INPUT */}
<div className="input-area">

    <div className="input-wrapper">

        {/* Hidden file input */}
        <input
            id="file-input"
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            style={{ display: "none" }}
        />

        {/* Attach button */}
        <button
            type="button"
            className="attach-button"
            onClick={() =>
                document
                    .getElementById("file-input")
                    .click()
            }
            disabled={loading}
            title="Attach file"
        >
            📎
        </button>

        <textarea
            value={input}
            onChange={(event) =>
                setInput(event.target.value)
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
                (!input.trim() && !selectedFile)
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