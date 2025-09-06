import { Server } from 'socket.io';
import { notificationService } from './NotificationService';
import { NotificationChannel, NotificationPriority, NotificationType } from '@/types/notification';

export class SocketNotificationIntegration {
  private static instance: SocketNotificationIntegration;
  private io: Server | null = null;

  private constructor() {
    this.setupNotificationServiceListeners();
  }

  static getInstance(): SocketNotificationIntegration {
    if (!SocketNotificationIntegration.instance) {
      SocketNotificationIntegration.instance = new SocketNotificationIntegration();
    }
    return SocketNotificationIntegration.instance;
  }

  initialize(io: Server): void {
    this.io = io;
    this.setupSocketEventListeners();
  }

  private setupNotificationServiceListeners(): void {
    // Listen to notification events from the service
    notificationService.on('delivery_completed', ({ notification, delivery }) => {
      if (delivery.channel === NotificationChannel.IN_APP && delivery.status === 'delivered') {
        this.broadcastNotificationToUser(notification.userId, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          priority: notification.priority,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Listen to system events that should trigger notifications
    notificationService.on('notification_event', (event) => {
      console.log('Notification event received:', event.type, event.userId);
    });
  }

  private setupSocketEventListeners(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      // Listen for spark-related events that should trigger notifications
      socket.on('spark_content_change', (data) => {
        this.handleSparkContentChange(socket, data);
      });

      socket.on('collaboration_invite_sent', (data) => {
        this.handleCollaborationInvite(socket, data);
      });

      socket.on('achievement_unlocked', (data) => {
        this.handleAchievementUnlocked(socket, data);
      });

      // Handle notification acknowledgments
      socket.on('notification_acknowledged', (data: { notificationId: string; userId: string }) => {
        console.log('Notification acknowledged:', data.notificationId, 'by user:', data.userId);
        // You could update delivery status or analytics here
      });
    });
  }

  private async handleSparkContentChange(socket: any, data: {
    sparkId: string;
    content: string;
    changeType: string;
    userId: string;
    username: string;
    sparkTitle?: string;
  }): Promise<void> {
    // Only trigger notifications for significant changes
    const significantChanges = ['status', 'title'];
    if (!significantChanges.includes(data.changeType)) {
      return;
    }

    await notificationService.emitEvent('spark_updated', data.userId, {
      sparkId: data.sparkId,
      sparkTitle: data.sparkTitle || `Spark ${data.sparkId}`,
      changeType: data.changeType,
      content: data.content,
      username: data.username
    });
  }

  private async handleCollaborationInvite(socket: any, data: {
    sparkId: string;
    sparkTitle: string;
    inviterId: string;
    inviterName: string;
    invitedUserId: string;
  }): Promise<void> {
    await notificationService.emitEvent('collaboration_invite', data.invitedUserId, {
      sparkId: data.sparkId,
      sparkTitle: data.sparkTitle,
      inviterId: data.inviterId,
      inviterName: data.inviterName
    });
  }

  private async handleAchievementUnlocked(socket: any, data: {
    userId: string;
    achievementId: string;
    achievementName: string;
  }): Promise<void> {
    await notificationService.emitEvent('achievement_unlocked', data.userId, {
      achievementId: data.achievementId,
      achievementName: data.achievementName
    });
  }

  // Method to broadcast notifications to specific users via Socket.IO
  private broadcastNotificationToUser(userId: string, notification: any): void {
    if (!this.io) return;

    // Find all sockets for this user (they might have multiple sessions)
    this.io.sockets.sockets.forEach((socket) => {
      const socketUserId = (socket as any).userId; // Assuming you set userId on socket
      if (socketUserId === userId) {
        socket.emit('notification_received', notification);
      }
    });
  }

  // Method to broadcast notifications to workspace rooms
  broadcastNotificationToWorkspace(workspaceId: string, notification: any): void {
    if (!this.io) return;

    const roomKey = `workspace_${workspaceId}`;
    this.io.to(roomKey).emit('notification_received', notification);
  }

  // Helper method to trigger notifications programmatically
  async triggerSparkUpdate(sparkId: string, userId: string, sparkTitle: string, changeType: string): Promise<void> {
    await notificationService.emitEvent('spark_updated', userId, {
      sparkId,
      sparkTitle,
      changeType
    });
  }

  async triggerAchievementUnlocked(userId: string, achievementId: string, achievementName: string): Promise<void> {
    await notificationService.emitEvent('achievement_unlocked', userId, {
      achievementId,
      achievementName
    });
  }

  async triggerCollaborationAction(userId: string, sparkId: string, sparkTitle: string, userName: string, action: string): Promise<void> {
    await notificationService.emitEvent('collaboration_action', userId, {
      sparkId,
      sparkTitle,
      userId,
      userName,
      action
    });
  }

  // Utility method to create immediate notifications
  async createImmediateNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    channels: NotificationChannel[] = [NotificationChannel.IN_APP],
    priority: NotificationPriority = NotificationPriority.MEDIUM,
    data?: Record<string, any>
  ): Promise<string> {
    return notificationService.createNotification({
      userId,
      type,
      title,
      message,
      channels,
      priority,
      data
    });
  }

  // Comment system specific methods
  broadcastToEntity(entityId: string, entityType: string, event: string, data: any): void {
    if (!this.io) return;

    const entityRoom = `entity_${entityType}_${entityId}`;
    this.io.to(entityRoom).emit(event, data);
    console.log(`Broadcasting ${event} to entity room: ${entityRoom}`);
  }

  notifyUser(userId: string, event: string, data: any): void {
    if (!this.io) return;

    // Find all sockets for this user
    this.io.sockets.sockets.forEach((socket) => {
      const socketUserId = (socket as any).userId;
      if (socketUserId === userId) {
        socket.emit(event, data);
      }
    });
  }
}

export const socketNotificationIntegration = SocketNotificationIntegration.getInstance();