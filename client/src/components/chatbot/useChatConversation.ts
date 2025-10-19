import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ConversationState,
  ConversationStage,
  Message,
} from './types';
import { detectCrisisKeywords } from './crisisDetection';

/**
 * Main conversation state management hook
 * Handles message flow, stage progression, and crisis detection
 *
 * Now with REAL API integration!
 */
export function useChatConversation() {
  const queryClient = useQueryClient();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [escalationRequested, setEscalationRequested] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Initialize conversation on mount
  const { mutate: startConversation } = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for session cookies
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setConversationId(data.conversationId);
      queryClient.setQueryData(['chatConversation', data.conversationId], data);
    },
    onError: (error) => {
      console.error('Failed to start conversation:', error);
    },
  });

  // Start conversation automatically on mount
  useEffect(() => {
    if (!conversationId) {
      startConversation();
    }
  }, [conversationId, startConversation]);

  // Fetch conversation data
  const { data: conversationData } = useQuery({
    queryKey: ['chatConversation', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;

      const response = await fetch(`/api/chat/conversation/${conversationId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversation');
      }

      return response.json();
    },
    enabled: !!conversationId,
    refetchOnWindowFocus: false,
  });

  // Send message mutation
  const { mutate: sendMessageMutation } = useMutation({
    mutationFn: async (content: string) => {
      if (!conversationId) {
        throw new Error('No conversation ID');
      }

      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ conversationId, content }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.json();
    },
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: (data) => {
      // Refetch conversation to get updated messages
      queryClient.invalidateQueries({ queryKey: ['chatConversation', conversationId] });

      // Check if crisis was detected
      if (data.crisisDetected) {
        setCrisisDetected(true);
      }

      setIsTyping(false);
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      setIsTyping(false);
    },
  });

  // Human escalation mutation
  const { mutate: escalateMutation } = useMutation({
    mutationFn: async (reason?: string) => {
      if (!conversationId) {
        throw new Error('No conversation ID');
      }

      const response = await fetch('/api/chat/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ conversationId, reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to escalate conversation');
      }

      return response.json();
    },
    onSuccess: () => {
      setEscalationRequested(true);
      // Refetch to get escalation confirmation message
      queryClient.invalidateQueries({ queryKey: ['chatConversation', conversationId] });
    },
    onError: (error) => {
      console.error('Failed to escalate:', error);
    },
  });

  // Send message with client-side crisis detection
  const sendMessage = useCallback(
    (content: string) => {
      // Client-side crisis detection for immediate UI feedback
      const clientCrisisDetected = detectCrisisKeywords(content);
      if (clientCrisisDetected) {
        setCrisisDetected(true);
      }

      // Send to backend (which also does server-side detection)
      sendMessageMutation(content);
    },
    [sendMessageMutation]
  );

  // Request human escalation
  const requestHumanEscalation = useCallback(
    (reason?: string) => {
      escalateMutation(reason);
    },
    [escalateMutation]
  );

  // Extract data from conversation
  // Handle both response formats:
  // - POST /api/chat/start returns: { conversationId, messages, stage }
  // - GET /api/chat/conversation/:id returns: { conversation, messages, preferences }

  // Transform messages from API format to frontend Message type
  const messages: Message[] = (conversationData?.messages || []).map((msg: any) => ({
    ...msg,
    timestamp: new Date(msg.createdAt || msg.timestamp), // Convert createdAt to timestamp
  }));

  const stage: ConversationStage = conversationData?.conversation?.stage || conversationData?.stage || 'welcome';
  const userPreferences = conversationData?.preferences || {};

  return {
    conversationId,
    messages,
    stage,
    userPreferences,
    isTyping,
    crisisDetected,
    escalationRequested,
    sendMessage,
    requestHumanEscalation,
  };
}
