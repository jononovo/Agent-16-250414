import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, SendIcon } from "lucide-react"

export interface ChatMessage {
  id: string
  content: string
  role: "user" | "assistant" | "system"
  createdAt?: Date
}

interface ChatProps {
  messages: ChatMessage[]
  input: string
  onInputChange: (value: string) => void
  onSubmit: (value: string) => void
  isLoading?: boolean
}

export function Chat({ messages, input, onInputChange, onSubmit, isLoading = false }: ChatProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = React.useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messagesEndRef])

  React.useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  return (
    <Card className="w-full max-w-md h-full flex flex-col">
      <CardHeader className="px-6 pt-6 pb-4">
        <CardTitle className="text-xl flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 mr-2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Monkey Agent
        </CardTitle>
        <CardDescription>Describe your workflow and I'll build it</CardDescription>
      </CardHeader>
      <div className="flex-1 overflow-y-auto p-6 pt-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col mb-4 ${
              message.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`flex items-center space-x-2 ${
                message.role === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"
              }`}
            >
              <Avatar className="h-8 w-8">
                {message.role === "user" ? (
                  <>
                    <AvatarImage src="/assets/user-avatar.svg" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </>
                ) : (
                  <>
                    <AvatarImage src="/assets/bot-avatar.svg" alt="Assistant" />
                    <AvatarFallback>A</AvatarFallback>
                  </>
                )}
              </Avatar>
              <div
                className={`px-4 py-3 rounded-lg max-w-xs sm:max-w-md ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="whitespace-pre-wrap text-sm">
                  {message.content}
                </div>
              </div>
            </div>
            {message.createdAt && (
              <span className="text-xs text-muted-foreground mt-1 px-10">
                {message.createdAt.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/assets/bot-avatar.svg" alt="Assistant" />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div className="px-4 py-3 rounded-lg max-w-xs sm:max-w-md bg-muted">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-current animate-bounce" />
                <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
                <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <CardFooter className="px-6 py-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (input.trim() && !isLoading) {
              onSubmit(input)
            }
          }}
          className="flex w-full items-center space-x-2"
        >
          <Input
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Describe your workflow..."
            className="flex-1"
            disabled={isLoading}
            data-chat-input
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}