
# MANUAL DE MATRIX - Implementación Custom

Este documento explica cómo funciona la integración con Matrix en esta app, sin usar el SDK oficial (matrix-js-sdk). Se usa la **REST API** directamente.

---

## 1. ARQUITECTURA GENERAL

La app se conecta a un servidor **Matrix Synapse** usando la REST API v3. No hay conexión directa WebSocket - el tiempo real se maneja mediante **long polling** al endpoint `/sync`.

### Componentes principales:

```
┌─────────────────────────────────────────────────────────────┐
│                      app/ (Pantallas)                       │
│  [Login] [Chats List] [Chat Screen] [Contacts]             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    features/ (Context & Hooks)              │
│  ChatContext  │  AuthContext  │  useRoomMessages          │
│  useSyncLoop                                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    services/matrix/ (API)                   │
│  auth.ts  │  rooms.ts  │  messages.ts  │  sync.ts         │
│  profile.ts  │  users.ts  │  timeline.ts                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    shared/types/ (TypeScript)               │
│  matrixEvent.ts  │  matrixSync.ts  │  matrixRoom.d.ts    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Matrix Synapse Server                    │
│              http://192.168.0.8:8008                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. TIPOS DE DATOS (Types)

### 2.1 MatrixSession (`matrixSession.d.ts`)

```typescript
interface MatrixSession {
  access_token: string;  // Token de acceso para autenticación
  user_id: string;      // UserID del usuario (ej: @usuario:server.com)
  device_id: string;    // ID del dispositivo
  home_server: string;  // Servidor Matrix (ej: local.local)
}
```

Esta estructura se obtiene cuando el usuario hace **login** exitosamente. El `access_token` es requerido en TODAS las peticiones a la API.

### 2.2 MatrixEvent (`matrixEvent.ts`)

```typescript
interface MatrixEvent {
  type: string;                    // Tipo de evento (m.room.message, m.room.member, etc.)
  sender: string;                  // UserID de quien envió el evento
  content: Record<string, unknown>; // Contenido del evento (body, msgtype, etc.)
  event_id: string;                // ID único del evento
  room_id?: string;                // ID de la sala (room) donde ocurrió el evento
  origin_server_ts?: number;      // Timestamp del servidor (unix epoch ms)
  unsigned?: Record<string, unknown>; // Datos adicionales
  redacts?: string;               // Si es una eliminación, ID del evento eliminado
  ["m.relates_to"]?: {            // Para ediciones de mensajes
    rel_type?: string;             // "m.replace" = edición
    event_id?: string;             // ID del mensaje original
  };
}
```

**Tipos de eventos importantes:**
- `m.room.message` - Mensaje de chat
- `m.room.member` - Cambio de membresía (un usuario entra/sale)
- `m.room.redaction` - Eliminación de mensaje
- `m.room.name` - Nombre de la sala
- `m.room.avatar` - Avatar de la sala

### 2.3 SyncResponse (`matrixSync.ts`)

```typescript
interface SyncResponse {
  next_batch: string;              // Token para la siguiente llamada (crucial!)
  rooms?: {
    join?: Record<string, RoomData>;    // Salas donde el usuario está unido
    invite?: Record<string, InvitedRoomData>; // Salas donde hay invitación pendiente
    leave?: Record<string, RoomData>;   // Salas que el usuario abandonó
  };
  presence?: Record<string, unknown>;
  account_data?: Record<string, unknown>;
  to_device?: Record<string, unknown>;
  device_list?: Record<string, unknown>;
}

interface RoomData {
  timeline?: {
    limited?: boolean;             // Si hay más eventos disponibles
    events: MatrixEvent[];         // Eventos del timeline (mensajes nuevos)
  };
  state?: {
    events: MatrixEvent[];        // Estado actual de la sala
  };
  ephemeral?: {
    events: MatrixEvent[];        // Eventos efímeros (typing, receipts)
  };
  unread_notification_count?: number;
}
```

### 2.4 ChatRoom (`matrixRoom.d.ts`)

```typescript
interface ChatRoom {
  room_id: string;
  name?: string;                   // Nombre de la sala (para grupos)
  avatar?: string;
  members: RoomMember[];         // Miembros de la sala
  isDirect: boolean;             // true = chat directo, false = grupo
  otherUser?: {                  // Para DMs, información del otro usuario
    user_id: string;
    displayname: string;
  };
  isInvite?: boolean;            // true = invitación pendiente
}

interface InvitedRoom {
  room_id: string;
  inviter_user_id?: string;       // UserID de quien invitó
  inviter_name?: string;          // Display name del que invitó
}
```

---

## 3. SERVICIOS (API REST)

### 3.1 Autenticación (`auth.ts`)

#### `registerUser(username, password)`

**Endpoint:** `POST /_matrix/client/v3/register`

**Propósito:** Crear un nuevo usuario en el servidor Matrix.

**Código:**
```typescript
import { ENV } from "../../shared/constants/env";
import { MatrixSession } from "../../shared/types/matrix";

