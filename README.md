# 📚 Study Companion LLM App

Siddhant Das, 100830959

December 2nd, 2025

CSCI 4440 - Topics in CS: AI Dev


A RAG-based companion study app where you can upload course notes (PDFs). Then using RAG, you can have a chat assistant, a flashcard generator and a quiz generator, the ultimate study app.

## 🛠 Tech Stack
Frontend: React (Vite) + TypeScript + Tailwind CSS

Backend: Flask (Python) + ChromaDB (Vector Database) + Tools like Tesseract, Poppler

LLM: Ollama (Llama 3.1:8b)

## 🚀 How to run the app

### Docker Method
Install Docker desktop app and run it 
Then run this command in the route directory:
```
docker compose up --build
```

To shutdown the app run this command or press `CTRL+C`:
```
docker compose down
```

Alternative manual method:
Note: Need to have python3.10+, npm, ollama installed

1. Manually start the backend: 
```
cd backend
pip install -r requirements.txt
python app.py
```
2. Manually start the frontend:
```
cd frontend
npm install
npm run dev
```
3. Manually run Ollama:
```
ollama pull llama3.1
ollama serve
```
- Frontend is running on `http://localhost:8080/` (you need to open this one)
- Backend is running on `http://localhost:9000/`
- Ollama is running on `http://localhost:11434/`


> [WARNING]
> Running Docker with Ollama is very slow, either manually run everthing or reconfigure to run Ollama without Docker