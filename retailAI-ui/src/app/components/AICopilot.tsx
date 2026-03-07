import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  MoreHorizontal,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  TrendingUp,
  Package,
  MessageSquare,
  Plus,
  Clock,
  History,
  Pin,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { pinWidgetToPage } from '../services/api.service';
import { toast } from 'sonner';
import { 
  sendChatMessage, 
  convertToVisualizationFormat,
  fetchChatHistory,
  fetchChatMessages,
  type ChatHistoryItem,
  type ChatMessageItem
} from '../services/chatbot.service';

interface ChartData {
  type: 'chart';
  title?: string;
  data: any[]; // Highcharts configs
}

interface GridData {
  type: 'grid';
  title?: string;
  data: Array<{
    title?: string;
    rows: any[];
  }>;
}

interface SummaryCardData {
  type: 'summaryCard';
  title?: string;
  data: Array<{
    title: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down';
  }>;
}

type VisualizationData = ChartData | GridData | SummaryCardData;

interface AIResponse {
  message: string;
  data?: VisualizationData[];
  sessionId?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  error?: boolean;
  visualizations?: VisualizationData[];
  sessionId?: string;
}

interface ChatHistory {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
  sessionId: string;
}

// API function to call chatbot endpoint
async function callAIAPI(userMessage: string, conversationHistory: Message[], sessionId?: string, dashboardType?: string): Promise<AIResponse> {
  try {
    // Call the real AWS API Gateway endpoint
    const response = await sendChatMessage({
      message: userMessage,
      session_id: sessionId, // undefined for first message, then uses session_id from response
      dashboard_type: dashboardType, // Include dashboard type for context
    });
    
    // Convert to visualization format (response is already parsed)
    const visualizationData = convertToVisualizationFormat(response);
    
    return {
      message: visualizationData.message,
      data: visualizationData.data,
      sessionId: visualizationData.sessionId
    };
  } catch (error) {
    console.error('Error calling AI API:', error);
    throw error;
  }
}

