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

@app.route('/chat', methods=['POST'])
def chat():
    start_time = time.time()
    data = request.json
    query = data.get('query', '')

    is_safe, resp = validate.validate_query(query)

    # input query validation
    if not is_safe:
        telemetry.log("chat", len(query), 0, time.time() - start_time, success=False)
        return jsonify({"response": resp}), 400
    
    #



if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)