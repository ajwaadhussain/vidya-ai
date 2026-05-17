from pipeline import simple_embed, get_collection
from typing import List

def retrieve_chunks(query: str, session_id: str, top_k: int = 3) -> List[str]:
    collection = get_collection(session_id)
    query_embedding = simple_embed(query)
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k
    )
    return results.get("documents", [[]])[0]