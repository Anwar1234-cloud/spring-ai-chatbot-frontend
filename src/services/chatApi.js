const API_BASE_URL = "http://localhost:8080/api";

/**
 * Get all conversations
 */
export async function getConversations() {
    const response = await fetch(`${API_BASE_URL}/conversations`);

    if (!response.ok) {
        throw new Error("Failed to load conversations");
    }

    return response.json();
}

/**
 * Get messages for a conversation
 */
export async function getConversationMessages(conversationId) {
    const response = await fetch(
        `${API_BASE_URL}/conversations/${conversationId}/messages`
    );

    if (!response.ok) {
        throw new Error("Failed to load conversation messages");
    }

    return response.json();
}

/**
 * Send a message to the chatbot
 */
export async function sendMessage(
    message,
    conversationId = null,
    file = null
) {
    const formData = new FormData();

    formData.append("message", message);

    if (conversationId) {
        formData.append(
            "conversationId",
            conversationId
        );
    }

    if (file) {
        formData.append("file", file);
    }

    const response = await fetch(
        `${API_BASE_URL}/chat`,
        {
            method: "POST",
            body: formData,
        }
    );

    if (!response.ok) {
        const errorText = await response.text();

        console.error(
            "Chat API error:",
            response.status,
            errorText
        );

        throw new Error(
            errorText || "Failed to send message"
        );
    }

    return response.json();
}

/**
 * Delete a conversation
 */
export async function deleteConversation(conversationId) {
    const response = await fetch(
        `${API_BASE_URL}/conversations/${conversationId}`,
        {
            method: "DELETE",
        }
    );

    if (!response.ok) {
        throw new Error("Failed to delete conversation");
    }
}

/**
 * Regenerate an assistant response
 */
export async function regenerateResponse(
    conversationId,
    messageId
) {
    const response = await fetch(
        `http://localhost:8080/api/chat/regenerate?conversationId=${conversationId}&messageId=${messageId}`,
        {
            method: "POST",
        }
    );

    if (!response.ok) {
        throw new Error(
            "Failed to regenerate response"
        );
    }

    return response.json();
}

export async function saveFeedback(messageId, type) {
    const response = await fetch(
        "http://localhost:8080/api/chat/feedback",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messageId,
                type,
            }),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();

        console.error(
            "Feedback API error:",
            response.status,
            errorText
        );

        throw new Error("Failed to save feedback");
    }
}
export async function sendPdf(
    file,
    message = "",
    conversationId = null
) {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("message", message);

    if (conversationId) {
        formData.append(
            "conversationId",
            conversationId
        );
    }

    const response = await fetch(
        `${API_BASE_URL}/chat`,
        {
            method: "POST",
            body: formData,
        }
    );

    if (!response.ok) {
        const errorText = await response.text();

        console.error(
            "PDF API error:",
            response.status,
            errorText
        );

        throw new Error(
            errorText || "Failed to process PDF"
        );
    }

    return response.json();
}