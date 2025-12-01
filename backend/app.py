import os
import time
import json
import re
from flask import Flask, request, jsonify, session
from flask_cors import CORS

import llm
import rag
import validate
import telemetry

app = Flask(__name__)
CORS(app, origins=["http://localhost:8080"])

@app.route('/')
def test():
    return "Hello, World!"

@app.route('/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        pass
    f = request.files
    pass

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
    app.run(debug=True, host="0.0.0.0", port=8080)