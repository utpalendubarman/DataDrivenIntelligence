import pandas as pd
def generate_sql_schema(dtypes, table_name="datatable", primary_key="id"):
    dtype_mapping = {
        'int64': 'INTEGER',
        'float64': 'REAL',
        'object': 'TEXT',
        'bool': 'INTEGER',
        'datetime64[ns]': 'TEXT'
    }
    if isinstance(dtypes, pd.Series):
        dtypes = dtypes.astype(str).to_dict()   
    columns = []
    for col, dtype in dtypes.items():
        
        sqlite_type = dtype_mapping.get(str(dtype), 'TEXT')
        if col == primary_key:
            columns.append(f"{col} INTEGER PRIMARY KEY AUTOINCREMENT")
        else:
            columns.append(f"{col} {sqlite_type}")
    create_table_sql = f"CREATE TABLE {table_name} ( " + ", ".join(columns) + ");"
    return create_table_sql