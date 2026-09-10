# Agent Skill Studio

Quản lý, tạo mới và setup **skill / agent** cho các nền tảng AI (Claude Code, GitHub Copilot,
OpenAI Codex, Cursor, Windsurf). Một định nghĩa duy nhất được biên dịch sang đúng định dạng
và đúng đường dẫn mà từng nền tảng yêu cầu.

## Mô hình dữ liệu

Đơn vị quản lý là **bộ skill (pack)**, không phải skill lẻ:

- **Template chuẩn** — Context Pack trong `.claude/` của repo này. Chỉ đọc, dùng làm khuôn
  để tạo pack mới. Ứng dụng không bao giờ sửa nó.
- **Pack** — một bộ skill độc lập. Tạo pack từ template sẽ **sao chép** skill thành các bản
  ghi mới với id riêng.
- Skill, agent và workflow luôn thuộc về **đúng một pack**. Hai pack có thể có skill trùng
  slug nhưng khác id hoàn toàn; sửa pack này không đụng pack kia, và agent chỉ gắn được
  skill nằm trong chính pack của nó (gắn chéo bị API từ chối).
- Xoá một pack sẽ xoá theo toàn bộ skill / agent / workflow bên trong nó.

- **Backend** — FastAPI + PostgreSQL, chạy bằng Docker.
- **Frontend** — Next.js 15 (App Router) + Tailwind + React Flow, chạy bằng Node.

## Kiến trúc

```
backend/                FastAPI, chạy trong Docker
  app/models/           Pack · Skill · Agent · Workflow (SQLAlchemy 2.0, JSONB)
  app/api/routes/       CRUD + compile + export, mọi thứ scope theo pack
  app/services/
    templates.py        Đọc Context Pack .claude/ thành template chỉ đọc
    packs.py            Tạo pack bằng cách sao chép skill của template
    platforms.py        Registry 6 nền tảng và đường dẫn file của từng nền tảng
    exporters/          Biên dịch sang từng định dạng đích
    workflow_compiler.py  Topological sort + phát hiện vòng lặp + sinh playbook
    seed.py             Tạo sẵn một pack mẫu cho lần chạy đầu
frontend/               Next.js chạy ngoài Docker
  src/app/              / (danh sách pack) · /templates · /packs/[packId]/{skills,agents,workflows,export}
  src/components/       SkillForm · AgentForm · WorkflowCanvas (kéo thả) · ExportPanel
docker-compose.yml      Postgres + API
```

## Chạy dự án

### 1. Backend (Docker)

```bash
docker compose up -d --build
curl http://localhost:8080/health
```

- API: <http://localhost:8080/api/v1>
- Swagger UI: <http://localhost:8080/docs>
- Postgres: `localhost:5433` (user/pass/db đều là `studio`)

Lần chạy đầu, nếu database rỗng, backend tạo sẵn một pack tên "Pack mẫu" bằng cách sao chép
template chuẩn trong `.claude/` — 15 skill, 1 agent và 1 workflow mẫu. Bản gốc trong `.claude/`
không bị đụng tới.

### 2. Frontend (Next.js)

```bash
cd frontend
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
npm run dev
```

Mở <http://localhost:3000>.

> API dùng cổng **8080** trên host (cổng 8000 hay bị chiếm sẵn). Đổi trong
> `docker-compose.yml` và `frontend/.env.local` nếu cần.

## Tính năng

### Quản lý bộ skill
Màn hình chính liệt kê các pack kèm số skill / agent / workflow. Tạo pack mới bằng cách chọn
template (Context Pack chuẩn hoặc pack trống); nhân bản pack tạo ra một bản fork độc lập.
Tab **Template chuẩn** xem được nội dung khuôn nhưng không sửa được.

### Quản lý skill
Nằm trong từng pack. Danh sách có tìm kiếm và lọc theo giai đoạn, kèm nhân bản và xoá. Form tạo/sửa skill gồm
metadata (code, stage, priority, owner, version, status), nội dung Markdown, chọn nền tảng
đích và các tuỳ chọn riêng của nền tảng (`applyTo` globs cho Copilot/Cursor, `allowed-tools`
cho Claude). Panel bên phải xem trước ngay file sẽ được sinh ra cho từng nền tảng.

### Quản lý agent
Agent = system prompt + bộ skill + danh sách công cụ + model. Chỉ chọn được skill nằm trong
cùng pack, xem trước file agent của từng nền tảng.

### Workflow kéo thả
Canvas React Flow với 6 loại node: `trigger`, `skill`, `agent`, `condition`, `tool`, `output`.

