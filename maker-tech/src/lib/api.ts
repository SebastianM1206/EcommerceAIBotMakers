import { buildApiUrl, API_ENDPOINTS } from './config';

// Tipos para la API del backend
export interface ChatQueryRequest {
  human_query: string;
}

export interface ChatQueryResponse {
  answer: string;
  sql_query?: string;
  execution_time?: number;
}

export interface ApiError {
  error: string;
  details?: string;
  timestamp?: string;
}

// Clase para manejar errores de la API
export class ChatApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: string
  ) {
    super(message);
    this.name = 'ChatApiError';
  }
}

// Servicio para comunicarse con el backend
export class ChatApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = buildApiUrl('');
  }

  // Método principal para enviar consultas al chatbot
  async sendQuery(humanQuery: string): Promise<ChatQueryResponse> {
    if (!humanQuery.trim()) {
      throw new ChatApiError('Query cannot be empty');
    }

    try {
      const url = buildApiUrl(API_ENDPOINTS.query);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          human_query: humanQuery
        } as ChatQueryRequest),
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`
        }));
        
        throw new ChatApiError(
          errorData.error || 'Unknown server error',
          response.status,
          errorData.details
        );
      }

      const data: ChatQueryResponse = await response.json();
      return data;

    } catch (error) {
      if (error instanceof ChatApiError) {
        throw error;
      }

      // Network or parsing error
      if (error instanceof TypeError) {
        throw new ChatApiError(
          'Could not connect to server. Please check your internet connection.',
          0,
          error.message
        );
      }

      throw new ChatApiError(
        'Unexpected error while processing query',
        0,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  // Verificar estado del backend
  async checkHealth(): Promise<boolean> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.health);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

// Instancia singleton del servicio
export const chatApiService = new ChatApiService(); 