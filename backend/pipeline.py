import fitz
import chromadb
import numpy as np
from typing import List
import hashlib
import re
import os

os.environ["TOKENIZERS_PARALLELISM"] = "false"

_client = None

def get_collection(session_id: str):
    global _client
    if _client is None:
        _client = chromadb.Client()
    collection_name = f"vidya_{session_id}"
    try:
        return _client.get_collection(collection_name)
    except:
        return _client.create_collection(collection_name)

def simple_embed(text: str, dim: int = 384) -> List[float]:
    text = text.lower()
    np.random.seed(abs(hash(text)) % (2**32))
    base = np.random.randn(dim)
    words = text.split()
    for word in words:
        np.random.seed(abs(hash(word)) % (2**32))
        base += np.random.randn(dim) * 0.1
    norm = np.linalg.norm(base)
    if norm > 0:
        base = base / norm
    return base.tolist()

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    text = re.sub(r'\n+', '\n', text)
    text = re.sub(r' +', ' ', text)
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk = " ".join(words[start:end])
        if len(chunk.strip()) > 50:
            chunks.append(chunk)
        start += chunk_size - overlap
    return chunks

def ingest_pdf(pdf_bytes: bytes, session_id: str) -> int:
    text = extract_text_from_pdf(pdf_bytes)
    chunks = chunk_text(text)
    collection = get_collection(session_id)
    try:
        existing = collection.get()
        if existing["ids"]:
            collection.delete(ids=existing["ids"])
    except:
        pass
    embeddings = [simple_embed(chunk) for chunk in chunks]
    ids = [hashlib.md5(f"{session_id}_{i}".encode()).hexdigest() for i in range(len(chunks))]
    collection.add(
        documents=chunks,
        embeddings=embeddings,
        ids=ids
    )
    return len(chunks)