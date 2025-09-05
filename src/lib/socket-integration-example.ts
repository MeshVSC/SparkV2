// Example usage of the realtime collaboration system
import React, { useEffect, useState } from 'react';
import { useRealtimeCollaboration } from '@/hooks/use-realtime-collaboration';
import { useSession } from 'next-auth/react';

export const ExampleSparkCollaborationComponent = () => {
  const { data: session } = useSession();
  const [editingSparkId, setEditingSparkId] = useState<string | null>(null);
  
  const {
    connectionStatus,
    isConnected,
    connectedUsers,
    isSparkBeingEdited,
    getSparkEditors,
    startEditingSpark,
    endEditingSpark,
    broadcastSparkChange
  } = useRealtimeCollaboration({
    workspaceId: 'default-workspace', // Replace with actual workspace ID
    userId: session?.user?.id,
    username: session?.user?.name || 'Anonymous',
    avatar: session?.user?.image,
    autoConnect: true,
    
    // Event handlers
    onUserJoined: (user) => {
      console.log(`${user.username} joined the workspace`);
      // Show notification toast
    },
    
    onUserLeft: (userId, username) => {
      console.log(`${username} left the workspace`);
      // Show notification toast
    },
    
    onSparkEditingStarted: (sparkId, userId, username) => {
      console.log(`${username} started editing spark ${sparkId}`);
      // Update UI to show editing indicator
    },
    
    onSparkEditingEnded: (sparkId, userId, username) => {
      console.log(`${username} stopped editing spark ${sparkId}`);
      // Update UI to remove editing indicator
    },
    
    onSparkContentChanged: (data) => {
      console.log(`Spark ${data.sparkId} content changed by ${data.username}`);
      // Update the spark content in your state/store
      // This is where you'd sync the changes with your local state
    }
  });

  // Handle starting to edit a spark
  const handleStartEditing = (sparkId: string) => {
    setEditingSparkId(sparkId);
    startEditingSpark(sparkId);
  };

  // Handle ending spark editing
  const handleEndEditing = (sparkId: string) => {
    if (editingSparkId === sparkId) {
      setEditingSparkId(null);
      endEditingSpark(sparkId);
    }
  };

  // Handle content changes (debounced)
  const handleContentChange = (sparkId: string, content: string, changeType: 'title' | 'description' | 'content') => {
    broadcastSparkChange({
      sparkId,
      content,
      changeType
    });
  };

  // Handle position changes
  const handlePositionChange = (sparkId: string, position: { x: number; y: number }) => {
    broadcastSparkChange({
      sparkId,
      content: '', // Not relevant for position changes
      changeType: 'position',
      position
    });
  };

  return React.createElement(
    'div',
    null,
    React.createElement(
      'div',
      { className: "mb-4" },
      `Status: ${connectionStatus} | Connected Users: ${connectedUsers.length}`
    ),
    React.createElement(
      'div',
      { className: "border p-4 rounded" },
      React.createElement(
        'div',
        { className: "flex items-center justify-between mb-2" },
        React.createElement('h3', null, 'Example Spark'),
        isSparkBeingEdited('spark-123') && React.createElement(
          'div',
          { className: "text-sm text-yellow-600" },
          `Being edited by: ${getSparkEditors('spark-123').map(s => s.username).join(', ')}`
        )
      ),
      React.createElement('textarea', {
        className: "w-full p-2 border rounded",
        placeholder: "Spark content...",
        onFocus: () => handleStartEditing('spark-123'),
        onBlur: () => handleEndEditing('spark-123'),
        onChange: (e: any) => handleContentChange('spark-123', e.target.value, 'content')
      })
    ),
    React.createElement(
      'div',
      { className: "mt-4" },
      React.createElement('h4', null, 'Connected Users:'),
      React.createElement(
        'ul',
        null,
        connectedUsers.map(user =>
          React.createElement(
            'li',
            { 
              key: user.userId, 
              className: `text-${user.status === 'online' ? 'green' : 'gray'}-600` 
            },
            `${user.username} (${user.status})`
          )
        )
      )
    )
  );
};

// Example integration with existing Spark components
export const integrateWithExistingComponents = () => {
  // This would be integrated into your existing Spark components
  // 
  // 1. In SparkCard/SparkEditor components:
  //    - Call startEditingSpark when user focuses on editable fields
  //    - Call endEditingSpark when user leaves/saves
  //    - Call broadcastSparkChange for real-time content sync
  //    - Show SparkEditingIndicator when others are editing
  //
  // 2. In Workspace/Dashboard components:
  //    - Show PresenceIndicator for connected users
  //    - Show ConnectionStatus in header/status bar
  //    - Handle real-time updates from onSparkContentChanged
  //
  // 3. In Layout/Header components:
  //    - Show connection status
  //    - Show online users count
  //    - Provide manual reconnect option
};