export const registerUser = async (username: string, password: string): Promise<MatrixSession> => {
  try {
    const resMatrix = await fetch(`${ENV.MATRIX_URL}/_matrix/client/v3/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
        auth: {
          type: "m.login.dummy",
        },
      }),
    });

    const session = await resMatrix.json();
    return session;
  } catch (err) {
    console.error("registerUser error:", err);
    throw err;
  }
};
```

**Observaciones:** Requiere que el servidor permita registro público o esté configurado para ello.

---

#### `loginUser(username, password)`

**Endpoint:** `POST /_matrix/client/v3/login`

**Propósito:** Iniciar sesión y obtener token de acceso.

**Código:**
```typescript
export const loginUser = async (username: string, password: string) => {
  try {
    const res = await fetch(`${ENV.MATRIX_URL}/_matrix/client/v3/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "m.login.password",
        identifier: {
          type: "m.id.user",
          user: username,
        },
        password,
      }),
    });

    const session = await res.json();

    if (!res.ok) {
      throw new Error(session.error || "Error al iniciar sesión");
    }

    return session;
  } catch (err) {
    console.error("loginUser error:", err);
    throw err;
  }
};
```

**Respuesta:** `MatrixSession` con `access_token`, `user_id`, `device_id`, `home_server`

---

### 3.2 Salas/Room (`rooms.ts`)

#### `createDirectChat(userId, token)`

**Endpoint:** `POST /_matrix/client/v3/createRoom`

**Propósito:** Crear un chat directo (DM) con otro usuario.

**Código:**
```typescript
export const createDirectChat = async (
  userId: string,
  token: string
): Promise<string> => {
  try {
    const res = await fetch(
      `${ENV.MATRIX_URL}/_matrix/client/v3/createRoom`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          invite: [userId],
          is_direct: true,
          preset: "trusted_private_chat",
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Error creando chat directo");
    }

    return data.room_id;
  } catch (err) {
    console.error("createDirectChat error:", err);
    throw err;
  }
};
```

---

#### `getJoinedRooms(token)`

**Endpoint:** `GET /_matrix/client/v3/joined_rooms`

**Propósito:** Obtener lista de salas donde el usuario está unido.

**Código:**
```typescript
export const getJoinedRooms = async (token: string) => {
  try {
    const res = await fetch(
      `${ENV.MATRIX_URL}/_matrix/client/v3/joined_rooms`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Error obteniendo salas");
    }

    return data.joined_rooms || [];
  } catch (err) {
    console.error("getJoinedRooms error:", err);
    throw err;
  }
};
```

---

#### `getInvitedRooms(token, since?)`

**Endpoint:** `GET /_matrix/client/v3/sync`

**Propósito:** Obtener salas donde el usuario tiene invitación pendiente.

**Código:**
```typescript
export const getInvitedRooms = async (token: string, since?: string): Promise<InvitedRoom[]> => {
  try {
    const url = new URL(`${ENV.MATRIX_URL}/_matrix/client/v3/sync`);

    // timeout=0 → respuesta inmediata (sin long polling)
    url.searchParams.set('timeout', '0');

    // since → permite obtener solo cambios desde la última sync
    if (since) {
      url.searchParams.set('since', since);
    }

    // filter → pedimos SOLO las invitaciones (no toda la data de rooms)
    url.searchParams.set('filter', JSON.stringify({
      rooms: {
        invite: true
      }
    }));

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("getInvitedRooms error:", data);
      return [];
    }

    const invitedRooms: InvitedRoom[] = [];

    if (data.rooms?.invite) {
      for (const [roomId, roomData] of Object.entries(data.rooms.invite)) {
        const inviteState = (roomData as any).invite_state;
        const events = inviteState?.events || [];

        // Buscar evento de invitación
        const memberEvent = events.find((e: any) =>
          e.type === 'm.room.member' && e.content?.membership === 'invite'
        );

        const inviterUserId = memberEvent?.sender;

        // Buscar evento del invitador unido a la sala
        const inviterMemberEvent = events.find((e: any) =>
          e.type === 'm.room.member' &&
          e.content?.membership === 'join' &&
          e.state_key === inviterUserId
        );

        const inviterName =
          inviterMemberEvent?.content?.displayname || inviterUserId || null;

        invitedRooms.push({
          room_id: roomId,
          inviter_user_id: inviterUserId,
          inviter_name: inviterName,
        });
      }
    }

    return invitedRooms;
  } catch (err) {
    console.error("getInvitedRooms error:", err);
    return [];
  }
};
```

---

#### `getRoomMembers(roomId, token)`

**Endpoint:** `GET /_matrix/client/v3/rooms/{roomId}/members`

**Propósito:** Obtener todos los miembros de una sala.

**Código:**
```typescript
export const getRoomMembers = async (roomId: string, token: string) => {
  try {
    const res = await fetch(
      `${ENV.MATRIX_URL}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/members`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Error obteniendo miembros");
    }

    return data.chunk || [];
  } catch (err) {
    console.error("getRoomMembers error:", err);
    throw err;
  }
};
```

---

#### `getRoomName(roomId, token)`

**Endpoint:** `GET /_matrix/client/v3/rooms/{roomId}/state/m.room.name`

**Propósito:** Obtener el nombre de una sala.

**Código:**
```typescript
export const getRoomName = async (roomId: string, token: string) => {
  try {
    const res = await fetch(
      `${ENV.MATRIX_URL}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/state/m.room.name`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return null; // The room may not have a name
    }

    return data.name || null;
  } catch (err) {
    console.error("getRoomName error:", err);
    return null;
  }
};
```

---

#### `joinRoom(roomId, token)`

**Endpoint:** `POST /_matrix/client/v3/rooms/{roomId}/join`

**Propósito:** Unirse a una sala (aceptar invitación).

**Código:**
```typescript
export const joinRoom = async (roomId: string, token: string) => {
  try {
    const res = await fetch(
      `${ENV.MATRIX_URL}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/join`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Error uniéndose a la sala");
    }

    return data.room_id;
  } catch (err) {
    console.error("joinRoom error:", err);
    throw err;
  }
};
```

---

#### `leaveRoom(roomId, token)`

**Endpoint:** `POST /_matrix/client/v3/rooms/{roomId}/leave`

**Propósito:** Abandonar una sala.

**Código:**
```typescript
export const leaveRoom = async (roomId: string, token: string) => {
  try {
    const res = await fetch(
      `${ENV.MATRIX_URL}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/leave`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Error abandonando la sala");
    }

    return true;
  } catch (err) {
    console.error("leaveRoom error:", err);
    throw err;
  }
};
```

---

#### `rejectInvite(roomId, token)`

**Endpoint:** `POST /_matrix/client/v3/rooms/{roomId}/leave`

**Propósito:** Rechazar una invitación.

**Código:**
```typescript
export const rejectInvite = async (roomId: string, token: string) => {
  try {
    const res = await fetch(
      `${ENV.MATRIX_URL}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/leave`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: "Rejected invitation",
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Error rechazando la invitación");
    }

    return true;
  } catch (err) {
    console.error("rejectInvite error:", err);
    throw err;
  }
};
```

---

### 3.3 Mensajes (`messages.ts`)

#### `sendRoomMessage(roomId, token, body, msgtype)`

**Endpoint:** `PUT /_matrix/client/v3/rooms/{roomId}/send/m.room.message/{txnId}`

**Propósito:** Enviar un mensaje a una sala.

**Código:**
```typescript
export const sendRoomMessage = async (
  roomId: string,
  token: string,
  body: string,
  msgtype: string = "m.text"
): Promise<string | null> => {
  try {
    // Generar transaction ID único para evitar duplicados
    const txnId = `m${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const res = await fetch(
      `${ENV.MATRIX_URL}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/send/m.room.message/${txnId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          msgtype,
          body,
        }),
      }
    );

    if (!res.ok) {
      const error = await res.json();
      console.error("[sendRoomMessage] Error:", error);
      return null;
    }

    const data = await res.json();
    return data.event_id;
  } catch (err) {
    console.error("[sendRoomMessage] Network error:", err);
    return null;
  }
};
```

---

#### `getRoomMessages(roomId, token, direction, from, limit)`

**Endpoint:** `GET /_matrix/client/v3/rooms/{roomId}/messages`

**Propósito:** Obtener historial de mensajes de una sala con paginación.

**Código:**
```typescript
export const getRoomMessages = async (
  roomId: string,
  token: string,
  direction: "b" | "f" = "b",
  from?: string,
  limit: number = 20
): Promise<{
  messages: MatrixEvent[];
  endCursor: string | null;
  hasMore: boolean;
}> => {
  try {
    const url = new URL(
      `${ENV.MATRIX_URL}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/messages`
    );

    url.searchParams.set("dir", direction);
    url.searchParams.set("limit", String(limit));

    if (from) {
      url.searchParams.set("from", from);
    }

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const error = await res.json();
      console.error("[getRoomMessages] Error:", error);
      return { messages: [], endCursor: null, hasMore: false };
    }

    const data = await res.json();

    return {
      messages: data.chunk || [],
      endCursor: data.end || null,
      hasMore: data.chunk?.length === limit,
    };
  } catch (err) {
    console.error("[getRoomMessages] Network error:", err);
    return { messages: [], endCursor: null, hasMore: false };
  }
};
```

---

#### `redactMessage(roomId, eventId, token, reason?)`

**Endpoint:** `PUT /_matrix/client/v3/rooms/{roomId}/redact/{eventId}`

**Propósito:** Eliminar/ocultar un mensaje.

**Código:**
```typescript
export const redactMessage = async (
  roomId: string,
  eventId: string,
  token: string,
  reason?: string
): Promise<boolean> => {
  try {
    const res = await fetch(
      `${ENV.MATRIX_URL}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/redact/${encodeURIComponent(eventId)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason,
        }),
      }
    );

    if (!res.ok) {
      const error = await res.json();
      console.error("[redactMessage] Error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[redactMessage] Network error:", err);
    return false;
  }
};
```

---

### 3.4 Sync / Tiempo Real (`sync.ts`)

#### `matrixSync(options)`

**Endpoint:** `GET /_matrix/client/v3/sync`

**Propósito:** El endpoint principal para tiempo real. Implementa **long polling**.

**Código:**
```typescript
const DEFAULT_TIMEOUT = 30000;
const DEFAULT_FILTER = {
  room: {
    timeline: {
      limit: 50,
      lazy_load_members: true,
    },
    state: {
      lazy_load_members: true,
    },
  },
  presence: {
    send: [],
  },
};

export const matrixSync = async (options: SyncOptions): Promise<SyncResponse | null> => {
  const { token, since, timeout = DEFAULT_TIMEOUT, setPresence = "online" } = options;

  try {
    const url = new URL(`${ENV.MATRIX_URL}/_matrix/client/v3/sync`);

    url.searchParams.set("timeout", String(timeout));

    if (since) {
      url.searchParams.set("since", since);
    }

    url.searchParams.set("filter", JSON.stringify(DEFAULT_FILTER));
    url.searchParams.set("set_presence", setPresence);

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const error = await res.json();
      console.error("[matrixSync] Error response:", error);
      return null;
    }

    const data = await res.json();
    return data as SyncResponse;
  } catch (err) {
    console.error("[matrixSync] Network error:", err);
    return null;
  }
};
```

**Cómo funciona el long polling:**
1. Llamamos con `timeout=30000` (30 segundos)
2. El servidor espera hasta 30 segundos si no hay eventos nuevos
3. Cuando hay eventos (o timeout), devuelve la respuesta
4. Inmediatamente hacemos otra llamada con `since={next_batch}`
5. Este ciclo continuo permite tiempo real sin WebSockets

---

#### `processSyncResponse(syncData, currentUserId)`

**Propósito:** Procesar la respuesta del sync y extraer información útil.

**Código:**
```typescript
export const processSyncResponse = (
  syncData: SyncResponse,
  currentUserId: string
): {
  newMessages: Map<string, MatrixEvent[]>;
  newInvites: string[];
  joinedRooms: string[];
  leftRooms: string[];
} => {
  const newMessages = new Map<string, MatrixEvent[]>();
  const newInvites: string[] = [];
  const joinedRooms: string[] = [];
  const leftRooms: string[] = [];

  if (syncData.rooms?.join) {
    for (const [roomId, roomData] of Object.entries(syncData.rooms.join)) {
      const timelineEvents = roomData.timeline?.events || [];
      const messageEvents = timelineEvents.filter(
        (e) =>
          e.type === "m.room.message" &&
          e.sender !== currentUserId
      );

      if (messageEvents.length > 0) {
        newMessages.set(roomId, messageEvents);
      }

      joinedRooms.push(roomId);
    }
  }

  if (syncData.rooms?.invite) {
    for (const roomId of Object.keys(syncData.rooms.invite)) {
      newInvites.push(roomId);
    }
  }

  if (syncData.rooms?.leave) {
    for (const roomId of Object.keys(syncData.rooms.leave)) {
      leftRooms.push(roomId);
    }
  }

  return {
    newMessages,
    newInvites,
    joinedRooms,
    leftRooms,
  };
};
```

---

### 3.5 Perfil (`profile.ts`)

#### `getProfile(userId, token)`

**Endpoint:** `GET /_matrix/client/v3/profile/{userId}`

**Código:**
```typescript
export const getProfile = async (userId: string, token: string) => {
  try {
    const res = await fetch(
      `${ENV.MATRIX_URL}/_matrix/client/v3/profile/${encodeURIComponent(userId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Error obteniendo perfil");
    }

    return {
      displayName: data.displayname || "",
      avatarUrl: data.avatar_url || "",
    };
  } catch (err) {
    console.error("getProfile error:", err);
    throw err;
  }
};
```

---

#### `setDisplayName(userId, token, displayName)`

**Endpoint:** `PUT /_matrix/client/v3/profile/{userId}/displayname`

**Código:**
```typescript
export const setDisplayName = async (
  userId: string,
  token: string,
  displayName: string
): Promise<IUserProfile> => {
  try {
    const res = await fetch(
      `${ENV.MATRIX_URL}/_matrix/client/v3/profile/${encodeURIComponent(userId)}/displayname`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayname: displayName,
        }),
      }
    );

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al guardar nombre");
    }
    const profile = await res.json();

    return profile;
  } catch (err) {
    console.error("setDisplayName error:", err);
    throw err;
  }
};
```

---

#### `uploadAvatar(file, token)`

**Endpoint:** `POST /_matrix/media/v3/upload`

**Código:**
```typescript
export const uploadAvatar = async (
  file: Blob,
  token: string
): Promise<string> => {
  try {
    const res = await fetch(`${ENV.MATRIX_URL}/_matrix/media/v3/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "image/jpeg",
      },
      body: file,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Error subiendo imagen");
    }

    return data.content_uri;
  } catch (err) {
    console.error("uploadAvatar error:", err);
    throw err;
  }
};
```

---

#### `setAvatar(userId, token, avatarUrl)`

**Endpoint:** `PUT /_matrix/client/v3/profile/{userId}/avatar_url`

**Código:**
```typescript
export const setAvatar = async (
  userId: string,
  token: string,
  avatarUrl: string
) => {
  try {
    const res = await fetch(
      `${ENV.MATRIX_URL}/_matrix/client/v3/profile/${encodeURIComponent(userId)}/avatar_url`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          avatar_url: avatarUrl,
        }),
      }
    );

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error seteando avatar");
    }
  } catch (err) {
    console.error("setAvatar error:", err);
    throw err;
  }
};
```

---

### 3.6 Búsqueda de Usuarios (`users.ts`)

#### `searchUsers(searchTerm, token)`

**Endpoint:** `POST /_matrix/client/v3/user_directory/search`

**Código:**
```typescript
export const searchUsers = async (searchTerm: string, token: string) => {
  try {
    const res = await fetch(
      `${ENV.MATRIX_URL}/_matrix/client/v3/user_directory/search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          search_term: searchTerm,
          limit: 20,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Error buscando usuarios");
    }

    return data.results || [];
  } catch (err) {
    console.error("searchUsers error:", err);
    throw err;
  }
};
```

---

### 3.7 Timeline (`timeline.ts`)

#### `processTimelineEvent(event, currentUserId)`

**Propósito:** Procesar un evento de timeline y normalizarlo.

**Código:**
```typescript
export const processTimelineEvent = (
  event: MatrixEvent,
  currentUserId: string
): {
  type: "message" | "redaction" | "member" | "call" | "other";
  data: MatrixTimeline;
} | null => {
  const { type, sender, content, event_id, roomId, origin_server_ts } = event;

  if (type === "m.room.message") {
    return {
      type: "message",
      data: {
        eventId: event_id,
        roomId,
        sender,
        body: (content.body as string) || "",
        msgtype: content.msgtype as string,
        timestamp: origin_server_ts || Date.now(),
      },
    };
  }

  if (type === "m.room.redaction") {
    return {
      type: "redaction",
      data: {
        eventId: event_id,
        roomId,
        sender,
        body: "",
        timestamp: origin_server_ts || Date.now(),
        redacts: event.redacts,
      },
    };
  }

  if (type === "m.room.member") {
    const newMember = {
      userId: (content as any).state_key || sender,
      membership: (content as any).membership || "join",
      displayname: (content as any).displayname,
    };

    return {
      type: "member",
      data: {
        eventId: event_id,
        roomId,
        sender,
        body: "",
        timestamp: origin_server_ts || Date.now(),
        newMember,
      },
    };
  }

  if (type.startsWith("m.call.")) {
    return {
      type: "call",
      data: {
        eventId: event_id,
        roomId,
        sender,
        body: "",
        timestamp: origin_server_ts || Date.now(),
      },
    };
  }

  return {
    type: "other",
    data: {
      eventId: event_id,
      roomId,
      sender,
      body: "",
      timestamp: origin_server_ts || Date.now(),
    },
  };
};
```

---

## 4. HOOKS PERSONALIZADOS

### 4.1 `useSyncLoop` (`src/hooks/useSyncLoop.ts`)

**Propósito:** Manejar el loop de sincronización con long polling de manera eficiente.

**Código completo:**
```typescript
import { useState, useRef, useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { matrixSync, processSyncResponse } from '@/src/services/matrix/sync';
import { MatrixEvent } from '@/src/shared/types/matrixEvent';
import { authStorage } from '../storage/auth-storage';

interface UseSyncLoopOptions {
  onMessages?: (roomId: string, messages: MatrixEvent[]) => void;
  onInvite?: (roomId: string) => void;
  onJoin?: (roomId: string) => void;
  onLeave?: (roomId: string) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

interface UseSyncLoopReturn {
  startSync: () => void;
  stopSync: () => void;
  isRunning: boolean;
  lastSyncTime: number | null;
}

const MAX_RETRIES = 5;
const BASE_RETRY_DELAY = 1000;
const ACTIVE_POLL_TIMEOUT = 30000;   // 30s cuando la app está activa
const BACKGROUND_POLL_TIMEOUT = 5000; // 5s cuando está en background

export const useSyncLoop = (options: UseSyncLoopOptions = {}): UseSyncLoopReturn => {
  const { onMessages, onInvite, onJoin, onLeave, onError, enabled = true } = options;

  const [isRunning, setIsRunning] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  const shouldStopRef = useRef(false);
  const nextBatchRef = useRef<string | undefined>(undefined);
  const retryCountRef = useRef(0);
  const appStateRef = useRef<'active' | 'background'>('active');
  const isRunningRef = useRef(false);
  const loopIdRef = useRef(0);

  // El loop principal de sync
  const syncLoop = useCallback(async (loopId: number) => {
    while (!shouldStopRef.current && loopIdRef.current === loopId) {
      try {
        const session = await authStorage.getSession();
        
        if (!session?.access_token) {
          console.log('[useSyncLoop] No session, stopping');
          break;
        }

        // Cambiar timeout según estado de la app
        const currentTimeout = appStateRef.current === 'active' 
          ? ACTIVE_POLL_TIMEOUT 
          : BACKGROUND_POLL_TIMEOUT;

        const syncData = await matrixSync({
          token: session.access_token,
          since: nextBatchRef.current,
          timeout: currentTimeout,
        });

        // Verificar si este loop aún es el activo
        if (loopIdRef.current !== loopId) {
          break;
        }

        if (!syncData) {
          retryCountRef.current += 1;
          
          if (retryCountRef.current >= MAX_RETRIES) {
            console.error('[useSyncLoop] Max retries reached, stopping');
            break;
          }

          // Retry exponencial: 1s, 2s, 4s, 8s, 16s
          const delay = BASE_RETRY_DELAY * Math.pow(2, retryCountRef.current - 1);
          console.log(`[useSyncLoop] Retry ${retryCountRef.current} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        retryCountRef.current = 0;
        nextBatchRef.current = syncData.next_batch;
        setLastSyncTime(Date.now());

        // Procesar respuesta
        const { newMessages, newInvites, joinedRooms, leftRooms } = processSyncResponse(
          syncData,
          session.user_id
        );

        // Notificar eventos
        if (newInvites.length > 0) {
          newInvites.forEach(roomId => onInvite?.(roomId));
        }
        if (joinedRooms.length > 0) {
          joinedRooms.forEach(roomId => onJoin?.(roomId));
        }
        if (leftRooms.length > 0) {
          leftRooms.forEach(roomId => onLeave?.(roomId));
        }
        newMessages.forEach((events, roomId) => {
          if (events.length > 0) {
            onMessages?.(roomId, events);
          }
        });

      } catch (error) {
        console.error('[useSyncLoop] Error in loop:', error);
        
        if (error instanceof Error) {
          onError?.(error);
        }

        retryCountRef.current += 1;

        if (retryCountRef.current >= MAX_RETRIES) {
          console.error('[useSyncLoop] Max retries reached, stopping');
          break;
        }

        const delay = BASE_RETRY_DELAY * Math.pow(2, retryCountRef.current - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    isRunningRef.current = false;
    setIsRunning(false);
    console.log('[useSyncLoop] Loop stopped');
  }, [onMessages, onInvite, onJoin, onLeave, onError]);

  // Iniciar sync
  const startSync = useCallback(() => {
    if (isRunningRef.current) return;

    console.log('[useSyncLoop] Starting sync loop');
    shouldStopRef.current = false;
    retryCountRef.current = 0;
    isRunningRef.current = true;
    setIsRunning(true);
    
    loopIdRef.current += 1;
    syncLoop(loopIdRef.current);
  }, [syncLoop]);

  // Detener sync
  const stopSync = useCallback(() => {
    console.log('[useSyncLoop] Stopping sync loop');
    shouldStopRef.current = true;
  }, []);

  // Manejar cambios de AppState
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState as 'active' | 'background';

      // Cuando la app vuelve a foreground, iniciar sync
      if (nextAppState === 'active' && previousState !== 'active') {
        if (!isRunningRef.current && enabled) {
          startSync();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    if (enabled) {
      startSync();
    }

    return () => {
      subscription.remove();
      stopSync();
    };
  }, [enabled, startSync, stopSync]);

  return {
    startSync,
    stopSync,
    isRunning,
    lastSyncTime,
  };
};
```

---

### 4.2 `useRoomMessages` (`src/hooks/useRoomMessages.ts`)

**Propósito:** Abstraer toda la lógica de mensajes de un room específico.

**Código completo:**
```typescript
import { useCallback, useEffect, useRef, useState } from "react";
import { getRoomMessages, sendRoomMessage } from "../services/matrix";
import { MatrixEvent } from "../shared/types/matrixEvent";
import { useSyncLoop } from "./useSyncLoop";
import { authStorage } from "../storage/auth-storage";
import { Message } from "../shared/types/matrixMessage";

interface UseRoomMessagesOptions {
  roomId: string;
  initialLimit?: number;
  onNewMessage?: (message: Message) => void;
  enabled?: boolean;
}

interface UseRoomMessagesReturn {
  messages: Message[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  sendMessage: (body: string) => Promise<boolean>;
  isSending: boolean;
  refresh: () => Promise<void>;
}

export const useRoomMessages = (options: UseRoomMessagesOptions): UseRoomMessagesReturn => {
  const { roomId, initialLimit = 50, onNewMessage, enabled = true } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const cursorRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  // Convertir MatrixEvent a Message
  const processEventToMessage = useCallback((event: MatrixEvent, msgRoomId: string): Message => {
    return {
      id: event.event_id,
      roomId: event.room_id || msgRoomId,
      sender: event.sender,
      body: (event.content?.body as string) || '',
      timestamp: event.origin_server_ts || Date.now(),
      type: event.type,
      msgtype: event.content?.msgtype as string,
    };
  }, []);

  // Cargar mensajes iniciales
  const loadInitialMessages = useCallback(async () => {
    if (!enabled || !roomId) return;

    const session = await authStorage.getSession();
    if (!session?.access_token) return;

    setIsLoading(true);

    try {
      const result = await getRoomMessages(
        roomId,
        session.access_token,
        'b',  // backward = más antiguos
        undefined,
        initialLimit
      );

      const msgs = result.messages
        .filter(e => e.type === 'm.room.message')
        .map(e => processEventToMessage(e, roomId))
        .sort((a, b) => a.timestamp - b.timestamp);

      setMessages(msgs);
      cursorRef.current = result.endCursor;
      setHasMore(result.hasMore);
      initializedRef.current = true;
    } catch (error) {
      console.error('[useRoomMessages] Error loading initial:', error);
    } finally {
      setIsLoading(false);
    }
  }, [roomId, initialLimit, enabled, processEventToMessage]);

  // Cargar más mensajes (paginación)
  const loadMore = useCallback(async () => {
    if (!enabled || !roomId || isLoading || !hasMore) return;

    const session = await authStorage.getSession();
    if (!session?.access_token) return;

    setIsLoading(true);

    try {
      const result = await getRoomMessages(
        roomId,
        session.access_token,
        'b',
        cursorRef.current || undefined,
        initialLimit
      );

      const newMessages = result.messages
        .filter(e => e.type === 'm.room.message')
        .map(e => processEventToMessage(e, roomId))
        .sort((a, b) => a.timestamp - b.timestamp);

      // Filtrar duplicados
      const existingIds = new Set(messages.map(m => m.id));
      const uniqueNew = newMessages.filter(m => !existingIds.has(m.id));

      setMessages(prev => [...prev, ...uniqueNew]);
      cursorRef.current = result.endCursor;
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('[useRoomMessages] Error loading more:', error);
    } finally {
      setIsLoading(false);
    }
  }, [roomId, initialLimit, enabled, isLoading, hasMore, messages, processEventToMessage]);

  // Enviar mensaje
  const sendMessage = useCallback(async (body: string): Promise<boolean> => {
    if (!roomId || !body.trim()) return false;

    const session = await authStorage.getSession();
    if (!session?.access_token) return false;

    setIsSending(true);

    try {
      const eventId = await sendRoomMessage(roomId, session.access_token, body.trim());

      if (eventId) {
        // Agregar mensaje localmente (optimistic update)
        const tempMessage: Message = {
          id: eventId,
          roomId,
          sender: session.user_id,
          body: body.trim(),
          timestamp: Date.now(),
          type: 'm.room.message',
          msgtype: 'm.text',
        };

        setMessages(prev => [...prev, tempMessage]);
        onNewMessage?.(tempMessage);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[useRoomMessages] Error sending:', error);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [roomId, onNewMessage]);

  // Refresh completo
  const refresh = useCallback(async () => {
    cursorRef.current = null;
    setMessages([]);
    setHasMore(true);
    initializedRef.current = false;
    await loadInitialMessages();
  }, [loadInitialMessages]);

  // Manejar nuevos mensajes del sync
  const handleNewMessages = useCallback((eventRoomId: string, events: MatrixEvent[]) => {
    if (eventRoomId !== roomId) return;

    const newMessages = events
      .filter(e => e.type === 'm.room.message')
      .map(e => processEventToMessage(e, roomId));

    if (newMessages.length > 0) {
      setMessages(prev => {
        // Filtrar duplicados
        const existingIds = new Set(prev.map(m => m.id));
        const uniqueNew = newMessages.filter(m => !existingIds.has(m.id));
        
        if (uniqueNew.length === 0) return prev;
        
        return [...prev, ...uniqueNew];
      });
      newMessages.forEach(msg => onNewMessage?.(msg));
    }
  }, [roomId, onNewMessage, processEventToMessage]);

  // Iniciar sync loop
  const syncLoop = useSyncLoop({
    onMessages: handleNewMessages,
    enabled: enabled,
  });

  // Efecto principal
  useEffect(() => {
    if (!enabled || !roomId) return;

    if (!syncLoop.isRunning) {
      syncLoop.startSync();
    }

    if (!initializedRef.current) {
      loadInitialMessages();
    }

    return () => {
      syncLoop.stopSync();
    };
  }, [roomId, enabled, loadInitialMessages]);

  return {
    messages,
    isLoading,
    hasMore,
    loadMore,
    sendMessage,
    isSending,
    refresh,
  };
};
```

---

## 5. FLUJO COMPLETO DE UN CHAT

### 5.1 Inicio de sesión
```
loginUser(username, password)
    │
    ▼
Obtiene MatrixSession (access_token, user_id)
    │
    ▼
authStorage.setSession(session)  // Guarda en SecureStore
```

### 5.2 Carga de lista de chats
```
loadChats() en ChatContext
    │
    ├─► getJoinedRooms()          // Salas unidas
    │       │
    │       ▼
    │   [roomId1, roomId2, ...]
    │
    └─► getInvitedRooms()         // Salas invitadas
            │
            ▼
        [InvitedRoom, ...]

Para cada sala:
    │
    ├─► getRoomMembers(roomId)   // Miembros
    ├─► getRoomName(roomId)       // Nombre
    │
    ▼
[ChatRoom, ChatRoom, ...]
```

### 5.3 Entrar a un chat
```
useRoomMessages(roomId)
    │
    ├─► getRoomMessages(roomId, limit=50)
    │       │
    │       ▼
    │   [Message, Message, ...]
    │
    └─► useSyncLoop()
            │
            ▼
        matrixSync(timeout=30000)
                │
                │ (30 segundos de espera)
                ▼
            { next_batch, rooms: {...} }
                │
                ▼
            processSyncResponse()
                │
                ▼
            onMessages(roomId, events)
                │
                ▼
            setMessages([...prev, ...new])
```

### 5.4 Enviar mensaje
```
Input.onSendMessage("Hola!")
    │
    ▼
sendRoomMessage(roomId, token, "Hola!")
    │
    ▼
PUT /_matrix/client/v3/rooms/{roomId}/send/m.room.message/{txnId}
    │
    ▼
{ event_id: "$..." }
    │
    ▼
Agregar mensaje a la lista localmente (optimistic)
    │
    ▼
El sync loop eventualmente recibe el mensaje (del servidor)
    │
    ▼
Pero lo ignora porque sender === currentUserId
```

---

## 6. ENDPOINTS DE MATRIX API USADOS

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/_matrix/client/v3/register` | Registrar usuario |
| POST | `/_matrix/client/v3/login` | Iniciar sesión |
| POST | `/_matrix/client/v3/createRoom` | Crear sala |
| GET | `/_matrix/client/v3/joined_rooms` | Listar salas unidas |
| GET | `/_matrix/client/v3/sync` | Sincronización (tiempo real) |
| GET | `/_matrix/client/v3/rooms/{id}/messages` | Historial de mensajes |
| PUT | `/_matrix/client/v3/rooms/{id}/send/m.room.message/{txnId}` | Enviar mensaje |
| PUT | `/_matrix/client/v3/rooms/{id}/redact/{eventId}` | Eliminar mensaje |
| GET | `/_matrix/client/v3/rooms/{id}/members` | Miembros de sala |
| GET | `/_matrix/client/v3/rooms/{id}/state/m.room.name` | Nombre de sala |
| POST | `/_matrix/client/v3/rooms/{id}/join` | Unirse a sala |
| POST | `/_matrix/client/v3/rooms/{id}/leave` | Abandonar/rechazar sala |
| GET | `/_matrix/client/v3/profile/{userId}` | Perfil de usuario |
| PUT | `/_matrix/client/v3/profile/{userId}/displayname` | Cambiar nombre |
| PUT | `/_matrix/client/v3/profile/{userId}/avatar_url` | Cambiar avatar |
| POST | `/_matrix/media/v3/upload` | Subir archivo |
| POST | `/_matrix/client/v3/user_directory/search` | Buscar usuarios |

---

## 7. CONSIDERACIONES IMPORTANTES

### 7.1 Autenticación
- El `access_token` expira. Si una llamada devuelve error 401, hay que re-autenticar.
- El token se guarda en `SecureStore` (expo-secure-store) por seguridad.

### 7.2 Rate Limiting
- Matrix tiene límites de rate. Si se excede, el servidor devuelve error 429.
- El código actual NO maneja rate limiting - sería una mejora futura.

### 7.3 Tiempo Real vs Polling
- Esta implementación usa **long polling** (no WebSockets).
- El servidor debe soportar el endpoint `/sync` (todos los servidores Matrix lo soportan).
- Delay típico: 0-30 segundos (según el timeout configurado).

### 7.4 Edge Cases No Manejados
- **Ediciones de mensajes**: El servidor puede recibir `m.relates_to` con `rel_type: "m.replace"`.
- **Reacciones**: Tipos de eventos como `m.reaction`.
- **Typing indicators**: Eventos en `ephemeral`.
- **Read receipts**: Para marcar mensajes como leídos.
- **Encryption (E2E)**: Esta implementación NO soporta encriptación de extremo a extremo.

### 7.5 Mejoras Futuras Posibles
- WebSockets para tiempo real verdadero (actualmente solo long polling)
- SQLite local para cache de mensajes
- Soporte para encryption (E2E)
- Notificaciones push (expo-notifications)
- Typing indicators
- Read receipts
- Reacciones a mensajes