- Kéo node từ palette bên trái vào canvas (hoặc double-click để thêm nhanh).
- Nối các bước bằng cách kéo từ handle phải sang handle trái.
- Chọn một node để mở inspector bên phải: đổi nhãn, đổi loại, gắn skill/agent cụ thể,
  viết điều kiện và hướng dẫn riêng cho bước đó.
- Nút **Kiểm tra** sắp xếp topo các bước, phát hiện vòng lặp, cảnh báo node chưa gắn skill
  hoặc node cụt — chạy trên đúng trạng thái canvas hiện tại, không cần lưu trước.
- Nút **Lưu** ghi lại đồ thị kèm viewport.

### Xuất bundle
Xuất theo từng pack. Chọn skill / agent / workflow và các nền tảng, tải về một file zip đã đặt
sẵn đúng đường dẫn:

| Nền tảng | Skill | Agent | Workflow |
|---|---|---|---|
| Claude Code | `.claude/skills/<slug>/SKILL.md` | `.claude/agents/<slug>.md` | `.claude/commands/<slug>.md` |
| GitHub Copilot | `.github/instructions/<slug>.instructions.md` | `.github/chatmodes/<slug>.chatmode.md` | `.github/prompts/<slug>.prompt.md` |
| OpenAI Codex | `.codex/skills/<slug>.md` | `AGENTS.<slug>.md` | `.codex/prompts/<slug>.md` |
| Cursor | `.cursor/rules/<slug>.mdc` | `.cursor/rules/agent-<slug>.mdc` | `.cursor/rules/workflow-<slug>.mdc` |
| Windsurf | `.windsurf/rules/<slug>.md` | `.windsurf/rules/agent-<slug>.md` | `.windsurf/workflows/<slug>.md` |
| Generic | `agent-pack/skills/<slug>.md` | `agent-pack/agents/<slug>.md` | `agent-pack/workflows/<slug>.md` |

Giải nén zip vào gốc repo đích là dùng được ngay.

## API chính

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/v1/platforms` | Danh sách nền tảng và đường dẫn file |
| GET | `/api/v1/meta` | Stage, priority, status, loại node |
| GET | `/api/v1/stats?pack_id=` | Số liệu, lọc theo pack nếu truyền `pack_id` |
| CRUD | `/api/v1/packs` | Bộ skill, kèm `POST /{id}/duplicate` |
| GET | `/api/v1/packs/templates` | Template chỉ đọc |
| CRUD | `/api/v1/skills?pack_id=` | Skill, kèm `POST /{id}/duplicate` |
| CRUD | `/api/v1/agents?pack_id=` | Agent, gắn skill qua `skill_ids` |
| CRUD | `/api/v1/workflows?pack_id=` | Workflow |
| POST | `/api/v1/workflows/{id}/compile` | Biên dịch workflow đã lưu |
| POST | `/api/v1/workflows/validate` | Kiểm tra canvas chưa lưu |
| GET | `/api/v1/exports/{skills,agents,workflows}/{id}` | Xem trước file xuất |
| POST | `/api/v1/exports/bundle` | Tải zip của một pack (`pack_id` bắt buộc) |

## Thêm một nền tảng mới

1. Thêm một entry vào `PLATFORMS` trong [platforms.py](backend/app/services/platforms.py).
2. Viết module exporter trong [backend/app/services/exporters/](backend/app/services/exporters/)
   với ba hàm `skill_files` / `agent_files` / `workflow_files`
   (nếu định dạng là markdown + frontmatter thì tái sử dụng `mdc._make`).
3. Đăng ký vào `EXPORTERS` trong [registry.py](backend/app/services/exporters/registry.py).

Frontend tự động hiện nền tảng mới ở mọi màn hình vì nó đọc từ `/platforms`.

## Xử lý sự cố

**Giao diện không có CSS (trang hiện ra như HTML thô).** Thường do chạy `next build` trong
khi `next dev` đang chạy — cả hai ghi vào cùng thư mục `.next` và làm hỏng nó, khiến
`/_next/static/css/app/layout.css` trả về 404. Khắc phục:

```bash
cd frontend
rm -rf .next
npm run dev
```

Đừng chạy `npm run build` song song với `npm run dev`; dừng dev server trước.

**`Cannot connect to the Docker daemon`.** Máy dùng colima chứ không phải Docker Desktop:

```bash
colima start
```

**API không phản hồi ở cổng mong đợi.** Kiểm tra cổng có bị tiến trình khác chiếm không:

```bash
lsof -nP -iTCP:8080 -sTCP:LISTEN
```

## Dừng dự án

```bash
docker compose down          # giữ dữ liệu
docker compose down -v       # xoá luôn database
```
