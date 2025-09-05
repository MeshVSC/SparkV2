import { io, Socket } from 'socket.io-client';

export interface SocketEvents {
  // Connection events
  connected: (data: { message: string; socketId: string; timestamp: string }) => void;
  disconnect: () => void;
  connect_error: (error: Error) => void;
  reconnect: (attemptNumber: number) => void;
  reconnect_error: (error: Error) => void;
  reconnect_failed: () => void;

  // User presence events
  user_joined: (data: { user: UserPresence; timestamp: string }) => void;
  user_left: (data: { userId: string; username: string; timestamp: string }) => void;
  presence_updated: (data: { userId: string; status: 'online' | 'idle' | 'away'; lastSeen: string; timestamp: string }) => void;
  room_state: (data: { users: UserPresence[]; activeSparks: SparkEditingSession[]; timestamp: string }) => void;

  // Spark collaboration events
  spark_editing_started: (data: { sparkId: string; userId: string; username: string; startedAt: string; timestamp: string }) => void;
  spark_editing_ended: (data: { sparkId: string; userId: string; username: string; timestamp: string }) => void;
  spark_content_changed: (data: {
    sparkId: string;
    content: string;
    changeType: 'title' | 'description' | 'content' | 'status' | 'position';
    position?: { x: number; y: number };
    userId: string;
    username: string;
    timestamp: string;
  }) => void;

  // Notification events
  notification_received: (data: {
    id: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
    timestamp: string;
  }) => void;

  // Legacy events
  message: (data: { text: string; senderId: string; timestamp: string }) => void;
}

export interface UserPresence {
  userId: string;
  username: string;
  avatar?: string;
  workspaceId: string;
  status: 'online' | 'idle' | 'away';
  lastSeen: string;
}

export interface SparkEditingSession {
  sparkId: string;
  userId: string;
  username: string;
  startedAt: string;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

export class SocketClient {
  private socket: Socket | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private eventListeners: Partial<SocketEvents> = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private currentUser: UserPresence | null = null;
  private idleTimer: NodeJS.Timeout | null = null;
  private awayTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.setupActivityTracking();
  }

  connect(url = '/api/socketio'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.connectionStatus = 'connecting';
      this.notifyStatusChange();

      this.socket = io(url, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.setupSocketEventHandlers();

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
        this.connectionStatus = 'connected';
        this.reconnectAttempts = 0;
        this.notifyStatusChange();
        this.startPresenceTracking();
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.connectionStatus = 'error';
        this.notifyStatusChange();
        this.eventListeners.connect_error?.(error);
        reject(error);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionStatus = 'disconnected';
    this.currentUser = null;
    this.clearPresenceTimers();
    this.notifyStatusChange();
  }

  // Connection status
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Event listeners
  on<K extends keyof SocketEvents>(event: K, listener: SocketEvents[K]): void {
    this.eventListeners[event] = listener;
  }

  off<K extends keyof SocketEvents>(event: K): void {
    delete this.eventListeners[event];
  }

  // User presence methods
  joinWorkspace(userData: { userId: string; username: string; avatar?: string; workspaceId: string }): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot join workspace');
      return;
    }

    this.currentUser = {
      ...userData,
      status: 'online',
      lastSeen: new Date().toISOString()
    };

