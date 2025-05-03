import os
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()

ds_client = OpenAI(api_key=os.getenv("DEEPSEEK_API_KEY"), base_url="https://api.deepseek.com")

def deepseek_completions(prompt,emitter=None):
    try:
        response = ds_client.chat.completions.create(
            model="deepseek-chat",
            messages=prompt, 
            stream=True
        )
        result=""
        for chunk in response:
            content = chunk.choices[0].delta.content
            if content:
                result+=content
                if emitter!=None:
                    emitter(result)
        return result
    except Exception as e:
        print(e)
        emit('error', {'error': str(e)})
"""
try:
        response = client.chat.completions.create(
            model='gpt-4o-mini',
            messages=prompt,
            temperature=0,
            stream=True
        )
        for chunk in response:
            content = chunk.choices[0].delta.content
            if content:
                print(content)
                emit('fixed', {'response': content})
        emit('fixing_done', {'response': 'done'})
    except Exception as e:
        emit('error', {'response': str(e)})
"""