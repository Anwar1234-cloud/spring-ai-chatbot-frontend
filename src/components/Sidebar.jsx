function Sidebar({
  conversations,
  currentConversationId,
  onNewChat,
  onSelectConversation,
}) {
  return (
    <aside className="flex h-screen w-72 flex-col border-r border-gray-800 bg-gray-950 text-white">

      {/* Header */}
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="flex w-full items-center gap-3 rounded-lg border border-gray-700 px-4 py-3 text-sm transition hover:bg-gray-800"
        >
          <span className="text-xl">+</span>
          New Chat
        </button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-3">

        <p className="mb-2 px-2 text-xs font-semibold uppercase text-gray-500">
          Conversations
        </p>

        {conversations.length === 0 ? (
          <p className="px-2 py-3 text-sm text-gray-500">
            No conversations yet
          </p>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`mb-1 w-full rounded-lg px-3 py-3 text-left text-sm transition ${
                currentConversationId === conversation.id
                  ? "bg-gray-800"
                  : "hover:bg-gray-900"
              }`}
            >
              <div className="truncate">
                Conversation
              </div>

              <div className="mt-1 text-xs text-gray-500">
                {new Date(conversation.updatedAt).toLocaleString()}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 p-4">
        <div className="text-sm font-medium">
          🤖 AI Chatbot
        </div>

        <div className="mt-1 text-xs text-gray-500">
          Spring AI + Ollama
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;