    this.socket.emit('user_join', userData);
  }

  leaveWorkspace(workspaceId: string): void {
    if (!this.socket?.connected) return;
    
    this.socket.emit('user_leave', { workspaceId });
    this.currentUser = null;
  }

  updatePresence(status: 'online' | 'idle' | 'away'): void {
    if (!this.socket?.connected || !this.currentUser) return;
    
    this.currentUser.status = status;
    this.socket.emit('presence_update', { status });
  }

  // Spark collaboration methods
  startEditingSpark(sparkId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('spark_editing_start', { sparkId });
  }

  endEditingSpark(sparkId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('spark_editing_end', { sparkId });
  }

  broadcastSparkChange(data: {
    sparkId: string;
    content: string;
    changeType: 'title' | 'description' | 'content' | 'status' | 'position';
    position?: { x: number; y: number };
  }): void {
    if (!this.socket?.connected) return;
    this.socket.emit('spark_content_change', data);
  }

  // Legacy method
  sendMessage(text: string, senderId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('message', { text, senderId });
  }

  private setupSocketEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.connectionStatus = 'disconnected';
      this.clearPresenceTimers();
      this.notifyStatusChange();
      this.eventListeners.disconnect?.();

      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect automatically
        return;
      }

      // Auto-reconnect for client-side disconnects
      this.attemptReconnect();
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.connectionStatus = 'connected';
      this.reconnectAttempts = 0;
      this.notifyStatusChange();
      this.startPresenceTracking();
      
      // Rejoin workspace if we were in one
      if (this.currentUser) {
        const { userId, username, avatar, workspaceId } = this.currentUser;
        this.joinWorkspace({ userId, username, avatar, workspaceId });
      }
      
      this.eventListeners.reconnect?.(attemptNumber);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
      this.eventListeners.reconnect_error?.(error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
      this.connectionStatus = 'error';
      this.notifyStatusChange();
      this.eventListeners.reconnect_failed?.();
    });

    // Application events
    Object.keys(this.eventListeners).forEach(eventName => {
      this.socket!.on(eventName, (...args: any[]) => {
        const listener = this.eventListeners[eventName as keyof SocketEvents] as any;
        listener?.(...args);
      });
    });

    // Register all possible events
    this.socket.on('connected', (data) => this.eventListeners.connected?.(data));
    this.socket.on('user_joined', (data) => this.eventListeners.user_joined?.(data));
    this.socket.on('user_left', (data) => this.eventListeners.user_left?.(data));
    this.socket.on('presence_updated', (data) => this.eventListeners.presence_updated?.(data));
    this.socket.on('room_state', (data) => this.eventListeners.room_state?.(data));
    this.socket.on('spark_editing_started', (data) => this.eventListeners.spark_editing_started?.(data));
    this.socket.on('spark_editing_ended', (data) => this.eventListeners.spark_editing_ended?.(data));
    this.socket.on('spark_content_changed', (data) => this.eventListeners.spark_content_changed?.(data));
    this.socket.on('notification_received', (data) => this.eventListeners.notification_received?.(data));
    this.socket.on('message', (data) => this.eventListeners.message?.(data));
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.connectionStatus = 'error';
      this.notifyStatusChange();
      return;
    }

    this.connectionStatus = 'reconnecting';
    this.notifyStatusChange();
    this.reconnectAttempts++;

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
    }, delay);
  }

  private setupActivityTracking(): void {
    if (typeof window === 'undefined') return;

    const resetTimers = () => {
      this.clearPresenceTimers();
      
      if (this.currentUser?.status !== 'online') {
        this.updatePresence('online');
      }

      // Set idle after 5 minutes of inactivity
      this.idleTimer = setTimeout(() => {
        if (this.currentUser?.status === 'online') {
          this.updatePresence('idle');
        }

        // Set away after 15 minutes of inactivity
        this.awayTimer = setTimeout(() => {
          if (this.currentUser?.status === 'idle') {
            this.updatePresence('away');
          }
        }, 10 * 60 * 1000); // 10 more minutes for away
      }, 5 * 60 * 1000); // 5 minutes for idle
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, resetTimers, { passive: true });
    });

    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        resetTimers();
      }
    });
  }

  private clearPresenceTimers(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    if (this.awayTimer) {
      clearTimeout(this.awayTimer);
      this.awayTimer = null;
    }
  }

  private startPresenceTracking(): void {
    if (this.currentUser) {
      this.updatePresence('online');
    }
  }

  private notifyStatusChange(): void {
    // This could be extended to notify listeners about connection status changes
    console.log('Connection status changed:', this.connectionStatus);
  }
}

// Singleton instance
export const socketClient = new SocketClient();