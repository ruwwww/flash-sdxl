# Frontend Specifications (Next.js)

## 1. UI/UX Philosophy
-   **Framework**: Next.js 14+ (App Router).
-   **Components**: Shadcn UI + Tailwind CSS.
-   **Theme**: Dark Mode default (Cyberpunk/Technical aesthetic fitting for "Flash SDXL").
-   **Responsiveness**: Fully responsive, but optimized for Desktop control panels.

## 2. Navigation Structure

### Public
-   `/login`, `/sign-up`: Auth screens.
-   `/`: Landing page (Redirects to /generate if logged in).

### Protected (User)
Layout: Sidebar Navigation (Left), Main Content (Right).
-   **/generate** (Main Workspace)
    -   **Left Panel**: Parameters (Prompt, Neg Prompt, Seed, Ratio, Steps, CFG).
    -   **Right Panel**: Result Viewer (Latest generation, progress bar).
    -   **Bottom Strip**: Quick history (thumbnails of last 10 session images).
-   **/history**
    -   Infinite scroll grid of all past generations.
    -   Filter by date, prompt.
    -   Click to view details (Prompt, Seed) + "Remix" button (copy params to Generate page).
-   **/settings**
    -   User Profile (Change password).
    -   API Key management (if applicable in future).

### Protected (Admin & Superadmin)
-   **/admin/dashboard**
    -   Stats: Total generated images, GPU uptime, error rates.
-   **/admin/users**
    -   User list, Credit management (Give/Take credits).
-   **/admin/configuration**
    -   **Model Management**: Select active Checkpoint (Dropdown from available files).
    -   **LoRA Management**: Upload/Toggle LoRA.
    -   **System Tuning**: Batch size limits, timeout settings.

## 3. Key Components & Logic

### Generation Workspace (`/generate`)
-   **Status Indicator**:
    -   *Socket/Polling listener*: Listens for `job_id` status updates.
    -   States: `Idle` -> `Queuing` -> `Processing (x%)` -> `Finished`.
-   **Image Viewer**:
    -   Uses `next/image` allowing optimization.
    -   Displays `blurDataURL` or placeholder while loading from MinIO.

### Auth & Credits
-   **Middleware**: Strict route protection.
-   **Context**: `UserProvider` keeps track of Credit Balance.
    -   Optimistic UI: When user clicks "Generate", subtract -1 credit visually immediately.
    -   Rollback if server returns error.

## 4. State Management
-   **Server State (React Query / TanStack Query)**:
    -   Fetching History.
    -   Fetching Configs.
-   **Form State (React Hook Form + Zod)**:
    -   Complex validation for generation parameters (e.g., specific resolutions).
-   **Global UI State (Zustand)**:
    -   Sidebar toggles.
    -   Active "Job" monitoring across pages.

## 5. Mocking for Development
-   Since SDXL Server might not be running during FE Dev:
    -   `MSW` (Mock Service Worker) to simulate `/generate` response delays.
    -   Mock WebSocket messages to test Progress Bar animations.