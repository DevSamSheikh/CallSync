import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

interface AgentSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function AgentSelect({ value, onValueChange, placeholder = "Search or select agent...", className }: AgentSelectProps) {
  const [open, setOpen] = useState(false);
  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const agents = users?.filter(u => u.role === "agent") || [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between bg-white border-primary/20 hover:border-primary/40 h-10 shadow-sm w-full transition-all hover-elevate active-elevate-2",
            !value && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <span className="truncate">
              {value
                ? agents.find((agent) => agent.name === value)?.name
                : placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 shadow-xl border-primary/10" align="start">
        <Command className="rounded-xl overflow-hidden">
          <CommandInput placeholder="Search agent name..." className="h-10" />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No agent found.</CommandEmpty>
            <CommandGroup>
              {agents.map((agent) => (
                <CommandItem
                  key={agent.id}
                  value={agent.name}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                  className="py-3 px-4 flex items-center gap-3 cursor-pointer hover:bg-primary/5 transition-colors"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    agent.name === value 
                      ? "bg-primary text-white scale-110" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {agent.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{agent.name}</p>
                    <p className="text-xs text-muted-foreground truncate">ID: {agent.username}</p>
                  </div>
                  <Check
                    className={cn(
                      "h-4 w-4 text-primary",
                      agent.name === value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
