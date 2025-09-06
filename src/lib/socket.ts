import { Server } from 'socket.io';

interface UserPresence {
  userId: string;
  username: string;
  avatar?: string;
  workspaceId: string;
  status: 'online' | 'idle' | 'away';
  lastSeen: string;
  cursor?: {
    x: number;
    y: number;
    lastUpdate: string;
  };
}

interface SparkEditingSession {
  sparkId: string;
  userId: string;
  username: string;
  startedAt: string;
}

interface CollaborationRoom {
  workspaceId: string;
  users: Map<string, UserPresence>;
  activeSparks: Map<string, SparkEditingSession>;
}

const collaborationRooms = new Map<string, CollaborationRoom>();

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    let userPresence: UserPresence | null = null;
    let currentRoom: string | null = null;

    // User joins a workspace room
    socket.on('user_join', (data: { userId: string; username: string; avatar?: string; workspaceId: string }) => {
      const { userId, username, avatar, workspaceId } = data;
      
      // Leave previous room if any
      if (currentRoom) {
        socket.leave(currentRoom);
        handleUserLeave(currentRoom, socket.id);
      }

      // Join new room
      const roomKey = `workspace_${workspaceId}`;
      socket.join(roomKey);
      currentRoom = roomKey;

      // Create or get collaboration room
      if (!collaborationRooms.has(roomKey)) {
        collaborationRooms.set(roomKey, {
          workspaceId,
          users: new Map(),
          activeSparks: new Map()
        });
      }

      const room = collaborationRooms.get(roomKey)!;
      
      // Update user presence
      userPresence = {
        userId,
        username,
        avatar,
        workspaceId,
        status: 'online',
        lastSeen: new Date().toISOString()
      };

      room.users.set(socket.id, userPresence);

      // Broadcast user joined to room
      socket.to(roomKey).emit('user_joined', {
        user: userPresence,
        timestamp: new Date().toISOString()
      });

      // Send current room state to joining user
      socket.emit('room_state', {
        users: Array.from(room.users.values()),
        activeSparks: Array.from(room.activeSparks.values()),
        timestamp: new Date().toISOString()
      });

      console.log(`User ${username} joined workspace ${workspaceId}`);
    });

    // User leaves workspace
    socket.on('user_leave', (data: { workspaceId: string }) => {
      const roomKey = `workspace_${data.workspaceId}`;
      handleUserLeave(roomKey, socket.id);
      socket.leave(roomKey);
      currentRoom = null;
    });

    // Presence update (online, idle, away)
    socket.on('presence_update', (data: { status: 'online' | 'idle' | 'away' }) => {
      if (currentRoom && userPresence) {
        const room = collaborationRooms.get(currentRoom);
        if (room && room.users.has(socket.id)) {
          userPresence.status = data.status;
          userPresence.lastSeen = new Date().toISOString();
          room.users.set(socket.id, userPresence);

          // Broadcast presence update
          socket.to(currentRoom).emit('presence_updated', {
            userId: userPresence.userId,
            status: data.status,
            lastSeen: userPresence.lastSeen,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    // Cursor position update
    socket.on('cursor_update', (data: { x: number; y: number }) => {
      if (currentRoom && userPresence) {
        const room = collaborationRooms.get(currentRoom);
        if (room && room.users.has(socket.id)) {
          userPresence.cursor = {
            x: data.x,
            y: data.y,
            lastUpdate: new Date().toISOString()
          };
          room.users.set(socket.id, userPresence);

          // Broadcast cursor update to room members
          socket.to(currentRoom).emit('cursor_updated', {
            userId: userPresence.userId,
            username: userPresence.username,
            cursor: userPresence.cursor,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    // Spark editing started
    socket.on('spark_editing_start', (data: { sparkId: string }) => {
      if (currentRoom && userPresence) {
        const room = collaborationRooms.get(currentRoom);
        if (room) {
          const editingSession: SparkEditingSession = {
            sparkId: data.sparkId,
            userId: userPresence.userId,
            username: userPresence.username,
            startedAt: new Date().toISOString()
          };

          room.activeSparks.set(`${data.sparkId}_${socket.id}`, editingSession);

          // Broadcast editing started
          socket.to(currentRoom).emit('spark_editing_started', {
            ...editingSession,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    // Spark editing ended
    socket.on('spark_editing_end', (data: { sparkId: string }) => {
      if (currentRoom && userPresence) {
        const room = collaborationRooms.get(currentRoom);
        if (room) {
          const sessionKey = `${data.sparkId}_${socket.id}`;
          const editingSession = room.activeSparks.get(sessionKey);
          
          if (editingSession) {
            room.activeSparks.delete(sessionKey);

            // Broadcast editing ended
            socket.to(currentRoom).emit('spark_editing_ended', {
              sparkId: data.sparkId,
              userId: userPresence.userId,
              username: userPresence.username,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    });

    // Spark content change (real-time collaboration)
    socket.on('spark_content_change', (data: { 
      sparkId: string; 
      content: string; 
      changeType: 'title' | 'description' | 'content' | 'status' | 'position';
      position?: { x: number; y: number };
    }) => {
      if (currentRoom && userPresence) {
        // Broadcast content change to all room members except sender
        socket.to(currentRoom).emit('spark_content_changed', {
          sparkId: data.sparkId,
          content: data.content,
          changeType: data.changeType,
          position: data.position,
          userId: userPresence.userId,
          username: userPresence.username,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      if (currentRoom) {
        handleUserLeave(currentRoom, socket.id);
      }
    });

    // Notification handler
    socket.on('notification', (data: any) => {
      // Broadcast notification to the specific user
      if (currentRoom && userPresence) {
        socket.to(currentRoom).emit('notification_received', {
          ...data,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Comment system events
    socket.on('join_entity', (data: { entityId: string; entityType: string }) => {
      const entityRoom = `entity_${data.entityType}_${data.entityId}`;
      socket.join(entityRoom);
      console.log(`Socket ${socket.id} joined entity room: ${entityRoom}`);
    });

    socket.on('leave_entity', (data: { entityId: string; entityType: string }) => {
      const entityRoom = `entity_${data.entityType}_${data.entityId}`;
      socket.leave(entityRoom);
      console.log(`Socket ${socket.id} left entity room: ${entityRoom}`);
    });

    // Comment typing indicators
    socket.on('comment_typing_start', (data: { entityId: string; entityType: string; parentId?: string }) => {
      if (userPresence) {
        const entityRoom = `entity_${data.entityType}_${data.entityId}`;
        socket.to(entityRoom).emit('user_typing', {
          userId: userPresence.userId,
          username: userPresence.username,
          entityId: data.entityId,
          entityType: data.entityType,
          parentId: data.parentId,
          timestamp: new Date().toISOString()
        });
      }
    });

    socket.on('comment_typing_end', (data: { entityId: string; entityType: string; parentId?: string }) => {
      if (userPresence) {
        const entityRoom = `entity_${data.entityType}_${data.entityId}`;
        socket.to(entityRoom).emit('user_stopped_typing', {
          userId: userPresence.userId,
          entityId: data.entityId,
          entityType: data.entityType,
          parentId: data.parentId,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Legacy message handler for backwards compatibility
    socket.on('message', (msg: { text: string; senderId: string }) => {
      socket.emit('message', {
        text: `Echo: ${msg.text}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
      });
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to collaboration server',
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    });
  });

  // Helper function to handle user leaving
  function handleUserLeave(roomKey: string, socketId: string) {
    const room = collaborationRooms.get(roomKey);
    if (room) {
      const user = room.users.get(socketId);
      if (user) {
        // Remove user from room
        room.users.delete(socketId);

        // Remove any active spark editing sessions for this user
        const userSparkSessions = Array.from(room.activeSparks.entries())
          .filter(([key]) => key.endsWith(`_${socketId}`));
        
        for (const [sessionKey, session] of userSparkSessions) {
          room.activeSparks.delete(sessionKey);
          
          // Broadcast editing ended
          io.to(roomKey).emit('spark_editing_ended', {
            sparkId: session.sparkId,
            userId: session.userId,
            username: session.username,
            timestamp: new Date().toISOString()
          });
        }

        // Broadcast user left
        io.to(roomKey).emit('user_left', {
          userId: user.userId,
          username: user.username,
          timestamp: new Date().toISOString()
        });

        // Clean up empty rooms
        if (room.users.size === 0) {
          collaborationRooms.delete(roomKey);
        }

        console.log(`User ${user.username} left workspace ${user.workspaceId}`);
      }
    }
  }
};