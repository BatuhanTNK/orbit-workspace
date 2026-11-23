import type { WorkspaceSnapshot } from "@/types/workspace";

const STORAGE_KEY = "orbit-workspace-snapshot-v1";
const CHANNEL_NAME = "orbit-workspace-realtime-v1";

export type SyncEnvelope =
  | {
      type: "SNAPSHOT_UPDATE";
      senderId: string;
      snapshot: WorkspaceSnapshot;
      summary: string;
      sentAt: number;
    }
  | {
      type: "PRESENCE_PING";
      senderId: string;
    }
  | {
      type: "PRESENCE_PONG";
      senderId: string;
    }
  | {
      type: "PRESENCE_BYE";
      senderId: string;
    };

let cachedTabClientId: string | null = null;

function getTabClientId(): string {
  if (cachedTabClientId) return cachedTabClientId;
  cachedTabClientId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `tab-${Math.random().toString(36).slice(2, 10)}`;
  return cachedTabClientId;
}

export function loadStoredSnapshot(): WorkspaceSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkspaceSnapshot;
    if (!Array.isArray(parsed.issues) || !Array.isArray(parsed.projects)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredSnapshot(snapshot: WorkspaceSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function clearStoredSnapshot(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

class RealtimeSyncBridge {
  private channel: BroadcastChannel | null = null;
  private peers = new Set<string>();
  private peerListeners = new Set<(count: number) => void>();
  private snapshotListeners = new Set<
    (snapshot: WorkspaceSnapshot, summary: string) => void
  >();
  private initialized = false;

  init() {
    if (this.initialized || typeof window === "undefined") return;
    this.initialized = true;

    if (typeof BroadcastChannel === "undefined") return;

    this.channel = new BroadcastChannel(CHANNEL_NAME);
    const clientId = getTabClientId();
    this.channel.onmessage = (event: MessageEvent<SyncEnvelope>) => {
      const msg = event.data;
      if (!msg || msg.senderId === clientId) return;

      switch (msg.type) {
        case "SNAPSHOT_UPDATE":
          this.snapshotListeners.forEach((cb) =>
            cb(msg.snapshot, msg.summary)
          );
          break;
        case "PRESENCE_PING":
          this.peers.add(msg.senderId);
          this.notifyPeers();
          this.post({ type: "PRESENCE_PONG", senderId: clientId });
          break;
        case "PRESENCE_PONG":
          this.peers.add(msg.senderId);
          this.notifyPeers();
          break;
        case "PRESENCE_BYE":
          this.peers.delete(msg.senderId);
          this.notifyPeers();
          break;
      }
    };

    // Announce presence to existing tabs
    this.post({ type: "PRESENCE_PING", senderId: clientId });

    window.addEventListener("beforeunload", this.handleUnload);
  }

  private handleUnload = () => {
    this.post({ type: "PRESENCE_BYE", senderId: getTabClientId() });
  };

  private post(envelope: SyncEnvelope) {
    try {
      this.channel?.postMessage(envelope);
    } catch {
      // Channel might be closed during unload
    }
  }

  private notifyPeers() {
    const activeTabs = this.peers.size + 1;
    this.peerListeners.forEach((cb) => cb(activeTabs));
  }

  broadcastSnapshot(snapshot: WorkspaceSnapshot, summary: string) {
    this.post({
      type: "SNAPSHOT_UPDATE",
      senderId: getTabClientId(),
      snapshot,
      summary,
      sentAt: Date.now(),
    });
  }

  onRemoteSnapshot(
    listener: (snapshot: WorkspaceSnapshot, summary: string) => void
  ): () => void {
    this.snapshotListeners.add(listener);
    return () => {
      this.snapshotListeners.delete(listener);
    };
  }

  onPeerCountChange(listener: (activeTabs: number) => void): () => void {
    this.peerListeners.add(listener);
    listener(this.peers.size + 1);
    return () => {
      this.peerListeners.delete(listener);
    };
  }
}

export const syncBridge = new RealtimeSyncBridge();
