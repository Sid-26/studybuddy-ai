import requests

# config
OLLAMA_API_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3.1:8b"

def _query_ollama(prompt, system_prompt): # helper function to interop with ollama
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "system": system_prompt,
        "stream": False
    }
    try:
        response = requests.post(OLLAMA_API_URL, json=payload)
        response.raise_for_status()
        return response.json().get('response', '')
    except requests.exceptions.RequestException as e:
        print(f"Ollama Connection Error: {e}")
        return "Error connecting to LLM. Is Ollama running?"

def chat(context, query):
    system_prompt = (
        "You are a helpful study assistant. "
        "You must answer questions based ONLY on the provided context. "
        "If the answer is not in the context, state clearly that you cannot find the information."
    )
    
    full_prompt = f"Context from notes:\n{context}\n\nQuestion: {query}\nAnswer:"
    
    return _query_ollama(full_prompt, system_prompt)

def generate_flashcards(context):
    system_prompt = (
        "You are a study aid generator. "
        "Output ONLY valid JSON. "
        "Do not include markdown formatting (like ```json), introductions, or explanations."
    )
    
    prompt = f"""
    Based on the following text, generate 3 study flashcards.
    Format strictly as a JSON array of objects: [{{"front": "question", "back": "answer"}}, ...]
    
    Text: {context}
    """
    
    return _query_ollama(prompt, system_prompt)

def generate_quiz(context):
    system_prompt = (
        "You are a quiz generator. "
        "Output ONLY valid JSON. "
        "Do not include markdown formatting (like ```json), introductions, or explanations."
    )
    
    prompt = f"""
    Generate 3 multiple choice questions based on this text.
    Format strictly as a JSON array: 
    [{{"question": "...", "options": ["A", "B", "C", "D"], "correct_answer": "A"}}, ...]
    
    Text: {context}
    """
    
    return _query_ollama(prompt, system_prompt)