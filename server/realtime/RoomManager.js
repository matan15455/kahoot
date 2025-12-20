/**
 * In-memory authoritative room/game state.
 *
 * Goals:
 * - Keep socket handlers thin (validation + call manager + broadcast).
 * - Store stable identity mapping: socketId <-> userId, role.
 * - Provide safe operations and consistent snapshots.
 */
export class RoomManager {
  /** @type {Map<string, any>} */
  #rooms = new Map();

  /** @type {Map<string, { roomId: string, userId: string, role: 'host'|'player' }>} */
  #socketIndex = new Map();

  /**
   * Generate short human shareable room id.
   * @returns {string}
   */
  static generateRoomId() {
    // 6 chars, base36
    return Math.random().toString(36).substring(2, 8);
  }

  /**
   * @param {string} hostUserId
   * @param {string} hostSocketId
   * @param {string} quizId
   * @returns {{ roomId: string }}
   */
  createRoom(hostUserId, hostSocketId, quizId) {
    // Remove any previous room by this host (authoritative decision).
    for (const [roomId, room] of this.#rooms.entries()) {
      if (room.hostUserId === hostUserId) {
        this.deleteRoom(roomId);
      }
    }

    const roomId = RoomManager.generateRoomId();

    this.#rooms.set(roomId, {
      id: roomId,
      hostUserId,
      hostSocketId,
      quizId,
      phase: "lobby", // lobby | question | summary | ended
      players: new Map(), // userId -> { userId, socketId, username, score }
      questions: null,
      // Keep backward-compatible field name used by existing socket code.
      currentQuestion: 0,
      endsAt: null,
      questionTimer: null,
      answersCount: {},
      totalAnswers: 0,
    });

    this.#socketIndex.set(hostSocketId, { roomId, userId: hostUserId, role: "host" });

    return { roomId };
  }

  /**
   * @param {string} roomId
   */
  getRoom(roomId) {
    return this.#rooms.get(roomId) || null;
  }

  /**
   * @param {string} roomId
   * @param {string} userId
   * @returns {boolean}
   */
  isHost(roomId, userId) {
    const room = this.getRoom(roomId);
    if (!room) return false;
    return room.hostUserId === userId;
  }

  /**
   * Join as player. (Host is created via createRoom)
   * @param {string} roomId
   * @param {{ userId: string, socketId: string, username: string }} params
   * @returns {{ ok: true } | { ok: false, error: string }}
   */
  joinRoom(roomId, { userId, socketId, username }) {
    const room = this.getRoom(roomId);
    if (!room) return { ok: false, error: "Room not found" };
    if (room.phase !== "lobby") return { ok: false, error: "Game already started" };

    // Prevent duplicates: if same userId reconnects, replace socketId.
    const existing = room.players.get(userId);
    if (existing) {
      this.#socketIndex.delete(existing.socketId);
    }

    room.players.set(userId, {
      userId,
      socketId,
      username,
      score: existing?.score ?? 0,
    });

    this.#socketIndex.set(socketId, { roomId, userId, role: "player" });
    return { ok: true };
  }

  /**
   * Remove socket from its room (player) and clean up index.
   * If host disconnects, room remains for now (can be extended later).
   * @param {string} socketId
   * @returns {{ roomId: string, changed: boolean } | null}
   */
  disconnect(socketId) {
    const entry = this.#socketIndex.get(socketId);
    if (!entry) return null;

    const { roomId, userId, role } = entry;
    const room = this.getRoom(roomId);
    this.#socketIndex.delete(socketId);

    if (!room) return { roomId, changed: false };

    if (role === "player") {
      // Remove player by userId (not socketId) – fixes the old bug.
      const existed = room.players.delete(userId);
      return { roomId, changed: existed };
    }

    // host disconnect: keep room (so host can refresh/reconnect).
    if (role === "host") {
      room.hostSocketId = null;
      return { roomId, changed: true };
    }

    return { roomId, changed: false };
  }

  /**
   * Attach/re-attach host socket to an existing room (optional future use).
   * @param {string} roomId
   * @param {string} hostUserId
   * @param {string} hostSocketId
   * @returns {{ ok: true } | { ok: false, error: string }}
   */
  attachHost(roomId, hostUserId, hostSocketId) {
    const room = this.getRoom(roomId);
    if (!room) return { ok: false, error: "Room not found" };
    if (room.hostUserId !== hostUserId) return { ok: false, error: "Not host" };

    room.hostSocketId = hostSocketId;
    this.#socketIndex.set(hostSocketId, { roomId, userId: hostUserId, role: "host" });
    return { ok: true };
  }

  /**
   * @param {string} roomId
   * @returns {{ id: string, hostUserId: string, quizId: string, phase: string, players: Array<{id: string, username: string, score: number}>, currentQuestionIndex: number, endsAt: number|null }}
   */
  snapshot(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    return {
      id: room.id,
      hostUserId: room.hostUserId,
      quizId: room.quizId,
      phase: room.phase,
      players: [...room.players.values()].map((p) => ({
        id: p.userId, // keep backward-compatible shape expected by UI
        username: p.username,
        score: p.score,
      })),
      currentQuestionIndex: room.currentQuestion,
      endsAt: room.endsAt,
    };
  }

  /**
   * Clear timers and remove the room entirely.
   * @param {string} roomId
   */
  deleteRoom(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return;

    if (room.questionTimer) clearTimeout(room.questionTimer);

    // Remove socket index entries for players + host (if any).
    if (room.hostSocketId) this.#socketIndex.delete(room.hostSocketId);
    for (const p of room.players.values()) this.#socketIndex.delete(p.socketId);

    this.#rooms.delete(roomId);
  }
}

