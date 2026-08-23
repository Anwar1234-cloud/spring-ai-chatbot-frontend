const API_BASE_URL = "http://localhost:8080/api";

export async function getConversations() {
  const response = await fetch(`${API_BASE_URL}/conversations`);

  if (!response.ok) {
    throw new Error("Failed to load conversations");
  }

  return response.json();
}

export async function getMessages(conversationId) {
  const response = await fetch(
    `${API_BASE_URL}/conversations/${conversationId}/messages`
  );

  if (!response.ok) {
    throw new Error("Failed to load messages");
  }

  return response.json();
}

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
    throw new Error("Failed to send message");
  }

  return response.json();
}