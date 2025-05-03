import os
import json
import pandas as pd
from flask import Flask, render_template,request
from flask_socketio import SocketIO, send, emit
from lib.generate_sql_schema import generate_sql_schema
from lib.database import create_table, execute_query, stream_query
from lib.llm import deepseek_completions 
from lib.utils import check_prompt_if_answer_required 

def v1_socket(socketio):
    schema=""
    @socketio.on('start-ai')
    def handle_message(data):
        file_path=data.get("file_path",None)
        if file_path!=None: 
            # Open file
            csv_path="./"+file_path
        
            db_path = 'database/data.db'
            if os.path.exists(db_path):
                os.remove(db_path)

            with open(db_path, 'w') as f:
                pass
            table_name = 'datatable'
            file=pd.read_csv(csv_path)
            df=pd.DataFrame(file)
            df = df.loc[:, ~df.columns.str.contains('^Unnamed')]
            df.columns = (
                df.columns
                .str.strip()                       
                .str.replace(' ', '_')
                .str.replace('.', '') 
                .str.replace('/', '')
                .str.replace('(', '')
                .str.replace(')', '')      
                .str.replace('-', '')
                .str.replace('&', '_')             
            )
            datatypes=df.dtypes
            schema=generate_sql_schema(datatypes)
            create_table(db_path, schema, csv_path, table_name)
            query=f"SELECT * FROM {table_name};" 
            stream_query('database/data.db', query, socketio, request.sid)
            emit('started',{'success':True})
            emit('schema',{'schema':schema})

    def emit_formatted_prompt(chunk):
        emit("formatted-prompt",{'chunk':chunk})   

    @socketio.on('ask')
    def ask(data):
        question=data.get("question",None)
        schema=data.get("schema",None)
        if question!=None and schema!=None: 
            prompt=[
                {"role": "system", "content": "You are a question reformer who replaces and realign words that makes the question specific relevant to the context"},
                {"role": "user", "content": f"Reform the question '''{question}''' replacing the relevant words with column names present in table '''sql {schema}''', Write only the reformed question "},
            ]
            print(prompt)
            formatted_prompt=deepseek_completions(prompt,emit_formatted_prompt)
            emit("complete-formatted-prompt",{"formatted_prompt":formatted_prompt}) 
    def emit_database_query(chunk):
        emit("database-query",{'chunk':chunk})

    @socketio.on("generate-query")
    def generate_query(data):
        formatted_prompt=data.get("formatted_prompt",None)
        schema=data.get("schema",None)
        if formatted_prompt!=None and schema!=None:
            prompt=[
                {"role": "system", "content": "You are an expert sqlite query writer analysing a provided schema who only responds the query string without any text."},
                {"role": "user", "content": f"Query to create the table was '''sql {schema}''', Write a query to get the result of question '''{formatted_prompt}''', always select all columns for the result"},
            ]
            query=deepseek_completions(prompt,emit_database_query)
            emit("complete-database-query",{"query":query}) 


    @socketio.on("execute-query") 
    def generate_query(data):
        db_query=data.get("database_query",None)
        db_query=db_query.replace("```sql","")
        db_query=db_query.replace("```","")
        print("DB query is")
        print(db_query)
        schema=data.get("schema",None)
        if db_query!=None and schema!=None:
            db_res=stream_query('database/data.db', db_query, socketio, request.sid)
            print("Retrived data is")
            print(db_res)
            # If row count <= 5 
            if len(db_res['data'])<=5:
                print("This Requires summarised Answer")
                prompt=[ 
                    {"role": "system", "content": "You a expert data report maker who responds in json in format of ```json {'heading':'','content':''}```"},
                    {"role": "user", "content": f"A table was created using query '''sql {schema}''' and a query '''sql {db_query}''' is executed, got result '''json {json.dumps(db_res)}''',generate a report in json with only heading and content attribute. respond only in json without any instruction or elaboration"},
                ] 
                report=deepseek_completions(prompt=prompt,emitter=None) 
                report=report.replace("/n","")
                report=report.replace("```json","")
                report=report.replace("```","")
                print(report)
                report = json.loads(report)
                heading = report["heading"]
                content = report["content"]
                print(f"Heading: {heading}")
                print(f"Content: {content}")
                emit("report-answer",{ 
                    "heading":heading, 
                    "content":content,
                })
            # If requires single answer
            elif check_prompt_if_answer_required(db_query)==True:
                print("This Requires Specific Answer")
                prompt=[
                    {"role": "system", "content": "You are an expert sqlite query writer who write prompt to get specific single value result and only responds the query string without any text."},
                    {"role": "user", "content": f"Reform the query '''sql {db_query}''' to get a single value result"},
                ]
                result_query=deepseek_completions(prompt=prompt,emitter=None)
                result_query=result_query.replace("```sql","")
                result_query=result_query.replace("```","")
                print("Result oriented query:")
                print(result_query)  
                res=execute_query("database/data.db",result_query)
                if res:
                    result_str = "\n".join(", ".join(str(item) for item in row) for row in res)
                else:
                    result_str = "No result or non-SELECT query."
                print("Result is : ")
                print(result_str)
                prompt=[
                    {"role": "system", "content": "You a expert data report maker who responds in json in format of ```json {'heading':'','content':''}```"},
                    {"role": "user", "content": f"A table was created using query '''sql {schema}''' and a query '''sql {result_query}''' is executed, got result '''{result_str}''',generate a report in json with heading and content. respond only in json without any instruction or elaboration"},
                ]
                report=deepseek_completions(prompt=prompt,emitter=None)
                report=report.replace("/n","")
                report=report.replace("```json","")
                report=report.replace("```","")
                print(report)
                report = json.loads(report)
                heading = report["heading"]
                content = report["content"]
                print(f"Heading: {heading}")
                print(f"Content: {content}")
                emit("report-answer",{ 
                    "heading":heading, 
                    "content":content,
                })

                
 
     
    