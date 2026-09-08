import { chat } from '../../systems/chat.js'
import { useChat } from './hooks.js'

// Portal chat, delivered by the SDK's 'chat_message_sent' player event. The
// game has no chat input of its own — this is a read-only scrollback.
export default function ChatLine() {
  useChat()
  const lines = chat.lines
  if (lines.length === 0) return null

  return (
    <div className="mt-2 space-y-0.5 text-slate-300">
      {lines.map((line, i) => (
        // Chat lines are append-only and capped; index is a stable key here.
        <div key={i} className="truncate">
          {line}
        </div>
      ))}
    </div>
  )
}
