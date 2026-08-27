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
export async function sendMessage(message, conversationId = null) {
    const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            message,
            conversationId,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to send message");
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
        `${API_BASE_URL}/conversations/${conversationId}/messages/${messageId}/regenerate`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
            errorText ||
            "Failed to regenerate response"
        );
    }

    return response.json();
}