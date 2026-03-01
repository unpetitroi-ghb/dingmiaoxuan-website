# 万物识别视觉服务 - 用于云端/本地统一部署
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY vision_service.py .
# labels.txt 可选：若有则 COPY 进镜像，无则使用代码内 DEFAULT_LABELS

ENV PORT=5001
EXPOSE 5001

CMD ["python", "vision_service.py"]
