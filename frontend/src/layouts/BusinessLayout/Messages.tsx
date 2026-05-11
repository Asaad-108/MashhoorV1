import { useState } from "react";

type Message = { id: number; sender: "me" | "other"; text: string; time: string };
type Conversation = { id: number; name: string; avatar: string; lastMsg: string; time: string; unread: number; messages: Message[] };

const conversationsData: Conversation[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    lastMsg: "That sounds great! Let me check...",
    time: "2m ago",
    unread: 2,
    messages: [
      { id: 1, sender: "other", text: "Hi! Thanks for reaching out about the collaboration.", time: "10:30 AM" },
      { id: 2, sender: "me", text: "Great to connect! I'd love to discuss our summer campaign with you.", time: "10:32 AM" },
      { id: 3, sender: "other", text: "That sounds interesting! Can you tell me more about the campaign?", time: "10:35 AM" },
      { id: 4, sender: "me", text: "Absolutely! We're launching a new sustainable fashion line.", time: "10:36 AM" },
      { id: 5, sender: "other", text: "That sounds great! Let me check my availability for this month.", time: "10:40 AM" },
    ],
  },
  {
    id: 2,
    name: "Ahmed Al-Rashid",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    lastMsg: "I'd be happy to collaborate",
    time: "1h ago",
    unread: 0,
    messages: [
      { id: 1, sender: "me", text: "Hi Ahmed, we'd love to work with you on our tech campaign.", time: "9:00 AM" },
      { id: 2, sender: "other", text: "I'd be happy to collaborate! Send me the details.", time: "9:15 AM" },
    ],
  },
  {
    id: 3,
    name: "Maya Patel",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    lastMsg: "Thanks for reaching out!",
    time: "3h ago",
    unread: 1,
    messages: [
      { id: 1, sender: "other", text: "Thanks for reaching out! I love your brand's values.", time: "8:00 AM" },
    ],
  },
];

function Messages() {
  const [activeId, setActiveId] = useState<number>(1);
  const [newMessage, setNewMessage] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>(conversationsData);
  const [search, setSearch] = useState("");

  const activeConvo = conversations.find((c) => c.id === activeId)!;

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const msg: Message = {
      id: Date.now(),
      sender: "me",
      text: newMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, msg], lastMsg: msg.text, unread: 0 }
          : c
      )
    );
    setNewMessage("");
  };

  const handleSelectConvo = (id: number) => {
    setActiveId(id);
    // Clear unread on open
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
    );
  };

  return (
    <div className="messages-page">
      <div className="flex flex-1 overflow-hidden p-6 gap-6">
        {/* Sidebar */}
        <div className="w-1/3 bg-white rounded-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <img src="/src/assets/search.svg" alt="Search" width={18} height={18} />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-gray-50 border border-transparent rounded-lg py-2 pl-10 pr-4 text-sm focus:bg-white focus:border-purple-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleSelectConvo(chat.id)}
                className={`p-4 flex gap-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                  chat.id === activeId
                    ? "bg-gray-50 border-l-4 border-purple-500"
                    : "border-l-4 border-transparent"
                }`}
              >
                <img src={chat.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{chat.name}</h3>
                    <span className="text-xs text-gray-400">{chat.time}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{chat.lastMsg}</p>
                </div>
                {chat.unread > 0 && (
                  <div className="flex items-center">
                    <span className="w-5 h-5 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {chat.unread}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <img src={activeConvo.avatar} alt="" className="w-10 h-10 rounded-full" />
            <div>
              <h3 className="font-bold text-gray-900">{activeConvo.name}</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-xs text-gray-500">Active now</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeConvo.messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] p-4 shadow-sm ${msg.sender === "me" ? "msg-bubble-me" : "msg-bubble-other"}`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <div className={`text-xs mt-1 ${msg.sender === "me" ? "text-purple-200" : "text-gray-400"}`}>
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-100">
            <div className="flex gap-3 items-center bg-gray-50 p-2 rounded-xl border border-gray-200">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <img src="/src/assets/paperclip.svg" alt="Attachment" width={20} height={20} />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your message..."
                className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500 text-sm"
              />
              <button
                onClick={handleSend}
                className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-md"
              >
                <img src="/src/assets/send.svg" alt="Send" width={18} height={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Messages;
