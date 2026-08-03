import { Link } from "@tanstack/react-router";
import { Pin, PinOff, Plus, Search, Settings, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatWhen, messageText, sortThreads, type ChatThread } from "@/lib/ai-store";

type Props = {
  threads: ChatThread[];
  activeId: string;
  onNew: () => void;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
};

export function AiSidebar({ threads, activeId, onNew, onPin, onDelete }: Props) {
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? threads.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.messages.some((m) => messageText(m).toLowerCase().includes(q)),
        )
      : threads;
    return sortThreads(filtered);
  }, [threads, query]);

  return (
    <aside className="glass-card flex max-h-[70vh] flex-col overflow-hidden lg:max-h-[78vh]">
      <div className="space-y-3 border-b border-border/60 p-3">
        <Button className="w-full gap-2" onClick={onNew}>
          <Plus className="size-4" /> New chat
        </Button>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats…"
            className="pl-9"
            aria-label="Search chat history"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {list.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">No chats found.</p>
        ) : (
          <ul className="space-y-1">
            {list.map((thread) => (
              <li
                key={thread.id}
                className={cn(
                  "group flex items-center gap-1 rounded-xl px-2 py-1.5 transition-colors hover:bg-muted/70",
                  thread.id === activeId && "bg-primary/10",
                )}
              >
                <Link
                  to="/ai-helper/$threadId"
                  params={{ threadId: thread.id }}
                  className="min-w-0 flex-1 py-1 text-left"
                >
                  <span className="block truncate text-sm font-medium">
                    {thread.pinned ? "📌 " : ""}
                    {thread.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {thread.messages.length} messages · {formatWhen(thread.updatedAt)}
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={thread.pinned ? "Unpin chat" : "Pin chat"}
                  onClick={() => onPin(thread.id)}
                >
                  {thread.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete chat"
                  onClick={() => onDelete(thread.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-border/60 p-2">
        <Button asChild variant="ghost" className="w-full justify-start gap-2">
          <Link to="/ai-settings">
            <Settings className="size-4" /> AI settings
          </Link>
        </Button>
      </div>
    </aside>
  );
}
