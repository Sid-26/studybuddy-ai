# Use a lightweight Python base
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# 1. Install System Dependencies
# - tesseract-ocr: For reading text from images
# - poppler-utils: For converting PDF pages to images
# - libgl1: Required by cv2/image libraries often used with OCR
# - curl: For healthchecks
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    poppler-utils \
    libgl1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Python Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3. Copy Application Code
COPY . .

# 4. Expose the port Flask runs on
EXPOSE 9000

# 5. Run the application
CMD ["python", "app.py"]