export function AICopilot({ currentPage = 'dashboard', dashboardType }: { currentPage?: string; dashboardType?: string }) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string>();
  const [currentChatId, setCurrentChatId] = useState<string>('default');
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(true);
  const [chatHistories, setChatHistories] = useState<Record<string, ChatHistory>>({
    'default': {
      id: 'default',
      title: 'New Chat',
      lastMessage: "Hello! I'm your retail copilot...",
      timestamp: new Date(),
      sessionId: '',
      messages: [
        {
          id: '1',
          sender: 'ai',
          text: "Hello! I'm your retail copilot. I can help you understand your dashboard metrics, analyze trends, or answer questions about your inventory and sales. What would you like to know?",
          timestamp: new Date(Date.now() - 1000 * 60 * 5)
        }
      ]
    }
  });
  const [messages, setMessages] = useState<Message[]>(chatHistories['default'].messages);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from API on component mount
  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await fetchChatHistory(-1); // Get all chat history
      
      if (response.success && response.data.length > 0) {
        const historiesFromAPI: Record<string, ChatHistory> = {};
        
        response.data.forEach((item: ChatHistoryItem) => {
          historiesFromAPI[item.sessionId] = {
            id: item.sessionId,
            title: item.sessionTitle || 'Untitled Chat',
            lastMessage: item.sessionDescription || 'No description',
            timestamp: new Date(item.createdAt),
            sessionId: item.sessionId,
            messages: [] // Messages will be loaded when user switches to this chat
          };
        });
        
        // Keep the default chat and merge with API history
        setChatHistories({
          'default': chatHistories['default'],
          ...historiesFromAPI
        });
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      toast.error('Failed to load chat history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Update chat history when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      setChatHistories(prev => ({
        ...prev,
        [currentChatId]: {
          ...prev[currentChatId],
          messages: messages,
          lastMessage: lastMessage.text.substring(0, 50) + (lastMessage.text.length > 50 ? '...' : ''),
          timestamp: lastMessage.timestamp,
          title: prev[currentChatId].title === 'New Chat' && messages.length > 1 
            ? messages[1].text.substring(0, 30) + '...' 
            : prev[currentChatId].title
        }
      }));
    }
  }, [messages, currentChatId]);

  const createNewChat = () => {
    const newChatId = `chat-${Date.now()}`;
    const newChat: ChatHistory = {
      id: newChatId,
      title: 'New Chat',
      lastMessage: "Hello! I'm your retail copilot...",
      timestamp: new Date(),
      sessionId: '',
      messages: [
        {
          id: '1',
          sender: 'ai',
          text: "Hello! I'm your retail copilot. I can help you understand your dashboard metrics, analyze trends, or answer questions about your inventory and sales. What would you like to know?",
          timestamp: new Date()
        }
      ]
    };
    setChatHistories(prev => ({ ...prev, [newChatId]: newChat }));
    setCurrentChatId(newChatId);
    setMessages(newChat.messages);
    setSessionId(undefined);
  };

  const switchChat = async (chatId: string) => {
    setCurrentChatId(chatId);
    const chat = chatHistories[chatId];
    
    // If chat has messages already loaded, use them
    if (chat.messages && chat.messages.length > 0) {
      setMessages(chat.messages);
      setSessionId(chat.sessionId || undefined);
      return;
    }
    
    // If it's a historical chat with sessionId, load messages from API
    if (chat.sessionId && chat.sessionId !== '') {
      try {
        setIsLoadingMessages(true);
        const response = await fetchChatMessages(chat.sessionId, -1);
        
        if (response.success && response.data.length > 0) {
          // Transform API messages to Message format
          const transformedMessages: Message[] = [];
          
          response.data.forEach((item: ChatMessageItem, index: number) => {
            // Add user message
            transformedMessages.push({
              id: `${item.historyId}-user`,
              sender: 'user',
              text: item.prompt,
              timestamp: new Date(item.dateTime)
            });
            
            // Add AI response with visualization if available
            const aiMessage: Message = {
              id: item.historyId,
              sender: 'ai',
              text: item.response,
              timestamp: new Date(item.dateTime),
              sessionId: item.sessionId
            };
            
            // Add visualization if widgetDetails exist
            if (item.widgetDetails) {
              const viz = transformWidgetDetailsToVisualization(item.widgetDetails);
              if (viz) {
                aiMessage.visualizations = [viz];
              }
            }
            
            transformedMessages.push(aiMessage);
          });
          
          // Update chat history with loaded messages
          setChatHistories(prev => ({
            ...prev,
            [chatId]: {
              ...prev[chatId],
              messages: transformedMessages
            }
          }));
          
          setMessages(transformedMessages);
          setSessionId(chat.sessionId || undefined);
        } else {
          // No messages found, show default
          setMessages(chat.messages);
          setSessionId(chat.sessionId || undefined);
        }
      } catch (error) {
        console.error('Failed to load chat messages:', error);
        toast.error('Failed to load chat messages');
        setMessages(chat.messages);
        setSessionId(chat.sessionId || undefined);
      } finally {
        setIsLoadingMessages(false);
      }
    } else {
      // New chat or default chat
      setMessages(chat.messages);
      setSessionId(chat.sessionId || undefined);
    }
  };

  // Helper function to transform widgetDetails to visualization format
  const transformWidgetDetailsToVisualization = (widgetDetails: any): VisualizationData | null => {
    if (!widgetDetails) return null;
    
    const { widgetType, widgetData } = widgetDetails;
    
    if (widgetType === 'summary_card') {
      return {
        type: 'summaryCard',
        title: widgetData.title || 'Summary',
        data: [{
          title: widgetData.title || 'Summary',
          value: widgetData.value || '-',
          change: widgetData.change,
          trend: widgetData.trend
        }]
      };
    }
    
    if (widgetType === 'chart') {
      // Extract title from chart config if available
      const chartTitle = widgetData.title?.text || widgetData.title || 'Chart';
      return {
        type: 'chart',
        title: chartTitle,
        data: [widgetData] // Assuming widgetData is already in Highcharts format
      };
    }
    
    if (widgetType === 'grid') {
      return {
        type: 'grid',
        title: widgetData.title || 'Data Grid',
        data: [{
          title: widgetData.title || 'Data Grid',
          rows: widgetData.rows || []
        }]
      };
    }
    
    return null;
  };

  const handlePinWidget = async (widget: VisualizationData, widgetIndex: number) => {
    try {
      const pageNames: Record<string, string> = {
        'dashboard': 'Dashboard',
        'forecast': 'Demand Forecast',
        'pricing': 'Pricing Intelligence',
        'inventory': 'Inventory Risk',
        'market': 'Market Trends',
        'reports': 'Customer Insights'
      };
      
      const pageName = pageNames[currentPage] || 'Dashboard';
      
      const result = await pinWidgetToPage(widget, currentPage);
      
      if (result.success) {
        toast.success(`Widget pinned to ${pageName}`, {
          description: 'The widget has been added to the page',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Failed to pin widget:', error);
      toast.error('Failed to pin widget', {
        description: 'Please try again later',
        duration: 3000
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Call AI API with user message, conversation history, session ID, and dashboard type
      const aiResponse = await callAIAPI(userMessage, messages, sessionId, dashboardType);
      
      // Update session ID if provided
      if (aiResponse.sessionId) {
        setSessionId(aiResponse.sessionId);
        
        // Update the current chat's sessionId
        setChatHistories(prev => ({
          ...prev,
          [currentChatId]: {
            ...prev[currentChatId],
            sessionId: aiResponse.sessionId || ''
          }
        }));
      }
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiResponse.message,
        timestamp: new Date(),
        visualizations: aiResponse.data,
        sessionId: aiResponse.sessionId
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI API Error:', error);
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
        error: true
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex gap-4">
      {/* Chat History Sidebar */}
      <AnimatePresence>
        {!isHistoryCollapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-slate-100">
              <button
                onClick={createNewChat}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">
                Recent Chats
              </div>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                </div>
              ) : (
                <>
                  {Object.values(chatHistories).reverse().map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => switchChat(chat.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all ${
                        currentChatId === chat.id
                          ? 'bg-indigo-50 border border-indigo-200'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-1">
                        <MessageSquare className={`w-4 h-4 mt-0.5 shrink-0 ${
                          currentChatId === chat.id ? 'text-indigo-600' : 'text-slate-400'
                        }`} />
                        <h4 className={`text-sm font-semibold truncate ${
                          currentChatId === chat.id ? 'text-indigo-900' : 'text-slate-700'
                        }`}>
                          {chat.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 truncate pl-6">{chat.lastMessage}</p>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-1 pl-6">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(chat.timestamp)}
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Collapse Toggle Button */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <button
            onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
            className={`p-2 hover:bg-slate-200 rounded-lg transition-colors ${
              isHistoryCollapsed ? 'bg-indigo-100 text-indigo-600' : 'text-slate-600'
            }`}
            title={isHistoryCollapsed ? "Show chat history" : "Hide chat history"}
          >
            <History className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Retail Copilot</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Online
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
                <p className="text-slate-600 text-sm">Loading conversation...</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 
                ${msg.sender === 'ai' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-600'}`}>
                {msg.sender === 'ai' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              
              <div className={`${msg.visualizations && msg.visualizations.length > 0 ? 'max-w-[90%]' : 'max-w-[75%]'} space-y-2`}>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm
                  ${msg.sender === 'ai' 
                    ? msg.error 
                      ? 'bg-red-50 text-red-700 border border-red-200 rounded-tl-none' 
                      : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                    : 'bg-indigo-600 text-white rounded-tr-none'
                  }`}>
                  {msg.error && (
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-semibold text-xs">Connection Error</span>
                    </div>
                  )}
                  {msg.text}
                </div>

                {/* Render Visualizations */}
                {msg.visualizations && msg.visualizations.length > 0 && (
                  <div className="space-y-4 mt-4">
                    {msg.visualizations.map((viz, idx) => (
                      <div key={idx}>
                        {viz.type === 'summaryCard' && (
                          <div className="relative group">
                            {viz.title && (
                              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <Package className="w-4 h-4 text-indigo-600" />
                                {viz.title}
                              </h4>
                            )}
                            {/* Pin Button for Summary Card Group */}
                            {currentPage !== 'copilot' && (
                              <button
                                onClick={() => handlePinWidget(viz, idx)}
                                className="absolute top-0 right-0 z-10 p-2 bg-white border border-slate-200 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-50 hover:border-indigo-300"
                                title="Pin summary cards to current page"
                              >
                                <Pin className="w-4 h-4 text-slate-600 hover:text-indigo-600" />
                              </button>
                            )}
                            <div className="grid grid-cols-3 gap-3">
                              {viz.data.map((card, cardIdx) => (
                                <div key={cardIdx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                  <div className="text-xs text-slate-500 mb-1">{card.title}</div>
                                  <div className="text-2xl font-bold text-slate-900 mb-1">{card.value}</div>
                                  {card.change && (
                                    <div className={`text-xs flex items-center gap-1 ${
                                      card.trend === 'up' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      <TrendingUp className={`w-3 h-3 ${card.trend === 'down' ? 'rotate-180' : ''}`} />
                                      {card.change}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {viz.type === 'chart' && (
                          <div className="space-y-4">
                            {viz.data.map((chartConfig, chartIdx) => (
                              <div key={chartIdx} className="relative group bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                {/* Pin Button for Individual Chart */}
                                {currentPage !== 'copilot' && (
                                  <button
                                    onClick={() => handlePinWidget({
                                      type: 'chart',
                                      data: [chartConfig]
                                    }, chartIdx)}
                                    className="absolute top-2 right-2 z-10 p-2 bg-white border border-slate-200 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-50 hover:border-indigo-300"
                                    title="Pin chart to current page"
                                  >
                                    <Pin className="w-4 h-4 text-slate-600 hover:text-indigo-600" />
                                  </button>
                                )}
                                <HighchartsReact
                                  highcharts={Highcharts}
                                  options={chartConfig}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {viz.type === 'grid' && (
                          <div className="space-y-4">
                            {viz.data.map((gridConfig, gridIdx) => (
                              <div key={gridIdx} className="relative group">
                                {gridConfig.title && (
                                  <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4 text-indigo-600" />
                                    {gridConfig.title}
                                  </h4>
                                )}
                                {/* Pin Button for Individual Grid */}
                                {currentPage !== 'copilot' && (
                                  <button
                                    onClick={() => handlePinWidget({
                                      type: 'grid',
                                      data: [gridConfig]
                                    }, gridIdx)}
                                    className="absolute top-0 right-0 z-10 p-2 bg-white border border-slate-200 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-50 hover:border-indigo-300"
                                    title="Pin grid to current page"
                                  >
                                    <Pin className="w-4 h-4 text-slate-600 hover:text-indigo-600" />
                                  </button>
                                )}
                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                      <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                          {gridConfig.rows.length > 0 && Object.keys(gridConfig.rows[0]).map((key) => (
                                            <th key={key} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                              {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {gridConfig.rows.map((row, rowIdx) => (
                                          <tr key={rowIdx} className="hover:bg-slate-50 transition-colors">
                                            {Object.entries(row).map(([key, value], cellIdx) => (
                                              <td key={cellIdx} className="px-4 py-3 text-slate-700">
                                                {key === 'priority' ? (
                                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    value === 'High' ? 'bg-red-100 text-red-700' :
                                                    value === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-green-100 text-green-700'
                                                  }`}>
                                                    {value as string}
                                                  </span>
                                                ) : (
                                                  String(value)
                                                )}
                                              </td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {msg.sender === 'ai' && (
                  <div className="flex gap-2">
                    <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-green-600 transition-colors">
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-600 transition-colors">
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4"
            >
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0 text-indigo-600">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-1 h-12 w-16">
                <motion.div 
                  className="w-2 h-2 bg-slate-400 rounded-full"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                />
                <motion.div 
                  className="w-2 h-2 bg-slate-400 rounded-full"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div 
                  className="w-2 h-2 bg-slate-400 rounded-full"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-100">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about inventory, trends, or pricing..."
              className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all outline-none"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
