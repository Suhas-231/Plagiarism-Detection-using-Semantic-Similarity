# Flask Backend for Plagiarism Detection

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the server:
```bash
python app.py
```

The server will run on `http://localhost:5000`

## API Endpoints

### POST /api/compare
Compare a source document against multiple documents.

Request body:
```json
{
  "source": "text to check",
  "documents": [
    {"id": "doc1", "content": "document text"},
    {"id": "doc2", "content": "another document"}
  ]
}
```

### POST /api/batch-compare
Perform multiple comparisons in one request.

### GET /health
Health check endpoint.
