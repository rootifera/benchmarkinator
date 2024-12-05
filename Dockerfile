FROM python:3.11-slim

#ENV API_KEY="api_key_here"

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 12345

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "12345"]
