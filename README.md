# Point of Instability — TheMissionDoor

โปรเจกต์นี้เป็น **Mission Management Web Application** สำหรับสร้าง, จัดการ, และเข้าร่วมภารกิจร่วมกันเป็นทีม

---

## 🚀 Tech Stack

### Core Stack

| Layer | Technology | รายละเอียด |
|-------|-----------|------------|
| **Frontend** | Angular 21 + TypeScript | SPA Framework, ใช้ Signals, Standalone Components |
| **Backend** | Rust (Axum Web Framework) | REST API, ใช้ Diesel ORM |
| **Database** | PostgreSQL (via Supabase) | Relational DB, host บน Supabase |
| **Runtime** | npm | JavaScript package manager & script runner |
| **Styling** | SCSS / CSS | Custom styling, responsive design |
| **Storage** | Cloudinary | เก็บ media assets เช่น avatar |
| **Deployment** | Docker + Render | Containerize ด้วย Docker, deploy บน Render |

### Dev Environment

| Tool | การใช้งาน |
|------|----------|
| **Antigravity IDE** | AI-assisted coding IDE (ใช้เป็นหลัก) |
| **Postman** | ทดสอบ API |
| **Podman** | Container management |
| **GitHub** | Version control & repository |

### AI Intelligence

| AI | การใช้งาน |
|----|----------|
| **Gemini 3 Pro** | AI coding assistant |
| **Claude Opus 4.5** | AI coding assistant |

---

## 📐 สถาปัตยกรรมโปรเจกต์ (Project Architecture)

```
Point_of_instability/
├── client/                          ← Angular 21 Frontend
│   └── src/
│       ├── app/
│       │   ├── home/                (หน้าหลัก - Globe animation)
│       │   ├── missions/            (Browse Missions)
│       │   │   └── mission-manager/ (My Missions - CRUD + Crew)
│       │   ├── navbar/              (Navigation bar)
│       │   ├── _services/           (API services - MissionService, PassportService)
│       │   ├── _models/             (TypeScript interfaces)
│       │   ├── _interceptor/        (JWT & Error interceptors)
│       │   └── _guards/             (Auth guard)
│       ├── environments/            (Dev/Prod config)
│       └── styles.css               (Global styles)
│
└── server/                          ← Rust (Axum) Backend
    └── src/
        ├── application/             (Use Cases - Business Logic)
        │   └── use_cases/
        │       ├── crew_operation   (Join, Leave, Kick)
        │       ├── mission_operation (Start, Complete, Fail)
        │       └── mission_management (CRUD)
        ├── domain/                  (Core Domain)
        │   ├── entities/            (Mission, Brawler, CrewMemberships)
        │   ├── repositories/        (Repository traits/interfaces)
        │   └── value_objects/       (MissionStatuses, Filters, Models)
        └── infrastructure/          (External Implementations)
            ├── http/                (Axum routers + middleware)
            │   ├── routers/         (API route handlers)
            │   └── middleware/      (JWT authorization)
            └── database/            (Diesel PostgreSQL repos)
```

> **Clean Architecture:** Backend แยก 3 layers — Domain (core), Application (use cases), Infrastructure (DB + HTTP)

---

## ⚙️ วิธีการรัน

```bash
# 1. รัน Backend Server
cd server
cargo run

# 2. รัน Frontend Client
cd client
npm start
```

---

## 🗄️ Database Schema

| Table | คำอธิบาย |
|-------|----------|
| `brawlers` | ผู้ใช้ (id, username, password, display_name, avatar_url) |
| `missions` | ภารกิจ (id, name, status, chief_id, max_crew, deadline, duration) |
| `crew_memberships` | ความสัมพันธ์ brawler ↔ mission |

**Mission Status Flow:**
```
Open → In Progress → Completed
  ↓                     ↓
Failed ←────────────────┘
```

---

## 🔗 API Endpoints

| Endpoint | Method | คำอธิบาย |
|----------|--------|----------|
| `/api/authentication/login` | POST | เข้าสู่ระบบ |
| `/api/brawlers/register` | POST | สมัครสมาชิก |
| `/api/brawlers/my-missions` | GET | ดู missions ของตัวเอง |
| `/api/brawlers/missions/{id}/brawlers` | GET | ดูสมาชิกใน mission |
| `/api/mission-viewing` | GET | ดู missions ทั้งหมด (พร้อม filter) |
| `/api/mission-management` | POST/PATCH/DELETE | CRUD missions |
| `/api/mission-operation/in-progress/{id}` | PATCH | เริ่ม mission |
| `/api/mission-operation/to-completed/{id}` | PATCH | จบ mission สำเร็จ |
| `/api/mission-operation/to-failed/{id}` | PATCH | จบ mission ล้มเหลว |
| `/api/crew-operation/join/{id}` | POST | เข้าร่วม mission |
| `/api/crew-operation/leave/{id}` | DELETE | ออกจาก mission |
| `/api/crew-operation/kick/{id}/{brawler_id}` | DELETE | เตะสมาชิกออก |

