import mysql.connector
from mysql.connector import Error
"""
host='119.18.54.146',   # or IP address
database='easycxuu_livetunein',  
user='easycxuu_root',
password='Cogzin@2024',
port=3306   # default MySQL port
# Run it
list_tables_and_columns(host,database,user,password)
print("\n")
generate_create_commands(host,database,user,password)

"""

def list_tables_and_columns(host,database,user,password,port=3306):
    try:
        connection = mysql.connector.connect(
            host=host,  
            database=database,
            user=user,
            password=password,
            port=port   
        )
        hierarchy = []

        if connection.is_connected():
            print("✅ Connected to database.")

            cursor = connection.cursor()
            cursor.execute("SHOW TABLES;")
            tables = cursor.fetchall()

            for (table_name,) in tables:
                cursor.execute(f"DESCRIBE `{table_name}`;")
                columns = cursor.fetchall()

                table_info = {
                    "table": table_name,
                    "columns": []
                }

                for column in columns:
                    column_info = {
                        "name": column[0],        # Column name
                        "type": column[1]         # Column type
                    }
                    table_info["columns"].append(column_info)
                hierarchy.append(table_info)
        return hierarchy
    except Error as e:
        print(f"❌ Error: {e}")
        return []

    finally:
        if 'connection' in locals() and connection.is_connected():
            connection.close()
            print("\n🔌 Connection closed.")


def generate_create_commands(host,database,user,password,port=3306):
    try:
        connection = mysql.connector.connect(
            host=host,  
            database=database,
            user=user,
            password=password,
            port=port 
        )

        if connection.is_connected():
            cursor = connection.cursor()
            cursor.execute("SHOW TABLES;")
            tables = cursor.fetchall()
            create_statements = {}
            for (table_name,) in tables:
                cursor.execute(f"SHOW CREATE TABLE `{table_name}`;")
                result = cursor.fetchone()
                create_sql = result[1]
                create_statements[table_name] = create_sql
            for table, create_sql in create_statements.items():
                print(f"\n--- CREATE statement for `{table}` ---\n")
                print(f"{create_sql};\n")

            return create_statements

    except Error as e:
        print(f"❌ Error: {e}")

    finally:
        if 'connection' in locals() and connection.is_connected():
            connection.close()
            print("\n🔌 Connection closed.")

def execute_query(host, database, user, password, query, port=3306):
    """
    Connects to the database, executes a query, and returns the result as a list.
    """
    try:
        connection = mysql.connector.connect(
            host=host,
            database=database,
            user=user,
            password=password,
            port=port
        )

        if connection.is_connected():
            cursor = connection.cursor()
            cursor.execute(query)

            if cursor.with_rows:
                result = cursor.fetchall()
                return result
            else:
                connection.commit()
                return []  # No rows to return (e.g., for INSERT, UPDATE, DELETE)

    except Error as e:
        print(f"❌ Error: {e}")
        return []

    finally:
        if 'connection' in locals() and connection.is_connected():
            connection.close()
            print("🔌 Connection closed after executing query.")

host='119.18.54.146'  # or IP address
database='easycxuu_livetunein'
user='easycxuu_root'
password='Cogzin@2024'
port=3306   # default MySQL port
# Run it
list_tables_and_columns(host,database,user,password)
print("\n")
generate_create_commands(host,database,user,password)
ex=execute_query(host,database,user,password,"SELECT * FROM events")
