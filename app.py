from flask import Flask, render_template,request
from flask_socketio import SocketIO, send
from api.v1 import v1_socket

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
v1_socket(socketio)
@app.route('/')
def home():     
    return render_template('dashboard.html')
  
@app.route('/test')
def test():
    return render_template('test.html') 
      
@app.route('/new-project', methods=['POST'])
def upload():
    file = request.files['file']
    project_name = request.form['project_name']
    file_path=f"uploads/{project_name}_{file.filename}"
    file.save("./"+file_path) 
    return {"success":True,"message": "File uploaded successfully","file_path":file_path}

if __name__ == '__main__':
    socketio.run(app)    
