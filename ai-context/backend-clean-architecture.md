# Backend Architecture: Clean Architecture Specification

## Overview
To ensure scalability, testability, and separation of concerns, the backend logic of the Next.js application will follow **Clean Architecture** principles. This separates business rules (Domain) from implementation details (Frameworks, Databases, External APIs).

## Folder Structure (`src/`)

We will introduce 3 new core directories alongside the existing `app/` folder.

```
src/
├── domain/                  # Enterprise Business Rules (Types & Logic)
│   ├── entities/            # Core business objects
│   └── repositories/        # Interfaces (Contracts) for data access
├── application/             # Application Business Rules (Use Cases)
│   ├── use-cases/           # Specific user intents/actions
│   └── dtos/                # Data Transfer Objects (Input/Output definitions)
├── infrastructure/          # Interface Adapters & Frameworks
│   ├── repositories/        # Concrete implementations of repositories (Supabase)
│   ├── gateways/            # Concrete implementations of external services (SDXL, Mailer)
│   └── services/            # Generic services (Storage, Logger)
└── app/                     # Presentation Layer (Next.js App Router)
    ├── (actions)/           # Server Actions (Entry points)
    └── api/                 # API Routes (Entry points for Webhooks)
```

## Layer Details

### 1. Domain Layer (`src/domain`)
**Dependency Rule**: Does NOT depend on any other layer. Pure TypeScript.
-   **Entities**: Classes or Types that encapsulate critical business rules.
    -   *Example*: `GenerationRequest.ts` (Ensures width/height are valid SDXL dimensions), `UserCredit.ts`.
-   **Repository Interfaces**: Contracts defining *what* data operations are needed, not *how*.
    -   *Example*: `IGenerationRepository.ts`, `IUserRepository.ts`, `ISdxlGateway.ts`.

### 2. Application Layer (`src/application`)
**Dependency Rule**: Depends ONLY on Domain.
-   **Use Cases**: Orchestrators that handle a specific user action. They contain the application-specific business rules.
    -   *Example*: `CreateGenerationJob.ts`.
    -   *Logic*:
        1. Validate Input.
        2. Check User Credit (via `IUserRepository`).
        3. Save Job State (via `IGenerationRepository`).
        4. Send to SDXL (via `ISdxlGateway`).
        5. Deduct Credit (via `IUserRepository`).

### 3. Infrastructure Layer (`src/infrastructure`)
**Dependency Rule**: Depends on Domain and Application (for interfaces).
-   **Repositories**: Actual code that calls Supabase/Postgres.
    -   *Example*: `SupabaseGenerationRepository.ts` (Implements `IGenerationRepository`).
-   **Gateways**: Actual code that makes HTTP requests to SDXL Server or external APIs.
    -   *Example*: `HttpSdxlGateway.ts` (Implements `ISdxlGateway` using `fetch`).
-   **Services**: Implementations like `MinioStorageService`.

### 4. Presentation Layer (`src/app`)
**Dependency Rule**: The Entry Point. Connects UI/HTTP to the Application Layer.
-   **Server Actions**: Instead of containing logic, they act as Controllers.
    -   Instantiate the Report/Gateway/UseCase.
    -   Execute the Use Case.
    -   Return standardized Response/Error to UI.

---

## Example Flow: "Generate Image"

### 1. Domain Interface (`src/domain/repositories/ISdxlGateway.ts`)
```typescript
export interface ISdxlGateway {
  enqueueJob(jobId: string, params: GenerationParams): Promise<boolean>;
}
```

### 2. Application Use Case (`src/application/use-cases/CreateGeneration.ts`)
```typescript
export class CreateGeneration {
  constructor(
    private generationRepo: IGenerationRepository,
    private userRepo: IUserRepository,
    private sdxlGateway: ISdxlGateway
  ) {}

  async execute(userId: string, params: InputDto) {
    // 1. Check Credits
    const balance = await this.userRepo.getBalance(userId);
    if (balance < 1) throw new Error("Insufficient credits");

    // 2. Create Job Record
    const job = await this.generationRepo.create({
      userId,
      status: 'QUEUED',
      params
    });

    // 3. Send to SDXL Server
    await this.sdxlGateway.enqueueJob(job.id, params);

    // 4. Deduct Credit
    await this.userRepo.deductCredit(userId, 1);

    return job;
  }
}
```

### 3. Usage in Next.js Server Action (`src/app/actions/generate.ts`)
```typescript
'use server'

import { CreateGeneration } from "@/application/use-cases/CreateGeneration";
import { SupabaseGenerationRepository } from "@/infrastructure/repositories/SupabaseGenerationRepository";
// ... imports

export async function generateAction(params) {
  // Dependency Injection
  const generationRepo = new SupabaseGenerationRepository();
  const userRepo = new SupabaseUserRepository();
  const sdxlGateway = new HttpSdxlGateway(process.env.SDXL_URL);

  const useCase = new CreateGeneration(generationRepo, userRepo, sdxlGateway);
  
  try {
    const result = await useCase.execute(await getAuthUserId(), params);
    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
```

## Benefits for Flash-SDXL
1.  **Decoupling**: We can switch SDXL to another provider (e.g., Replicate/OpenAI) just by changing the `Gateway` implementation, without touching the core Use Case logic.
2.  **Testability**: We can write Unit Tests for `CreateGeneration` by mocking the Repositories/Gateways, verifying credit logic without needing a running database or GPU server.
3.  **Clarity**: New developers know exactly where to look:
    -   Business Logic? -> `application/use-cases`
    -   Database Query? -> `infrastructure/repositories`
