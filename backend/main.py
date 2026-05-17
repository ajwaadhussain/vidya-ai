from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv
from pipeline import ingest_pdf
from retriever import retrieve_chunks
from fastapi.middleware.cors import CORSMiddleware
import os
os.environ["SENTENCE_TRANSFORMERS_HOME"] = "/tmp/st_models"

load_dotenv()

app = FastAPI(title="Vidya AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
    expose_headers=["*"],
)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma3:4b")  # adjust to your pulled model name
HF_API_TOKEN = os.getenv("HF_API_TOKEN", "")
HF_MODEL = os.getenv("HF_MODEL", "google/gemma-3-4b-it")  # cloud fallback

class QuestionRequest(BaseModel):
    session_id: str
    question: str

class AnswerResponse(BaseModel):
    answer: str
    source: str  # "ollama" or "huggingface"
    chunks_used: int

# ── Upload endpoint ────────────────────────────────────────────────────────────

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...), session_id: str = "default"):
    print(f"UPLOAD session_id: {session_id}")
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files accepted.")
    
    pdf_bytes = await file.read()
    if len(pdf_bytes) > 50 * 1024 * 1024:  # 50MB cap
        raise HTTPException(status_code=400, detail="File too large. Max 50MB.")
    
    chunk_count = ingest_pdf(pdf_bytes, session_id)
    
    return {
        "status": "ok",
        "session_id": session_id,
        "chunks_indexed": chunk_count,
        "message": f"PDF processed into {chunk_count} chunks. Ready to answer questions."
    }

# ── Ask endpoint ───────────────────────────────────────────────────────────────

@app.post("/ask", response_model=AnswerResponse)
async def ask_question(req: QuestionRequest):
    print(f"ASK session_id: {req.session_id}")
    chunks = retrieve_chunks(req.question, req.session_id, top_k=3)
    
    if not chunks:
        raise HTTPException(status_code=404, detail="No PDF uploaded for this session. Upload a PDF first.")
    
    context = "\n\n---\n\n".join(chunks)
    
    prompt = f"""You are Vidya AI, a helpful tutor for Indian students using NCERT textbooks.
Answer the student's question using ONLY the context provided from their textbook.
If the answer isn't in the context, say so honestly — do not make things up.
Keep your answer clear, concise, and helpful for a student.
Use simple language suitable for a school student. Use bullet points where helpful.

Context from textbook:
{context}

Student's question: {req.question}

Answer:"""
    
    # Try Ollama first
    answer, source = await query_ollama(prompt)
    
    # Fall back to HuggingFace if Ollama fails
    if answer is None:
        answer, source = await query_groq(prompt)
    
    if answer is None:
        raise HTTPException(status_code=503, detail="No LLM available. Start Ollama locally or set HF_API_TOKEN.")
    
    return AnswerResponse(answer=answer, source=source, chunks_used=len(chunks))

# ── LLM helpers ────────────────────────────────────────────────────────────────

async def query_ollama(prompt: str):
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.3,
                        "num_predict": 512
                    }
                }
            )
            response.raise_for_status()
            data = response.json()
            return data.get("response", "").strip(), "ollama"
    except Exception as e:
        print(f"Ollama error: {e}")
        return None, None

async def query_gemini(prompt: str):
    try:
        GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
        if not GEMINI_API_KEY:
            return None, None
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}",
                json={
                    "contents": [{"parts": [{"text": prompt}]}]
                }
            )
            response.raise_for_status()
            data = response.json()
            answer = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            return answer, "gemma"
    except Exception as e:
        print(f"Gemini API error: {e}")
        return None, None

async def query_groq(prompt: str):
    try:
        GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
        if not GROQ_API_KEY:
            return None, None
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.1-8b-instant",
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 512,
                    "temperature": 0.3
                }
            )
            response.raise_for_status()
            data = response.json()
            answer = data["choices"][0]["message"]["content"].strip()
            return answer, "gemma"
    except Exception as e:
        print(f"Groq error: {e}")
        return None, None

# ── Health check ───────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    ollama_alive = False
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.get(f"{OLLAMA_URL}/api/tags")
            ollama_alive = r.status_code == 200
    except:
        pass
    
    return {
        "status": "ok",
        "ollama": ollama_alive,
        "hf_configured": bool(HF_API_TOKEN)
    }