import sqlite3
import csv
import os
from flask_socketio import SocketIO, send, emit

def create_table(sqlite_db_path, create_query, csv_file_path, table_name):
    conn = sqlite3.connect("database/data.db")
    cursor = conn.cursor()

    try:
        cursor.execute(create_query)
        print(f"Table '{table_name}' created successfully.")

        with open(csv_file_path, 'r', newline='', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            headers = next(reader)  
            placeholders = ', '.join('?' for _ in headers)
            insert_query = f"INSERT INTO {table_name} ({', '.join(headers)}) VALUES ({placeholders})"

            for row in reader:
                cursor.execute(insert_query, row)

        conn.commit()
        print(f"Data inserted successfully from '{csv_file_path}'.")

    except sqlite3.Error as e:
        print(f"SQLite error: {e}")

    finally:
        conn.close()

def execute_query(sqlite_db_path, query):
    conn = sqlite3.connect(sqlite_db_path)
    cursor = conn.cursor()

    try:
        cursor.execute(query)
        if query.strip().lower().startswith("select"):
            result = cursor.fetchall()
            print("Query Result:")
            for row in result:
                print(row)
            return result
        else:
            conn.commit()
            print("Query executed successfully.")
            return []

    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
        return []

    finally:
        conn.close()

def stream_query(sqlite_db_path, query, socketio, sid):
    conn = sqlite3.connect(sqlite_db_path)
    cursor = conn.cursor()
    data=[]
    headers=[]  

    try:
        cursor.execute(query)  
        if query.strip().lower().startswith("select"):
            # Emit headers
            headers = [description[0] for description in cursor.description]
            socketio.emit("datatable", {
                "row_type": "header",
                "data": headers
            }, room=sid)
            
            # Emit each row
            for row in cursor.fetchall():
                socketio.emit("datatable", {
                    "row_type": "row",
                    "data": list(map(str, row))  # Convert all to strings
                }, room=sid)
                data.append(list(map(str, row)))
            

        else:
            conn.commit()
            print("Non-SELECT query executed successfully.")

    except sqlite3.Error as e:
        print(f"SQLite error: {e}")

    finally:
        conn.close() 
        return {
                "headers":headers,
                "data":data
            }
        