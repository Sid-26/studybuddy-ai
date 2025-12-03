import re

def validate_query(user_text):
    # 1. Length Check
    if len(user_text) > 5000:
        return False, "Input too long. Please keep queries under 5000 characters."
    
    # 2. Injection Prevention (Basic patterns)
    forbidden_patterns = [
        r"ignore previous instructions",
        r"system override",
        r"delete all data",
        r"forget your rules"
    ]
    
    for pattern in forbidden_patterns:
        if re.search(pattern, user_text, re.IGNORECASE):
            return False, "Unsafe input detected. Request refused."
            
    return True, ""