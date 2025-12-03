import os
import time
import json
import re
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv 


# importing all the python modules as needed
import llm 
import rag 
import validate 
import telemetry 

# configs for flask app
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
load_dotenv()

app = Flask(__name__)
app.secret_key = 'super_secret_dev_key_change_in_prod'
CORS(app, supports_credentials=True, origins=["http://localhost:9000", "http://localhost:8080", "http://localhost:5173", "http://localhost:3000"])
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/')
def test():
    return "Hello, World!"

@app.route('/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    # Check for PDF extension
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Invalid file type. Only PDF files are allowed."}), 400
    
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Save file temporarily before processing
        file.save(filepath)
        
        # Call RAG module to process
        success, msg = rag.ingest_file(filepath, filename)
        
        # Clean up the file after processing 
        os.remove(filepath)
        
        if success:
            return jsonify({"message": msg, "filename": filename}), 200
        else:
            return jsonify({"error": msg}), 500

@app.route('/chat', methods=['POST'])
def chat():
    start_time = time.perf_counter()
    data = request.json
    query = data.get('query', '')

    is_safe, msg = validate.validate_query(query)

    # input query validation/safety check
    if not is_safe:
        telemetry.log("blocked", "/chat", len(query), 0, time.perf_counter() - start_time, success=False)
        return jsonify({"response": msg}), 400
    
    # RAG retrival logic
    context, sources = rag.retrieve_context(query)

    if not context:
        resp = "I couldn't find any sources. Please ensure you have uploaded at least one pdf or make sure the file is not corrupted."
        telemetry.log("rag_no_context", "/chat", len(query), 0, time.time() - start_time)
        return jsonify({"response":resp, "sources":[]})
    
    # Retrieve chat history from session (defaults to empty list)
    chat_history = session.get('chat_history', [])

    llm_history = [
        {"role": msg["role"], "content": msg["content"]} 
        for msg in chat_history
    ]
    
    # call model to generate response
    resp = llm.chat(context, query, llm_history)

    chat_history.append({"role": "user", "content": query})
    # Store the response AND the sources used for this specific answer
    chat_history.append({"role": "assistant", "content": resp, "sources": sources})

    # Limit to last 6 messages (3 turns) to prevent exceeding 4KB cookie limit
    session['chat_history'] = chat_history[-6:]
    
    telemetry.log("rag", "/chat", len(query), len(resp), time.perf_counter() - start_time)

    return jsonify({"response": resp, "sources": sources}), 200

@app.route('/generate_flashcards', methods=['POST'])
def generate_flashcards():
    start_time = time.perf_counter()
    
    # Get context from RAG
    context = rag.get_random_context(n=5)
    
    if not context:
        return jsonify({"error": "No documents uploaded to generate cards from"}), 400
    
    # Generate via LLM module
    response = llm.generate_flashcards(context)
    
    # Attempt to parse JSON
    try:
        # regex to find the array part if LLM yaps
        match = re.search(r'\[.*\]', response, re.DOTALL)
        if match:
            flashcards = json.loads(match.group())
        else:
            flashcards = []
    except:
        flashcards = [{"front": "Error parsing LLM output", "back": "Please try again"}]

    telemetry.log("rag","/generate_flashcards", 0, len(response), time.perf_counter() - start_time)
    return jsonify({"flashcards": flashcards})

@app.route('/generate_quiz', methods=['POST'])
def generate_quiz():
    start_time = time.perf_counter()
    
    # Getting context from RAG
    context = rag.get_random_context(n=5)
    
    if not context:
        return jsonify({"error": "No documents uploaded"}), 400
    
    # generating quiz via llm
    response = llm.generate_quiz(context)
    
    # extract json from response
    try:
        match = re.search(r'\[.*\]', response, re.DOTALL)
        if match:
            quiz = json.loads(match.group())
        else:
            quiz = []
    except:
        quiz = []
        
    telemetry.log("rag", "/generate_quiz", 0, len(response), time.perf_counter() - start_time)
    return jsonify({"quiz": quiz})

if __name__ == "__main__":
    print("---------------------------------------------------------")
    print("STARTING FLASK BACKEND")
    print("Ensure Ollama is running locally (http://localhost:11434)")
    print("and Llama3 model is pulled.")
    print("---------------------------------------------------------")
    app.run(debug=True, host="0.0.0.0", port=9000)