---

## 🎯 ระบบการทำงานหลัก (System Features)

### 1️⃣ ระบบ Authentication

- **Login/Register** ผ่าน JWT Token
- JWT Interceptor แนบ token ทุก request อัตโนมัติ
- Error Interceptor จัดการ 401/403/500 แบบ centralized
- Auth Guard ป้องกันหน้าที่ต้อง login

### 2️⃣ ระบบ Mission Management (Chief)

| Action | เงื่อนไข |
|--------|---------|
| สร้าง Mission | กำหนดชื่อ, คำอธิบาย, max crew, duration |
| แก้ไข Mission | เจ้าของ mission เท่านั้น |
| ลบ Mission | เจ้าของ mission เท่านั้น |
| Start Mission | Chief เท่านั้น, status ต้อง Open/Failed |
| Complete Mission | Chief เท่านั้น, status ต้อง InProgress |
| Fail Mission | Chief เท่านั้น, status ต้อง InProgress |

### 3️⃣ ระบบ Crew Operation

| Action | สิทธิ์ | เงื่อนไข Status |
|--------|-------|----------------|
| Join Mission | ทุกคน (ยกเว้น Chief) | Open, Failed |
| Leave Mission | สมาชิกที่ join | Open, Failed, Completed |
| Kick Member | Chief เท่านั้น | ทุก status ยกเว้น InProgress |
| ดู Crew Members | ทุกคน | ทุก status |

### 4️⃣ ระบบนับถอยหลัง (Countdown Timer)

```
Chief ตั้ง duration (เช่น 2d 3h) → กด Start → Backend คำนวณ deadline → Frontend นับถอยหลัง real-time
```

- **Backend:** `deadline = เวลาปัจจุบัน + duration` → บันทึกลง DB
- **Frontend:** `setInterval` ทุก 1 วินาที, แสดง countdown สด
- ⚠️ เหลือน้อยกว่า 24 ชม. → แสดงสี urgent
- ❌ หมดเวลา → แสดง "Expired"

### 5️⃣ ระบบ Auto Status (Mission Full)

- เมื่อ crew เต็ม `max_crew` → status เปลี่ยนเป็น `Failed` อัตโนมัติ
- เมื่อ crew leave หรือถูก kick → ถ้าเดิม Full → status กลับเป็น `Open`

### 6️⃣ หน้า Browse Missions

- แสดงเฉพาะ missions ที่ status เป็น `Open`
- กดปุ่ม Join เพื่อเข้าร่วม mission
- ป้องกัน join ซ้ำ (duplicate key check)

### 7️⃣ หน้า My Missions

- **Missions You're Leading:** missions ที่ตัวเองเป็น Chief → CRUD + Start/Complete/Fail
- **Joined Missions:** missions ที่เข้าร่วม → Leave ได้

---

## 📊 สรุปตารางสิทธิ์

| Feature | API Endpoint | สิทธิ์ | เงื่อนไข Status |
|---------|-------------|-------|----------------|
| Start Mission | `PATCH /mission-operation/in-progress/{id}` | Chief เท่านั้น | Open, Failed |
| Complete Mission | `PATCH /mission-operation/to-completed/{id}` | Chief เท่านั้น | InProgress |
| Fail Mission | `PATCH /mission-operation/to-failed/{id}` | Chief เท่านั้น | InProgress |
| ดู Crew Members | `GET /brawlers/missions/{id}/brawlers` | ทุกคน | ทุก status |
| Join Mission | `POST /crew-operation/join/{id}` | ทุกคน (ยกเว้น Chief) | Open, Failed |
| Leave Mission | `DELETE /crew-operation/leave/{id}` | สมาชิก | Open, Failed, Completed |
| Kick Member | `DELETE /crew-operation/kick/{id}/{brawler_id}` | Chief เท่านั้น | ทุก status ยกเว้น InProgress |

---

## 🤖 Work With AI

### Model AI ที่ใช้ในโปรเจกต์

- **Gemini 3 Pro (Low)** — ใช้งานทั่วไป, วางแผน, debug
- **Gemini 3 Pro (Flash)** — งานเร็ว, แก้ไขเล็กน้อย
- **Claude Sonnet 4.5** — งาน complex, refactor, architecture
- **Claude Opus 4.5** — งาน deep analysis, large-scale implementation

### Token Usage Summary

| หมวดหมู่ | Token Range |
|---------|-------------------|
| UI/Theme Development | 140,000–180,000 |
| Bug Fixes | 80,000–120,000 |
| Feature Implementation | 40,000–100,000 |
| Investigation/Debug | 30,000–80,000 |

