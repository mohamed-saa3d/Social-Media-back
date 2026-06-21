## System Architecture Highlights

This backend is engineered with a layered, modular architecture focused on enterprise-level maintainability, robust security protocols, and long-term extensibility. The system is designed to handle complex relationships, real-time data readiness, and secure session management.

### Architecture Metrics

| Metric                      | Value                                    |
| --------------------------- | ---------------------------------------- |
| **Codebase Scale** | 11,000+ Lines of Code (90+ Modules)      |
| **Core Database Models** | 11 Dedicated Mongoose Schemas            |
| **Total API Endpoints** | ~50 Standardized OpenAPI Routes          |
| **Protected API Routes** | 25 Secure Endpoints                      |
| **Security Mechanisms** | 12+ Active Implementations               |
| **Custom Middlewares** | 6 Core Handlers (Auth, Validation, etc.) |
| **Testing Frameworks** | 2                                        |
| **Production Readiness** | Advanced / Portfolio Level               |

### Comprehensive Security Coverage

The system implements a defense-in-depth approach, utilizing industry-standard packages and custom logic:

* **Advanced Authentication:** Cookie-based JWT Access & Refresh Token Rotation.
* **Session Management:** Multi-device session tracking, manual revocation, and Token Blacklisting.
* **Verification Flows:** OTP-based email verification and password recovery.
* **Granular Authorization:** Dual-layer protection (Role-Based Admin Access + Owner-Based Resource Access).
* **Network Security:** HTTP header hardening via `helmet` and strict `cors` policies.
* **Traffic Control:** Multi-layered rate limiting (`express-rate-limit` & `rate-limiter-flexible`) to prevent brute-force and DDoS attacks.
* **Data Integrity:** Strict request payload validation using `express-validator`.
* **Media Security:** Controlled file uploads with `multer` (File type, MIME, and size validation).
* **Data Privacy:** Secure password hashing with `bcryptjs` and centralized, leak-proof error handling.

### 🧩 Core Domain Models
The database architecture is strictly normalized and indexed across 11 core domains:
`User`, `Post`, `Comment`, `Follow`, `SavedPost`, `Notification`, `Report`, `Session`, `OTP`, `RefreshToken`, and `BlacklistedToken`.

### ⚙️ Engineering Focus Areas

This project prioritizes modern backend engineering principles:

* **Clean Architecture & Separation of Concerns:** Logic is strictly divided across routers, controllers, services, and isolated middlewares.
* **Security-First Design:** Zero-trust approach on all data-mutating endpoints.
* **Robust Error Handling:** Custom `asyncHandler` and global error middlewares ensure the system never crashes ungracefully.
* **Scalable API Development:** OpenAPI/Swagger compliant documentation reflecting the exact runtime state.

### Scalability Readiness

The current codebase sets a strong foundation for future high-availability upgrades:

* Redis Distributed Caching (Ready for integration)
* Socket.IO Realtime Infrastructure (Notifications & Chat)
* CDN Media Delivery & Object Storage (AWS S3 Compatible)
* Horizontal Scaling & Containerization (Docker)
* CI/CD Deployment Pipelines

### Frontend Repository Context

The frontend application is maintained separately and follows an enterprise-grade feature-based architecture.

* **Frontend Stack:** React, Vite, TypeScript, Zustand, TanStack Query, Axios, React Hook Form, Zod.
* **Features:** Realtime Chat, Infinite Scrolling, Optimistic Updates, Media Upload Previews, SOLID Design Principles.
* **Repository Separation:** * *Backend (This Repo)* → API, Security, Data Layer, Session State.
  * *Frontend Repo* → UI, Client State Management, Realtime Experience.
