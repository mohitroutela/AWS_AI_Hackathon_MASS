/**
 * Chatbot API Service
 * Handles communication with the chatbot endpoint
 */

export interface ChatbotRequest {
  message: string;
  session_id?: string; // Optional - only sent after first message
  dashboard_type?: string; // Optional - dashboard type for context
}

export interface ChatbotResponse {
  insight: string; // The AI's text response
  widget_type: 'grid' | 'chart' | 'summary_card' | 'text' | null;
  chart_type: string | null;
  session_id: string;
  context_injected: boolean;
  data: any[]; // Widget data
  sql_query?: string;
}

export interface ChatHistoryItem {
  sessionTitle: string;
  sessionDescription: string;
  userId: string;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatHistoryResponse {
  success: boolean;
  message: string;
  data: ChatHistoryItem[];
  total: number;
}

export interface ChatMessageItem {
  prompt: string;
  response: string;
  sqlQuery: string | null;
  widgetDetails: {
    widgetId: string;
    widgetType: string;
    widgetData: any;
  } | null;
  historyId: string;
  sessionId: string;
  dateTime: string;
}

export interface ChatMessagesResponse {
  success: boolean;
  message: string;
  data: ChatMessageItem[];
  total: number;
}

// AWS API Gateway endpoints - Direct calls (no proxy)
const CHATBOT_API_URL = 'https://we6jph4kv1.execute-api.us-east-1.amazonaws.com/Prod/chat';
const CHAT_HISTORY_API_URL = 'https://we6jph4kv1.execute-api.us-east-1.amazonaws.com/Prod/api/chat-details';
const CHAT_MESSAGES_API_URL = 'https://we6jph4kv1.execute-api.us-east-1.amazonaws.com/Prod/api/chat-history/session';

/**
 * Fetch chat history for a user
 */
export async function fetchChatHistory(limit: number = -1): Promise<ChatHistoryResponse> {
  try {
    const url = `${CHAT_HISTORY_API_URL}/?limit=${limit}`;
    const response = await fetch(url, {
      headers: {
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch chat history: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
}

/**
 * Fetch chat messages for a specific session
 */
export async function fetchChatMessages(sessionId: string, limit: number = -1): Promise<ChatMessagesResponse> {
  try {
    const url = `${CHAT_MESSAGES_API_URL}/${sessionId}?limit=${limit}`;
    const response = await fetch(url, {
      headers: {
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch chat messages: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    throw error;
  }
}

/**
 * Send message to chatbot and get response
 * First message: No session_id sent
 * Follow-up messages: Include session_id from previous response
 * Optionally include dashboard_type for context
 */
export async function sendChatMessage(request: ChatbotRequest): Promise<ChatbotResponse> {
  try {
    // Build request body
    const requestBody: any = {
      message: request.message,
    };

    // Only include session_id if it exists (for follow-up messages)
    if (request.session_id) {
      requestBody.session_id = request.session_id;
    }

    // Include dashboard_type if provided
    if (request.dashboard_type) {
      requestBody.dashboard_type = request.dashboard_type;
    }

    console.log('Sending chat message:', requestBody);

    const response = await fetch(CHATBOT_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Received chat response:', data);
    
    return data;
  } catch (error) {
    console.error('Failed to send chat message:', error);
    throw error;
  }
}

/**
 * Convert chatbot response to visualization format for AICopilot
 */
export function convertToVisualizationFormat(response: ChatbotResponse) {
  const visualizations: any[] = [];

  // Normalize widget_type (handle both snake_case and camelCase)
  const widgetType = response.widget_type?.toLowerCase().replace('_', '');

  // Handle different widget types
  switch (widgetType) {
    case 'grid':
      visualizations.push({
        type: 'grid',
        data: [{
          title: response.insight,
          rows: response.data,
        }],
      });
      break;

    case 'chart':
      // Data is already in Highcharts format from API
      visualizations.push({
        type: 'chart',
        data: response.data, // Use data directly as it's already Highcharts config
      });
      break;

    case 'summarycard':
      // Data is already in the correct format from API
      visualizations.push({
        type: 'summaryCard',
        data: response.data,
      });
      break;

    case 'text':
    case null:
      // No visualization, just text response
      break;

    default:
      console.warn(`Unknown widget type: ${response.widget_type}`);
  }

  return {
    message: response.insight,
    data: visualizations.length > 0 ? visualizations : undefined,
    sessionId: response.session_id,
  };
}

