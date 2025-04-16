**VOXA - Design Document**

---

**Project Name:** Voxa  
**Type:** Real-Time Chat & Call Web Application  
**Frontend:** Vite + React + Tailwind + shadcn/ui + lucide-react  
**Backend:** Supabase (Auth, Database, Realtime, Storage)

---

### Product Overview
Voxa is a real-time communication web app designed for modern users who want to effortlessly chat, make voice calls, and video calls with sleek aesthetics and high performance.

The app will support:
- **1-on-1 Text Chat**
- **Voice Calls**
- **Video Calls**
- **Presence & Typing Indicators**
- **Push Notifications (PWA)**
- **Emoji Support**

---

### Visual Identity
- **Dark Theme Palette:**
  - Primary: Deep Blue `#0D1B2A`
  - Accent: Violet Purple `#7F5AF0`
  - Highlight: Soft Peach `#FFADAD`
  - Contrast: Black `#000000`

- **Light Theme Palette:**
  - Base: White `#FFFFFF`
  - Primary Text: Deep Blue `#0D1B2A`
  - Accent: Violet Purple `#7F5AF0`
  - Subtle Tint: Soft Peach `#FFEAEA`

---

### Branding & Logo
- **App Name:** Voxa
- **Icon Base:** `waves` (from lucide-react)
- **Logo Concept:**
  - Modified `waves` icon with gradient fill from Violet Purple to Peach.
  - Smooth rounded paths to fit favicon and social images.

---

### Tech Stack
| Layer                  | Tech Stack                         |
|-------------------------|------------------------------------|
| Frontend                | React + Vite                       |
| Styling                 | TailwindCSS + shadcn/ui           |
| Icons                   | lucide-react                      |
| State Management        | Zustand / Jotai                    |
| Realtime & Auth         | Supabase                          |
| Audio/Video Calls       | WebRTC + Supabase Signaling Table |

---

### Project Structure
```
/src
|-- api/
|   |-- supabaseClient.ts
|-- components/
|   |-- Chat/
|   |   |-- ChatWindow.tsx
|   |-- Call/
|   |   |-- CallWindow.tsx
|-- hooks/
|   |-- useRealtimeMessages.ts
|   |-- useWebRTC.ts
|-- pages/
|   |-- Home.tsx
|   |-- Chat.tsx
|   |-- Call.tsx
|-- store/
|   |-- userStore.ts
|   |-- chatStore.ts
|-- utils/
|   |-- webrtcUtils.ts
|-- App.tsx
|-- main.tsx
```

---

### Supabase Schema (Comprehensive)

**Users Table**
```sql
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  username text UNIQUE NOT NULL,
  avatar_url text,
  status text DEFAULT 'offline',
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
```

**Messages Table**
```sql
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES users(id),
  receiver_id uuid REFERENCES users(id),
  content text,
  type text DEFAULT 'text',
  emoji jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

**Calls Table**
```sql
CREATE TABLE calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id uuid REFERENCES users(id),
  receiver_id uuid REFERENCES users(id),
  status text CHECK (status IN ('initiated', 'accepted', 'rejected', 'ended')),
  call_type text CHECK (call_type IN ('audio', 'video')),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

**Signaling Table (WebRTC)**
```sql
CREATE TABLE signaling (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid,
  sender_id uuid REFERENCES users(id),
  receiver_id uuid REFERENCES users(id),
  signal_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

**Conversations Table**
```sql
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids uuid[] NOT NULL,
  last_message_id uuid REFERENCES messages(id),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
```

**Friends Table**
```sql
CREATE TABLE friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  friend_id uuid REFERENCES users(id),
  status text CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at timestamptz DEFAULT now()
);
```

**Notifications Table**
```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  type text NOT NULL,
  payload jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

**Presence Table**
```sql
CREATE TABLE presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  status text CHECK (status IN ('online', 'offline', 'away', 'busy')),
  last_seen timestamptz DEFAULT now()
);
```

---

### WebRTC Flow (Simplified)
1. Caller initiates call, generates WebRTC offer.
2. Offer sent to `signaling` table.
3. Callee receives offer via Supabase Realtime subscription.
4. Callee responds with answer.
5. ICE candidates are exchanged.
6. Peer-to-Peer connection established.

---

### Core Features
- Supabase Auth (Email, Magic Link, OAuth).
- Real-Time Text Chat.
- Voice and Video Calls (WebRTC).
- Typing and Online Status Indicators.
- Dark & Light Theming with Tailwind + shadcn/ui.
- Progressive Web App (installable, push notifications).
- Emoji Support for conversations.
- Audio Alerts for messages, calls, and notifications.
- Pop-up animations and smooth transitions for modals, chat bubbles, and system toasts.

---

### UI/UX & Responsiveness
- Utilize **shadcn/ui's Layout System**:
  - Responsive navigation patterns (sidebar, navbar, drawer) optimized for mobile and desktop.
  - Built-in design tokens for consistent spacing, font sizes, and component styling.
  - Smooth transitions between screens and interactions using Framer Motion animations.
  - Adaptive components (e.g., chat windows scale with viewport, modals centered and responsive).

- **Animations:**
  - Use Framer Motion for:
    - Page transitions.
    - Pop-up modals.
    - Message sending/receiving effects.

- **Sounds:**
  - Lightweight sound cues for:
    - New message.
    - Incoming call.
    - Call connected/disconnected.

---

### Next Steps
1. Create Supabase project and apply schema.
2. Initialize Vite + Tailwind + shadcn/ui project.
3. Implement `useRealtimeMessages` and `useWebRTC` hooks.
4. Develop core pages (Home, Chat, Call).
5. Style using design tokens for color palettes.
6. Create assets (Logo, Favicon) based on the `waves` icon.
7. Integrate emoji picker into ChatWindow component.
8. Implement sound feedback and pop-up animations for enhanced user experience.

---

**End of Document.**

Ready for implementation! Let me know when you want the code snippets or setup instructions.

