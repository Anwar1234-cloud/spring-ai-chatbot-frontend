import { useState } from "react";

function ChatInput({ onSend, disabled }) {
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || disabled) {
      return;
    }

    setMessage("");
    await onSend(trimmedMessage);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-800 bg-gray-950 p-4"
    >
      <div className="mx-auto flex max-w-4xl items-end gap-3 rounded-2xl border border-gray-700 bg-gray-900 p-2">

        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Message AI..."
          rows={1}
          disabled={disabled}
          className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSubmit(event);
            }
          }}
        />

        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ➤
        </button>

      </div>

      <p className="mt-2 text-center text-xs text-gray-600">
        AI can make mistakes. Check important information.
      </p>
    </form>
  );
}

export default ChatInput;