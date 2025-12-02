import PyPDF2
import pytesseract
from pdf2image import convert_from_path
import chromadb
from chromadb.utils import embedding_functions

# --- Setup Vector DB (Chroma) ---
# using 'all-MiniLM-L6-v2' which is small and fast for CPU
chroma_client = chromadb.Client()
sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")

# Create a single collection for the session
collection = chroma_client.get_or_create_collection(
    name="course_notes", 
    embedding_function=sentence_transformer_ef
)

def extract_text_from_pdf(filepath):
    """
    Extracts text from PDF. Uses OCR (Tesseract) if text extraction yields little result.
    """
    text = ""
    try:
        with open(filepath, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        
        # Fallback to OCR if text is minimal (e.g., < 50 chars for a whole file)
        if len(text.strip()) < 50: 
            print(f"Text too short in {filepath}, attempting OCR...")
            try:
                # Requires Poppler to be installed
                images = convert_from_path(filepath)
                for img in images:
                    # Requires Tesseract to be installed
                    text += pytesseract.image_to_string(img) + "\n"
            except Exception as e:
                print(f"OCR failed (is poppler/tesseract installed?): {e}")
                
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return None
    return text

def chunk_text(text, chunk_size=500, overlap=50):
    """
    Splits text into overlapping chunks.
    """
    chunks = []
    for i in range(0, len(text), chunk_size - overlap):
        chunks.append(text[i:i + chunk_size])
    return chunks

def ingest_file(filepath, filename):
    """
    Orchestrates extraction, chunking, and storing in ChromaDB.
    """
    text = extract_text_from_pdf(filepath)
    if not text:
        return False, "Could not extract text"
        
    chunks = chunk_text(text)
    if not chunks:
        return False, "File was empty"

    # Create unique IDs for chunks: "filename_chunkIndex"
    ids = [f"{filename}_{i}" for i in range(len(chunks))]
    metadatas = [{"source": filename} for _ in range(len(chunks))]
    
    collection.add(documents=chunks, ids=ids, metadatas=metadatas)
    return True, f"Processed {len(chunks)} chunks"

def retrieve_context(query, n_results=3):
    """
    Queries ChromaDB for the most relevant text chunks.
    """
    # Check if the collection has any documents
    if collection.count() == 0:
        return "", []
        
    results = collection.query(query_texts=[query], n_results=n_results)
    if results['documents']:
        # Documents are returned as a list of lists (outer list for queries, inner list for results)
        return "\n".join(results['documents'][0]), results['ids'][0]
    return "", []

def get_random_context(n=3):
    """
    Gets random documents (for flashcard/quiz generation without a specific query).
    """
    if collection.count() == 0:
        return ""
        
    # .peek() returns the first n items; good enough for "random" generation context in this scope
    data = collection.peek(limit=n)
    if data['documents']:
        # documents is a list of documents
        return "\n".join(data['documents'])
    return ""