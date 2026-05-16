import fitz  # PyMuPDF
import chromadb
from sentence_transformers import SentenceTransformer
from typing import List
import hashlib
import re
import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"

# Singleton model (loaded once)
_model = None
_client = None
_collection = None

def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")
    return _model

def get_collection(session_id: str):
    global _client
    if _client is None:
        _client = chromadb.Client()  # in-memory, ephemeral
    collection_name = f"vidya_{session_id}"
    try:
        return _client.get_collection(collection_name)
    except:
        return _client.create_collection(collection_name)

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    # Clean up whitespace
    text = re.sub(r'\n+', '\n', text)
    text = re.sub(r' +', ' ', text)
    
    words = text.split()
    chunks = []
    start = 0
    
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk = " ".join(words[start:end])
        if len(chunk.strip()) > 50:  # skip tiny chunks
            chunks.append(chunk)
        start += chunk_size - overlap
    
    return chunks

def ingest_pdf(pdf_bytes: bytes, session_id: str) -> int:
    text = extract_text_from_pdf(pdf_bytes)
    chunks = chunk_text(text)
    
    model = get_model()
    collection = get_collection(session_id)
    
    # Clear existing docs for this session
    try:
        existing = collection.get()
        if existing["ids"]:
            collection.delete(ids=existing["ids"])
    except:
        pass
    
    embeddings = model.encode(chunks, show_progress_bar=False).tolist()
    
    ids = [hashlib.md5(f"{session_id}_{i}".encode()).hexdigest() for i in range(len(chunks))]
    
    collection.add(
        documents=chunks,
        embeddings=embeddings,
        ids=ids
    )
    
    return len(chunks)