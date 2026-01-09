# 🧠 AI English Learning System - System Architecture

This document provides a comprehensive overview of the system architecture, designed for technical presentations.

## 1. System Architecture Diagram

This diagram visualizes the data flow from the user interface through the processing pipeline and back.

```mermaid
graph TD
    %% Styling
    classDef frontend fill:#e0f2f1,stroke:#00695c,stroke-width:2px,rx:10,ry:10;
    classDef backend fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,rx:10,ry:10;
    classDef ai fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px,rx:10,ry:10;
    classDef external fill:#fff3e0,stroke:#e65100,stroke-width:2px,rx:5,ry:5,stroke-dasharray: 5 5;
    classDef db fill:#eceff1,stroke:#455a64,stroke-width:2px,rx:0,ry:0,shape:cylinder;

    subgraph User_Device [🖥️ Frontend Client (User Device)]
        direction TB
        UI[React UI / Vite]:::frontend
        Router[React Router DOM]:::frontend
        Player[YouTube Player API]:::frontend
        State[Global State / React Query]:::frontend
        
        UI --> Router
        UI --> Player
        UI <--> State
    end

    subgraph BaaS_Layer [☁️ Backend & Data (Supabase)]
        direction TB
        Auth[Authentication]:::backend
        RT[Realtime Subscriptions]:::backend
        DB[(PostgreSQL Database)]:::db
        
        Auth -.-> DB
        RT <--> DB
    end

    subgraph Worker_Node [⚙️ AI Processing Worker (Local/Cloud)]
        direction TB
        Poller[Queue Poller]:::backend
        YT_Tools[yt-dlp & Transcript API]:::backend
        Orchestrator[Python Worker logic]:::backend
        
        Poller --> Orchestrator
        Orchestrator --> YT_Tools
    end

    subgraph Intelligence [🧠 AI & External Services]
        Gemini[Google Gemini 1.5 Pro]:::ai
        YouTube[YouTube Platform]:::external
    end

    %% Data Flow Connections
    State -- "1. Add Video Link (Realtime)" --> DB
    State -- "Read Data" --> DB
    DB -- "Notify Changes" --> RT --> State
    
    Poller -- "Poll 'pending' tasks" --> DB
    Orchestrator -- "2. Fetch Video Info" --> YouTube
    YT_Tools -- "3. Get CC/Subs" --> YouTube
    
    Orchestrator -- "4. Send Transcript" --> Gemini
    Gemini -- "5. Return JSON (Vocab, Patterns)" --> Orchestrator
    
    Orchestrator -- "6. Update 'completed' status" --> DB
```

---

## 2. Presentation Slide Content

Use the following sections as content for your presentation slides.

### 🖼️ Slide 1: High-Level Technology Stack

**Frontend Experience (Client-Side)**
*   **Core**: React 18 + Vite (Blazing fast performance)
*   **Visuals**: Tailwind CSS + Framer Motion (Smooth, modern UI)
*   **Interaction**: Lucide Icons + React Youtube (Seamless integration)
*   **Data Viz**: Recharts (Learning progress visualization)

**Backend & Infrastructure (Serverless)**
*   **Platform**: Supabase (The Open Source Firebase Alternative)
*   **Database**: PostgreSQL (Robust relational data)
*   **Realtime**: WebSocket updates for instant feedback
*   **Auth**: Secure user management

**AI & Data Engineering (The Brain)**
*   **Model**: Google Gemini 1.5 Pro / Flash (GenAI SDK)
*   **Pipeline**: Custom Python Worker
*   **Extraction**: `yt-dlp` + `YouTube Transcript API`
*   **Resilience**: Auto-retry mechanisms & API Key rotation

---

### ⚙️ Slide 2: The "Magic" Workflow (Data Pipeline)

1.  **Ingestion**: User pastes a YouTube link. The Frontend instantly creates a record in Supabase with status `pending`.
2.  **Detection**: The Python Worker, listening to the database queue, picks up the task immediately.
3.  **Extraction**: The Worker uses `yt-dlp` to fetch metadata (Title, Thumbnail) and `YouTube Transcript API` to pull the subtitles.
4.  **Cognition**: The raw transcript is sent to **Google Gemini 1.5 Pro** with a specialized prompt to extract:
    *   CEFR Level
    *   Key Vocabulary (with definitions)
    *   Sentence Patterns
5.  **Completion**: The structured JSON data is written back to Supabase.
6.  **Notification**: The Frontend receives a Realtime event, and the card updates from "Processing" to "Ready" without a page refresh.

---

### 🛡️ Slide 3: Robustness & Error Handling

*   **Result Queue Pattern**: Uses Supabase as a reliable persistent queue. Tasks are never lost, even if the worker restarts.
*   **Smart Retry**: If Gemini is overloaded (Error 429), the system automatically rotates API keys and retries with exponential backoff.
*   **Graceful Degradation**: If a video has no captions, the system tags it as an error with a clear message to the user, preventing the worker from crashing.
