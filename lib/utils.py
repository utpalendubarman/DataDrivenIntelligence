def check_prompt_if_answer_required(query):
    sql_functions = [
        "AVG", "SUM", "MIN", "MAX", "COUNT", "GROUP_CONCAT", "STRING_AGG",
        "VARIANCE", "STDDEV", "MEDIAN", "PERCENTILE_CONT", "PERCENTILE_DISC",
        "FIRST_VALUE", "LAST_VALUE"
    ]
    return any(func in query for func in sql_functions)