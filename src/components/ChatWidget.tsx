import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
    id: string;
    sender: "user" | "ai";
    text: string;
}

const KNOWLEDGE_BASE = [
    {
        keywords: ["how to file", "submit", "create complaint", "report issue", "file a complaint"],
        answer: "You can file a complaint by clicking 'File Complaint' in the top navigation. You can do this anonymously, or sign in to track your complaint and earn leaderboard points! Make sure to upload a photo and provide a clear description.",
    },
    {
        keywords: ["what happens next", "after submit", "track", "status", "progress"],
        answer: "Once submitted, our Pretrained AI analyzes your complaint for emergency priority. It is then assigned to a worker from the relevant department. You can track its status in the 'My Complaints' tab.",
    },
    {
        keywords: ["priority", "ai", "emergency", "high priority", "how is priority"],
        answer: "We use a Pretrained AI Model (Computer Vision + NLP) that analyzes your description and uploaded images. If it detects critical infrastructure hazards (e.g., pipeline leaks, downed wires), it automatically flags the complaint as High Priority.",
    },
    {
        keywords: ["billboard", "wall of shame", "shame", "pending", "unresolved"],
        answer: "The Public Billboard is our 'Wall of Shame'. It publicly highlights the official authorities (like the Water or Electricity Board) responsible for tasks that have been left pending for too long, ensuring public accountability.",
    },
    {
        keywords: ["leaderboard", "points", "reward", "rank", "quarterly", "champion"],
        answer: "The Civic Leaderboard rewards our most active authenticated citizens. We tally all reports every quarter, and the top contributors are recognized for helping improve our city's infrastructure!",
    },
    {
        keywords: ["worker", "who fixes", "engineer", "department"],
        answer: "Complaints are assigned to verified municipal workers. They view tasks on their Worker Portal, travel to the location, resolve the issue, and must upload a clear photograph of the completed work for admin review.",
    },
    {
        keywords: ["hello", "hi", "hey", "help", "who are you"],
        answer: "Hello! I am the Nagar Niti AI Assistant. I can help answer any questions you have about filing complaints, tracking issues, the billboard, or how our civic platform works. What would you like to know?",
    },
];

const findBestMatch = (query: string): string => {
    const normalizedQuery = query.toLowerCase();

    let bestMatch = null;
    let maxScore = 0;

    for (const entry of KNOWLEDGE_BASE) {
        let score = 0;
        for (const keyword of entry.keywords) {
            if (normalizedQuery.includes(keyword)) {
                score += keyword.length; // Weight longer keyword matches higher
            }
        }
        if (score > maxScore) {
            maxScore = score;
            bestMatch = entry.answer;
        }
    }

    // Strict domain-limitation fallback
    if (maxScore === 0) {
        return "I'm sorry, I am specifically restricted to answering questions related to the Nagar Niti Civic Issue Platform. I cannot assist with outside topics. Try asking me about filing complaints, rewards, or our AI tracking!";
    }

    return bestMatch!;
};

export const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: "1", sender: "ai", text: "Hi! I'm the Nagar Niti AI. Have any questions about our civic platform?" }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), sender: "user", text: input.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        // Simulate network/AI processing delay
        setTimeout(() => {
            const response = findBestMatch(userMsg.text);
            setMessages(prev => [...prev, { id: Date.now().toString(), sender: "ai", text: response }]);
            setIsTyping(false);
        }, 1200);
    };

    return (
        <>
            {/* Floating Chat Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="fixed bottom-6 right-6 z-50"
                    >
                        <Button
                            onClick={() => setIsOpen(true)}
                            size="icon"
                            className="h-14 w-14 rounded-full shadow-2xl hover:shadow-primary/50 transition-all duration-300"
                        >
                            <MessageSquare className="h-6 w-6" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        className="fixed bottom-6 right-6 z-50 w-full max-w-[350px]"
                    >
                        <Card className="border-primary/20 shadow-2xl overflow-hidden flex flex-col h-[500px]">
                            <CardHeader className="bg-primary px-4 py-3 flex flex-row items-center justify-between shadow-md">
                                <div className="flex items-center gap-2 text-primary-foreground">
                                    <Bot className="h-6 w-6" />
                                    <div>
                                        <CardTitle className="text-sm font-bold">Nagar Niti AI</CardTitle>
                                        <p className="text-[10px] opacity-80 uppercase tracking-wider">Restricted Domain System</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8" onClick={() => setIsOpen(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </CardHeader>

                            <CardContent className="flex-1 p-0 overflow-y-auto bg-muted/20" ref={scrollRef}>
                                <div className="p-4 space-y-4">
                                    {messages.map((msg) => (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                        >
                                            <Avatar className={`h-8 w-8 shrink-0 ${msg.sender === 'user' ? 'bg-primary border border-primary' : 'bg-secondary border border-border'}`}>
                                                <AvatarFallback className={msg.sender === 'user' ? 'text-primary-foreground' : 'text-foreground'}>
                                                    {msg.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div
                                                className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm shadow-sm
                          ${msg.sender === 'user'
                                                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                        : 'bg-background border border-border text-foreground rounded-tl-none'
                                                    }`}
                                            >
                                                {msg.text}
                                            </div>
                                        </motion.div>
                                    ))}

                                    {isTyping && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex gap-2 flex-row"
                                        >
                                            <Avatar className="h-8 w-8 shrink-0 bg-secondary border border-border">
                                                <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                                            </Avatar>
                                            <div className="px-4 py-3 rounded-2xl bg-background border border-border rounded-tl-none flex items-center gap-1 shadow-sm">
                                                <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce"></span>
                                                <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                                <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </CardContent>

                            <CardFooter className="p-3 bg-background border-t border-border">
                                <form
                                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                    className="flex w-full items-center gap-2"
                                >
                                    <Input
                                        placeholder="Ask about Nagar Niti..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        className="flex-1 border-muted-foreground/20 focus-visible:ring-primary/50 shadow-sm"
                                    />
                                    <Button type="submit" size="icon" disabled={!input.trim() || isTyping} className="shadow-sm shrink-0">
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
