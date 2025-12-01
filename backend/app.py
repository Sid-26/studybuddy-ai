import os
import time
import json
import re
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from werkzeug.utils import secure_filename


# importing all the python modules as needed
import backend.llm as llm
import backend.rag as rag
import backend.validate as validate
import backend.telemetry as telemetry

# configs for flask app
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__)
CORS(app, origins=["http://localhost:9000"])
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
        
        # Clean up the file after processing (optional, but good practice)
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
        telemetry.log("chat", len(query), 0, time.perf_counter() - start_time, success=False)
        return jsonify({"response": msg}), 400
    
    # RAG retrival logic
    context, sources = rag.retrieve_context(query)

    if not context:
        resp = "I couldn't find any sources. Please ensure you have uploaded at least one pdf or make sure the file is not corrupted."
        telemetry.log("chat", len(query), 0, time.time() - start_time)
        return jsonify({"response":resp, "sources":[]})
    
    # call model to generate response
    resp = llm.chat(context, query)

    telemetry.log(...)

    return jsonify({"response": resp, "sources": sources}), 200

@app.route('/generate_flashcards', methods=['POST'])
def generate_flashcards():
    pass

@app.route('/generate_quiz', methods=['POST'])
def generate_quiz():
    pass

if __name__ == "__main__":
    print("---------------------------------------------------------")
    print("STARTING FLASK BACKEND")
    print("Ensure Ollama is running locally (http://localhost:11434)")
    print("and Llama3 model is pulled.")
    print("---------------------------------------------------------")
    app.run(debug=True, host="0.0.0.0", port=9000)