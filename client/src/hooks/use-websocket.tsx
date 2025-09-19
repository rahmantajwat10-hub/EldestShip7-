import { useState, useEffect, useRef, useCallback } from "react";

interface UseWebSocketProps {
  url?: string;
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  shouldReconnect?: boolean;
  reconnectInterval?: number;
}

export function useWebSocket(props?: UseWebSocketProps) {
  const {
    url,
    onOpen,
    onMessage,
    onClose,
    onError,
    shouldReconnect = true,
    reconnectInterval = 3000,
  } = props || {};

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"Connecting" | "Open" | "Closing" | "Closed">("Closed");
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const socketRef = useRef<WebSocket | null>(null);

  // Generate WebSocket URL based on current location
  const getWebSocketUrl = useCallback(() => {
    if (url) return url;
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    return wsUrl;
  }, [url]);

  const connect = useCallback(() => {
    try {
      const wsUrl = getWebSocketUrl();
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;
      setSocket(ws);

      ws.onopen = (event) => {
        setConnectionStatus("Open");
        onOpen?.(event);
      };

      ws.onmessage = (event) => {
        setLastMessage(event);
        onMessage?.(event);
      };

      ws.onclose = (event) => {
        setConnectionStatus("Closed");
        setSocket(null);
        socketRef.current = null;
        onClose?.(event);

        // Attempt to reconnect if enabled and not a clean close
        if (shouldReconnect && !event.wasClean) {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (socketRef.current?.readyState === WebSocket.CLOSED || !socketRef.current) {
              connect();
            }
          }, reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        setConnectionStatus("Closed");
        onError?.(event);
      };

      setConnectionStatus("Connecting");
    } catch (error) {
      console.error("WebSocket connection error:", error);
      setConnectionStatus("Closed");
    }
  }, [getWebSocketUrl, onOpen, onMessage, onClose, onError, shouldReconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      setConnectionStatus("Closing");
      socketRef.current.close(1000, "Disconnected by user");
    }
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const messageString = typeof message === "string" ? message : JSON.stringify(message);
      socketRef.current.send(messageString);
      return true;
    } else {
      console.warn("WebSocket is not connected. Message not sent:", message);
      return false;
    }
  }, []);

  const sendJsonMessage = useCallback((message: any) => {
    return sendMessage(JSON.stringify(message));
  }, [sendMessage]);

  // Connect on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close(1000, "Component unmounted");
      }
    };
  }, [connect]);

  // Handle page visibility changes to maintain connection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, don't reconnect automatically
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      } else {
        // Page is visible, reconnect if needed
        if (shouldReconnect && (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED)) {
          connect();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [connect, shouldReconnect]);

  return {
    socket,
    lastMessage,
    connectionStatus,
    sendMessage,
    sendJsonMessage,
    connect,
    disconnect,
  };
}
