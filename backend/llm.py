import requests
import os

# config
OLLAMA_BASE_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434")
GENERATE_URL = f"{OLLAMA_BASE_URL}/api/generate"
CHAT_URL = f"{OLLAMA_BASE_URL}/api/chat"
MODEL_NAME = "llama3.1:8b"

# def _query_ollama(prompt, system_prompt): # helper function to interop with ollama
#     payload = {
#         "model": MODEL_NAME,
#         "prompt": prompt,
#         "system": system_prompt,
#         "stream": False
#     }
#     try:
#         response = requests.post(OLLAMA_API_URL, json=payload)
#         response.raise_for_status()
#         return response.json().get('response', '')
#     except requests.exceptions.RequestException as e:
#         print(f"Ollama Connection Error: {e}")
#         return "Error connecting to LLM. Is Ollama running?"
def _generate(prompt, system_prompt):
    """
    Helper for the /api/generate endpoint (Completion).
    Used for functional tasks like Flashcards and Quizzes.
    """
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "system": system_prompt,
        "stream": False
    }
    try:
        response = requests.post(GENERATE_URL, json=payload)
        response.raise_for_status()
        return response.json().get('response', '')
    except requests.exceptions.RequestException as e:
        print(f"Ollama Generate Error: {e}")
        return "Error connecting to LLM."

def _chat(messages):
    """
    Helper for the /api/chat endpoint (Conversational).
    Used for the Chat feature.
    """
    payload = {
        "model": MODEL_NAME,
        "messages": messages,
        "stream": False
    }
    try:
        response = requests.post(CHAT_URL, json=payload)
        response.raise_for_status()
        # Chat endpoint returns 'message' object inside 'message' key
        return response.json().get('message', {}).get('content', '')
    except requests.exceptions.RequestException as e:
        print(f"Ollama Chat Error: {e}")
        return "Error connecting to LLM."
    
def chat(context, query, chat_history=None):
    # 1. Define the System Prompt
    system_message = {
        "role": "system", 
        "content": (
            "You are a helpful study assistant. "
            "You must answer questions based ONLY on the provided context. "
            "If the answer is not in the context, state clearly that you cannot find the information."
        )
    }

    # 2. Build the Message Chain
    messages = [system_message]

    # 3. Append History (if provided)
    if chat_history:
        messages.extend(chat_history)

    # 4. Append the Latest User Query with RAG Context
    # We inject the context into the latest message so the model prioritizes it.
    user_message = {
        "role": "user", 
        "content": f"Context from notes:\n{context}\n\nQuestion: {query}"
    }
    messages.append(user_message)
    
    return _chat(messages)

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
    
    return _generate(prompt, system_prompt)

def generate_quiz(context):
    system_prompt = (
        "You are a quiz generator. "
        "Output ONLY valid JSON. "
        "Do not include markdown formatting (like ```json), introductions, or explanations."
    )
    
    prompt = f"""
    Generate 10 multiple choice questions based on this text.
    Format strictly as a JSON array: 
    [{{"question": "...", "options": ["A", "B", "C", "D"], "correct_answer": "A"}}, ...]
    
    Text: {context}
    """
    
    return _generate(prompt, system_prompt)