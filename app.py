import os
import logging
import pandas as pd
import json
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from werkzeug.utils import secure_filename
import uuid
from datetime import datetime
import pathlib

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev_key_for_testing")

# Create a directory for storing uploaded CSV files
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Define global variables to store project data
# In a production app, this would be in a database
PROJECTS = []
PROJECT_DATA = {}

# Helper function to load projects from disk
def load_projects():
    global PROJECTS, PROJECT_DATA
    projects_file = os.path.join(app.config['UPLOAD_FOLDER'], 'projects.json')
    
    if os.path.exists(projects_file):
        try:
            with open(projects_file, 'r') as f:
                PROJECTS = json.load(f)
                
            # Also load each project's data
            for project in PROJECTS:
                project_id = project['id']
                csv_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{project_id}.csv")
                if os.path.exists(csv_path):
                    try:
                        df = pd.read_csv(csv_path)
                        PROJECT_DATA[project_id] = df.to_dict('records')
                    except Exception as e:
                        logger.error(f"Error loading CSV for project {project_id}: {e}")
        except Exception as e:
            logger.error(f"Error loading projects: {e}")
            PROJECTS = []

# Helper function to save projects to disk
def save_projects():
    projects_file = os.path.join(app.config['UPLOAD_FOLDER'], 'projects.json')
    try:
        with open(projects_file, 'w') as f:
            json.dump(PROJECTS, f)
    except Exception as e:
        logger.error(f"Error saving projects: {e}")

# Load projects on startup
load_projects()

@app.route('/')
def dashboard():
    """Render the dashboard page with all projects."""
    return render_template('dashboard.html', projects=PROJECTS)

@app.route('/create_project', methods=['POST'])
def create_project():
    """Create a new project by uploading a CSV file."""
    if 'csv_file' not in request.files:
        flash('No file part')
        return redirect(request.url)
    
    file = request.files['csv_file']
    project_name = request.form.get('project_name', '').strip()
    
    if file.filename == '':
        flash('No selected file')
        return redirect(url_for('dashboard'))
    
    if project_name == '':
        flash('Project name is required')
        return redirect(url_for('dashboard'))
    
    if file and project_name:
        try:
            # Create a unique ID for the project
            project_id = str(uuid.uuid4())
            
            # Save the CSV file
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{project_id}.csv")
            file.save(file_path)
            
            # Read the CSV and store its data
            df = pd.read_csv(file_path)
            PROJECT_DATA[project_id] = df.to_dict('records')
            
            # Create and store project metadata
            project = {
                'id': project_id,
                'name': project_name,
                'file_name': filename,
                'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'row_count': len(df),
                'column_count': len(df.columns)
            }
            PROJECTS.append(project)
            
            # Save projects to disk
            save_projects()
            
            flash('Project created successfully!')
            return redirect(url_for('project_view', project_id=project_id))
        except Exception as e:
            logger.error(f"Error creating project: {e}")
            flash(f'Error creating project: {str(e)}')
            return redirect(url_for('dashboard'))
    
    return redirect(url_for('dashboard'))

@app.route('/project/<project_id>')
def project_view(project_id):
    """Render the project page with the data table and AI interaction section."""
    project = next((p for p in PROJECTS if p['id'] == project_id), None)
    
    if not project:
        flash('Project not found')
        return redirect(url_for('dashboard'))
    
    # Get the data for this project
    data = PROJECT_DATA.get(project_id, [])
    
    # If data is empty but the project exists, try to load it
    if not data and os.path.exists(os.path.join(app.config['UPLOAD_FOLDER'], f"{project_id}.csv")):
        try:
            df = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], f"{project_id}.csv"))
            data = df.to_dict('records')
            PROJECT_DATA[project_id] = data
        except Exception as e:
            logger.error(f"Error loading CSV for project {project_id}: {e}")
            flash(f'Error loading project data: {str(e)}')
    
    # Extract column names if data exists
    columns = []
    if data and len(data) > 0:
        columns = list(data[0].keys())
    
    return render_template('project.html', project=project, data=data, columns=columns)

@app.route('/api/ask_ai', methods=['POST'])
def ask_ai():
    """Process an AI query about the project data."""
    try:
        project_id = request.json.get('project_id')
        user_query = request.json.get('query')
        
        if not project_id or not user_query:
            return jsonify({'error': 'Missing project_id or query'}), 400
        
        # Get the project data
        data = PROJECT_DATA.get(project_id, [])
        if not data:
            return jsonify({'error': 'Project data not found'}), 404
        
        # This is a placeholder for AI processing
        # In a real application, this would call an AI service
        formatted_prompt = f"Analyzing data for query: '{user_query}'"
        
        # Create a simple response based on the query
        # This would be replaced with actual AI processing in a production app
        response = f"This is a simulated AI response for: {user_query}"
        if "count" in user_query.lower():
            response = f"There are {len(data)} rows in this dataset."
        elif "columns" in user_query.lower():
            columns = list(data[0].keys()) if data and len(data) > 0 else []
            response = f"The dataset contains these columns: {', '.join(columns)}"
        
        return jsonify({
            'formatted_prompt': formatted_prompt,
            'response': response
        })
    except Exception as e:
        logger.error(f"Error processing AI query: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/project_data/<project_id>')
def get_project_data(project_id):
    """API endpoint to get project data for DataTable."""
    project = next((p for p in PROJECTS if p['id'] == project_id), None)
    
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    data = PROJECT_DATA.get(project_id, [])
    
    # Return the data as JSON
    return jsonify(data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
