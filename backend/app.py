from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

app = Flask(__name__)
CORS(app)

def preprocess_text(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def calculate_semantic_similarity(text1, text2):
    text1_processed = preprocess_text(text1)
    text2_processed = preprocess_text(text2)

    if not text1_processed or not text2_processed:
        return 0.0

    vectorizer = TfidfVectorizer()
    try:
        tfidf_matrix = vectorizer.fit_transform([text1_processed, text2_processed])
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return float(similarity)
    except:
        return 0.0

def find_matching_segments(text1, text2, min_words=5):
    words1 = preprocess_text(text1).split()
    words2 = preprocess_text(text2).split()

    matches = []

    for i in range(len(words1) - min_words + 1):
        segment1 = ' '.join(words1[i:i + min_words])

        for j in range(len(words2) - min_words + 1):
            segment2 = ' '.join(words2[j:j + min_words])

            similarity = calculate_semantic_similarity(segment1, segment2)

            if similarity > 0.8:
                matches.append({
                    'source_segment': segment1,
                    'matched_segment': segment2,
                    'similarity': similarity,
                    'source_position': i,
                    'matched_position': j
                })

    return matches

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

@app.route('/api/compare', methods=['POST'])
def compare_documents():
    try:
        data = request.get_json()

        if not data or 'source' not in data or 'documents' not in data:
            return jsonify({'error': 'Missing required fields'}), 400

        source_text = data['source']
        documents = data['documents']

        if not isinstance(documents, list):
            return jsonify({'error': 'Documents must be an array'}), 400

        results = []

        for doc in documents:
            if 'id' not in doc or 'content' not in doc:
                continue

            similarity_score = calculate_semantic_similarity(source_text, doc['content'])

            matching_segments = []
            if similarity_score > 0.3:
                matching_segments = find_matching_segments(source_text, doc['content'])

            results.append({
                'document_id': doc['id'],
                'similarity_score': round(similarity_score * 100, 2),
                'matching_segments': matching_segments[:10]
            })

        results.sort(key=lambda x: x['similarity_score'], reverse=True)

        overall_score = max([r['similarity_score'] for r in results]) if results else 0

        return jsonify({
            'overall_similarity_score': overall_score,
            'results': results
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/batch-compare', methods=['POST'])
def batch_compare():
    try:
        data = request.get_json()

        if not data or 'checks' not in data:
            return jsonify({'error': 'Missing required fields'}), 400

        checks = data['checks']
        all_results = []

        for check in checks:
            source_text = check.get('source', '')
            documents = check.get('documents', [])
            check_id = check.get('check_id', '')

            results = []

            for doc in documents:
                if 'id' not in doc or 'content' not in doc:
                    continue

                similarity_score = calculate_semantic_similarity(source_text, doc['content'])

                matching_segments = []
                if similarity_score > 0.3:
                    matching_segments = find_matching_segments(source_text, doc['content'])

                results.append({
                    'check_id': check_id,
                    'document_id': doc['id'],
                    'similarity_score': round(similarity_score * 100, 2),
                    'matching_segments': matching_segments[:10]
                })

            all_results.extend(results)

        return jsonify({'results': all_results})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
