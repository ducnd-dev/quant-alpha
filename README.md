# Alpha Quant

Alpha Quant là một dự án về phân tích định lượng (quantitative analysis) trong lĩnh vực tài chính.

## Cấu trúc dự án

- **backend**: FastAPI backend với PostgreSQL và Redis
- **frontend**: Next.js frontend

## Yêu cầu

- Docker và Docker Compose
- Git

## Cài đặt

```bash
# Clone repository
git clone [repository_url]
cd alpha-quant

# Khởi chạy dự án với Docker Compose
docker-compose up -d
```

## Dịch vụ

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Môi trường phát triển

### Backend

```bash
cd backend
python -m venv env
source env/bin/activate  # Trên Windows: env\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```