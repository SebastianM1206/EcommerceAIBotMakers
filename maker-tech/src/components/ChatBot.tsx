import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chatApiService, ChatApiError } from '@/lib/api';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  isLoading?: boolean;
  isError?: boolean;
  executionTime?: number;
}

export const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your Makers Tech assistant. I can help you with information about products, stock, prices, orders and more. How can I help you today?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userQuery = inputValue.trim();
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userQuery,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Add bot loading message
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: "Processing your query...",
      isBot: true,
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Call backend
      const response = await chatApiService.sendQuery(userQuery);
      
      // Remove loading message and add real response
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => msg.id !== loadingMessage.id);
        
        const botResponse: Message = {
          id: (Date.now() + 2).toString(),
          text: response.answer,
          isBot: true,
          timestamp: new Date(),
          executionTime: response.execution_time,
        };

        return [...withoutLoading, botResponse];
      });

    } catch (error) {
      // Remove loading message and add error message
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => msg.id !== loadingMessage.id);
        
        let errorMessage = "Sorry, an error occurred while processing your query.";
        
        if (error instanceof ChatApiError) {
          if (error.status === 0) {
            errorMessage = "Cannot connect to server. Please verify that the backend is running on http://localhost:8001";
          } else {
            errorMessage = error.message;
          }
        }

        const errorResponse: Message = {
          id: (Date.now() + 2).toString(),
          text: errorMessage,
          isBot: true,
          timestamp: new Date(),
          isError: true,
        };

        return [...withoutLoading, errorResponse];
      });
    } finally {
      setIsLoading(false);
    }
  };



  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-[26vw] h-[85vh] shadow-xl z-50 flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            Makers Tech Assistant
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-success">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
          Online now
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4 pt-0 min-h-0">
        <ScrollArea className="flex-1 pr-2" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.isBot ? '' : 'justify-end'}`}
              >
                {message.isBot && (
                  <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
                
                <div
                  className={`max-w-[200px] p-3 rounded-lg text-sm ${
                    message.isBot
                      ? message.isError 
                        ? 'bg-destructive/10 text-destructive border border-destructive/20'
                        : 'bg-secondary text-secondary-foreground'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.isLoading && (
                      <Loader2 className="h-3 w-3 animate-spin mt-0.5 flex-shrink-0" />
                    )}
                    {message.isError && (
                      <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    )}
                    <span className="flex-1">{message.text}</span>
                  </div>
                  {message.executionTime && (
                    <div className="text-xs text-muted-foreground mt-1 opacity-60">
                      Processed in {message.executionTime.toFixed(2)}s
                    </div>
                  )}
                </div>
                
                {!message.isBot && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="flex gap-2 mt-4 flex-shrink-0">
          <Input
            placeholder="Type your question..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage} 
            size="icon"
            disabled={isLoading || !inputValue.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};