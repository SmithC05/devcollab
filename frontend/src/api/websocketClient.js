import { useAuthStore } from '../stores/authStore';
import { usePresenceStore } from '../stores/presenceStore';

const WS_BASE_URL = 'ws://localhost:8000/ws';

class WebSocketClient {
  constructor() {
    this.socket = null;
    this.pingInterval = null;
    this.reconnectTimeout = null;
    this.isConnecting = false;
  }

  connect() {
    if (this.isConnecting || (this.socket && this.socket.readyState === WebSocket.OPEN)) return;
    this.isConnecting = true;

    const { sessionToken } = useAuthStore.getState();
    // Build URL — include token if available (for presence), but connect regardless for realtime events
    const tokenParam = sessionToken ? `?token=${sessionToken}` : '';
    this.socket = new WebSocket(`${WS_BASE_URL}/workspace/${tokenParam}`);

    this.socket.onopen = () => {
      this.isConnecting = false;
      this.startHeartbeat();
      console.log('WebSocket connected');
      // We are active upon connect
      this.setStatus('ACTIVE');
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'presence_update') {
        usePresenceStore.getState().setPresence(data.user_id, data.status);
      } else if (data.type === 'engine_event') {
        // Handle engine events (e.g., task moved) later
        document.dispatchEvent(new CustomEvent('engine_event', { detail: data.payload }));
      } else if (data.type === 'task_view_update') {
        if (data.status === 'STARTED') {
          usePresenceStore.getState().addTaskViewer(data.task_id, data.user_id);
        } else {
          usePresenceStore.getState().removeTaskViewer(data.task_id, data.user_id);
        }
      }
    };

    this.socket.onclose = () => {
      this.isConnecting = false;
      this.stopHeartbeat();
      console.log('WebSocket disconnected');
      this.scheduleReconnect();
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error', error);
      this.socket.close();
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, 5000);
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      this.send({ action: 'ping' });
    }, 30000); // 30s ping
  }

  stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  setStatus(status) {
    this.send({ action: 'set_status', status });
  }

  sendActivity() {
    this.send({ action: 'user_activity' });
  }

  sendTaskViewEvent(taskId, isViewing) {
    this.send({
      action: 'task_view',
      task_id: taskId,
      status: isViewing ? 'STARTED' : 'ENDED'
    });
  }
}

export const wsClient = new WebSocketClient();
