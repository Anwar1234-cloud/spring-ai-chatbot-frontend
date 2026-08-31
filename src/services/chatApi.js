
const API_BASE_URL = "http://localhost:8080/api";

/*
 * ============================================================
 * CONVERSATIONS
 * ============================================================
 */

export async function getConversations() {
    const response = await fetch(
        `${API_BASE_URL}/conversations`
    );

    if (!response.ok) {
        throw new Error("Failed to load conversations");
    }

    return response.json();
}


export async function getConversationMessages(
    conversationId
) {
    const response = await fetch(
        `${API_BASE_URL}/conversations/${conversationId}/messages`
    );

    if (!response.ok) {
        throw new Error(
            "Failed to load conversation messages"
        );
    }

    return response.json();
}


export async function deleteConversation(
    conversationId
) {
    const response = await fetch(
        `${API_BASE_URL}/conversations/${conversationId}`,
        {
            method: "DELETE",
        }
    );

    if (!response.ok) {
        throw new Error(
            "Failed to delete conversation"
        );
    }
}


/*
 * ============================================================
 * NORMAL CHAT WITH TEXT / FILE
 * ============================================================
 */

export async function sendMessage(
    message,
    conversationId = null,
    file = null,
    signal = null
) {
    /*
     * Your controller has two endpoints:
     *
     * application/json
     * multipart/form-data
     *
     * If file exists -> multipart
     * Otherwise -> JSON
     */

    if (file) {
        const formData = new FormData();

        formData.append(
            "message",
            message || ""
        );

        if (conversationId) {
            formData.append(
                "conversationId",
                conversationId
            );
        }

        formData.append("file", file);

        const response = await fetch(
            `${API_BASE_URL}/chat`,
            {
                method: "POST",
                body: formData,
                signal,
            }
        );

        if (!response.ok) {
            const errorText =
                await response.text();

            throw new Error(
                errorText ||
                "Failed to send file message"
            );
        }

        return response.json();
    }


    /*
     * Normal JSON chat
     */

    const response = await fetch(
        `${API_BASE_URL}/chat`,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json",
            },

            body: JSON.stringify({
                message,
                conversationId,
            }),

            signal,
        }
    );

    if (!response.ok) {
        const errorText =
            await response.text();

        throw new Error(
            errorText ||
            "Failed to send message"
        );
    }

    return response.json();
}


/*
 * ============================================================
 * REGENERATE
 * ============================================================
 */

export async function regenerateResponse(
    conversationId,
    messageId
) {
    const response = await fetch(
        `${API_BASE_URL}/chat/regenerate?conversationId=${encodeURIComponent(
            conversationId
        )}&messageId=${encodeURIComponent(
            messageId
        )}`,
        {
            method: "POST",
        }
    );

    if (!response.ok) {
        const errorText =
            await response.text();

        throw new Error(
            errorText ||
            "Failed to regenerate response"
        );
    }

    return response.json();
}


/*
 * ============================================================
 * FEEDBACK
 * ============================================================
 */

export async function saveFeedback(
    messageId,
    type
) {
    const response = await fetch(
        `${API_BASE_URL}/chat/feedback`,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json",
            },

            body: JSON.stringify({
                messageId,
                type,
            }),
        }
    );

    if (!response.ok) {
        const errorText =
            await response.text();

        console.error(
            "Feedback API error:",
            response.status,
            errorText
        );

        throw new Error(
            "Failed to save feedback"
        );
    }
}



/**
 * Read Spring SSE stream correctly.
 *
 * Important:
 * A browser fetch() chunk is NOT guaranteed to contain
 * complete SSE lines. We therefore keep a buffer and
 * process complete lines only.
 */

async function readTextStream(response, onChunk) {

    if (!response.body) {
        throw new Error(
            "Streaming is not supported by this browser."
        );
    }

    const reader =
        response.body.getReader();

    const decoder =
        new TextDecoder("utf-8");

    let fullResponse = "";

    try {

        while (true) {

            const { value, done } =
                await reader.read();

            if (done) {
                break;
            }

            const text =
                decoder.decode(value, {
                    stream: true,
                });

            if (text) {

                fullResponse += text;

                onChunk(text);
            }
        }

        // Flush decoder
        const remaining =
            decoder.decode();

        if (remaining) {

            fullResponse += remaining;

            onChunk(remaining);
        }

    } finally {

        reader.releaseLock();
    }

    return fullResponse;
}


export async function streamMessage(
    message,
    conversationId = null,
    signal,
    onChunk
) {

    const response =
        await fetch(
            `${API_BASE_URL}/chat/stream`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Accept":
                        "text/plain",
                },

                body: JSON.stringify({
                    message,
                    conversationId,
                }),

                signal,
            }
        );

    if (!response.ok) {

        const errorText =
            await response.text();

        console.error(
            "Streaming API error:",
            response.status,
            errorText
        );

        throw new Error(
            errorText ||
            "Failed to stream response"
        );
    }

    return readTextStream(
        response,
        onChunk
    );
}


export async function streamFileMessage(
    file,
    message = "",
    conversationId = null,
    signal,
    onChunk
) {

    const formData =
        new FormData();

    formData.append(
        "file",
        file
    );

    formData.append(
        "message",
        message
    );

    if (conversationId) {

        formData.append(
            "conversationId",
            conversationId
        );
    }

    const response =
        await fetch(
            `${API_BASE_URL}/chat/stream-file`,
            {
                method: "POST",

                headers: {
                    "Accept":
                        "text/plain",
                },

                body: formData,

                signal,
            }
        );

    if (!response.ok) {

        const errorText =
            await response.text();

        console.error(
            "File streaming API error:",
            response.status,
            errorText
        );

        throw new Error(
            errorText ||
            "Failed to stream file response"
        );
    }

    return readTextStream(
        response,
        onChunk
    );
}





