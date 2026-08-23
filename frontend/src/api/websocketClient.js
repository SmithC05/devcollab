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

    const { sessionToken, activeWorkspace } = useAuthStore.getState();
    const workspaceId = activeWorkspace ? `${activeWorkspace.id}/` : '';
    // Build URL — include token if available (for presence), but connect regardless for realtime events
    const tokenParam = sessionToken ? `?token=${sessionToken}` : '';
    this.socket = new WebSocket(`${WS_BASE_URL}/workspace/${workspaceId}${tokenParam}`);

    this.socket.onopen = () => {
      this.isConnecting = false;
      this.startHeartbeat();
      console.log('WebSocket connected');
      // Only set ACTIVE if not intentionally UNAVAILABLE
      const unavailableMembers = usePresenceStore.getState().unavailableMembers || {};
      const { currentUser } = usePresenceStore.getState();
      const currentUserId = currentUser?.id;
      if (!currentUserId || !unavailableMembers[currentUserId]) {
        this.setStatus('ACTIVE');
      }
    };


    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'presence_update') {
        usePresenceStore.getState().setPresence(data.user_id, data.status);

      } else if (data.type === 'engine_event') {
        const payload = data.payload || {};

        // ── Route to stores based on event_type ──────────────────────────
        if (payload.event_type === 'TASK_REASSIGNED' || payload.event_type === 'TASK_ASSIGNED') {
          // Directly update Kanban store — no page reload needed
          import('../stores/taskStore').then(({ useTaskStore }) => {
            useTaskStore.getState().syncEngineEvent(payload);
          });
        }

        if (payload.event_type === 'MEMBER_UNAVAILABLE') {
          usePresenceStore.getState().setUnavailable(
            payload.user_id,
            payload.unavailable_until,
            payload.username
          );
        }

        if (payload.event_type === 'PRESENCE_RESTORED') {
          usePresenceStore.getState().setPresence(payload.user_id, 'ACTIVE');
          usePresenceStore.getState().clearUnavailable(payload.user_id);
        }

        if (payload.event_type === 'DECISION_POINT_CREATED') {
          // Dispatch to notification store for the alert badge
          import('../stores/notificationStore').then(({ useNotificationStore }) => {
            if (useNotificationStore?.getState) {
              useNotificationStore.getState().addDecisionPoint?.(payload);
            }
          }).catch(() => {});
        }

        // Always also dispatch DOM event so legacy listeners (ApprovalPanel) still work
        document.dispatchEvent(new CustomEvent('engine_event', { detail: payload }));

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
