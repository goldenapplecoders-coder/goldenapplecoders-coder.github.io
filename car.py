from flask import Flask, render_template, request, jsonify
import json
import os
from datetime import datetime

app = Flask(__name__)

# File to store high scores
HIGH_SCORES_FILE = 'high_scores.json'

def load_high_scores():
    """Load high scores from JSON file"""
    if os.path.exists(HIGH_SCORES_FILE):
        try:
            with open(HIGH_SCORES_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    # Return default scores if file doesn't exist or is corrupted
    return [
        {"name": "ACE", "score": 5000, "date": "2023-01-01"},
        {"name": "PRO", "score": 4000, "date": "2023-01-01"},
        {"name": "RAC", "score": 3000, "date": "2023-01-01"},
        {"name": "ING", "score": 2000, "date": "2023-01-01"},
        {"name": "FAN", "score": 1000, "date": "2023-01-01"}
    ]

def save_high_scores(scores):
    """Save high scores to JSON file"""
    with open(HIGH_SCORES_FILE, 'w') as f:
        json.dump(scores, f, indent=2)

@app.route('/')
def index():
    """Serve the main game page"""
    return render_template('car.html')

@app.route('/api/highscores', methods=['GET'])
def get_high_scores():
    """Get the current high scores"""
    return jsonify(load_high_scores())

@app.route('/api/highscores', methods=['POST'])
def submit_score():
    """Submit a new high score"""
    data = request.get_json()
    
    if not data or 'name' not in data or 'score' not in data:
        return jsonify({"error": "Invalid data"}), 400
    
    name = data['name']
    score = data['score']
    
    # Validate score
    try:
        score = int(score)
    except ValueError:
        return jsonify({"error": "Score must be a number"}), 400
    
    # Load current high scores
    high_scores = load_high_scores()
    
    # Add new score
    new_score = {
        "name": name[:3].upper(),  # Limit to 3 characters
        "score": score,
        "date": datetime.now().strftime("%Y-%m-%d")
    }
    
    high_scores.append(new_score)
    
    # Sort by score (descending) and keep only top 10
    high_scores.sort(key=lambda x: x['score'], reverse=True)
    high_scores = high_scores[:10]
    
    # Save updated scores
    save_high_scores(high_scores)
    
    return jsonify({"success": True, "position": high_scores.index(new_score) + 1})

@app.route('/api/highscores/check', methods=['POST'])
def check_score():
    """Check if a score qualifies for the high score list"""
    data = request.get_json()
    
    if not data or 'score' not in data:
        return jsonify({"error": "Invalid data"}), 400
    
    try:
        score = int(data['score'])
    except ValueError:
        return jsonify({"error": "Score must be a number"}), 400
    
    high_scores = load_high_scores()
    
    # Check if score is high enough to be in the top 10
    qualifies = len(high_scores) < 10 or score > high_scores[-1]['score']
    
    return jsonify({"qualifies": qualifies})

if __name__ == '__main__':
    # Create templates directory if it doesn't exist
    if not os.path.exists('templates'):
        os.makedirs('templates')
    
    # Copy the HTML file to templates directory
    with open('car.html', 'r') as source:
        with open('templates/car.html', 'w') as target:
            target.write(source.read())
    
    print("Starting Asphait Cor Race server...")
    print("Game available at: http://localhost:5000")
    app.run(debug=True)