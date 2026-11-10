FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn psycopg[binary] psycopg2-binary

COPY . .

CMD ["sh", "-c", "python -c 'from app import init_db_and_admin; init_db_and_admin()' && exec gunicorn --preload -w 2 --threads 2 -b 0.0.0.0:5000 app:app"]