# Point of Instability

โปรเจกต์นี้เป็น Web Application สำหรับจัดการภารกิจ (Mission Management System)

## Tech Stack
- **Client:** Angular 19 + Angular Material
- **Server:** Rust (Axum + Diesel)
- **Database:** PostgreSQL

## วิธีการรัน
1. เข้าไปที่โฟลเดอร์ `server` แล้วรัน `cargo run`
2. เข้าไปที่โฟลเดอร์ `client` แล้วรัน `npm start`

---

## Database Schema

| Table | คำอธิบาย |
|-------|----------|
| `brawlers` | ผู้ใช้ (id, username, password, display_name, avatar_url) |
| `missions` | ภารกิจ (id, name, status, chief_id, max_crew, deadline, duration) |
| `crew_memberships` | ความสัมพันธ์ brawler ↔ mission |

**Mission Statuses:** `Open` → `In Progress` → `Completed` / `Failed`

---

## API Endpoints

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

## 🎯 Features หลัก

### 1️⃣ นับถอยหลังเมื่อ Chief กด Start Mission

**Flow:**
```
Chief ตั้ง duration (เช่น 2 วัน 3 ชม.) → กด Start → Backend คำนวณ deadline → Frontend นับถอยหลัง
```

**Backend (Rust):**
- **API:** `PATCH /api/mission-operation/in-progress/{mission_id}`
- เมื่อ Chief กด Start:
  1. ตรวจสอบว่า mission status เป็น `Open` หรือ `Failed`
  2. ตรวจสอบว่าผู้ขอเป็น Chief ของ mission นี้
  3. คำนวณ `deadline = เวลาปัจจุบัน + duration`
  4. อัปเดต status เป็น `In Progress` และบันทึก deadline ลง DB

**Frontend (Angular):**
- ใช้ `setInterval` ทุก 1 วินาทีเพื่ออัปเดต `now` signal
- `getCountdown()` คำนวณเวลาที่เหลือ (วัน/ชม./นาที/วินาที)
- ถ้าเหลือน้อยกว่า 24 ชม. → แสดงสี urgent
- ถ้าหมดเวลา → แสดง "Expired"

---

### 2️⃣ ดูสมาชิกที่ Join Mission

**Flow:**
```
Chief หรือ User กดดูสมาชิก → เปิด Dialog → โหลดรายชื่อ crew จาก API
```

**Backend (Rust):**
- **API:** `GET /api/brawlers/missions/{mission_id}/brawlers`
- ดึงรายชื่อ brawlers ทั้งหมดที่ join mission นี้จากตาราง `crew_memberships`

**Frontend (Angular):**
- `openCrewDialog()` เปิด dialog และโหลดสมาชิก
- `getCrewMembers()` ดึงข้อมูลจาก API
- แสดงรายชื่อใน dialog พร้อมปุ่ม Kick (ถ้าเป็น Chief)

---

### 3️⃣ Chief เตะสมาชิกออกจาก Mission

**Flow:**
```
Chief กดปุ่ม Kick → ยืนยัน → API ลบสมาชิกออก → อัปเดต UI
```

**Backend (Rust):**
- **API:** `DELETE /api/crew-operation/kick/{mission_id}/{brawler_id}`
- ตรวจสอบสิทธิ์:
  1. ผู้ขอต้องเป็น **Chief** ของ mission นี้
  2. Chief ไม่สามารถเตะตัวเองได้
  3. Mission status ต้องเป็น `Open` หรือ `Failed`
- ลบสมาชิกออกจาก `crew_memberships`
- ถ้า mission เต็ม (Failed) → เปลี่ยนกลับเป็น `Open`

**Frontend (Angular):**
- `kickMember()` เรียก API และอัปเดต UI ทันที
- แสดง confirmation dialog ก่อนเตะ
- รีเฟรช mission list หลังเตะสำเร็จ

---

## 📊 สรุปตารางสิทธิ์

| Feature | API Endpoint | สิทธิ์ | เงื่อนไข Status |
|---------|-------------|-------|----------------|
| Start Mission | `PATCH /mission-operation/in-progress/{id}` | Chief เท่านั้น | Open, Failed |
| ดู Crew Members | `GET /brawlers/missions/{id}/brawlers` | ทุกคน | ทุก status |
| Kick Member | `DELETE /crew-operation/kick/{id}/{brawler_id}` | Chief เท่านั้น | Open, Failed |