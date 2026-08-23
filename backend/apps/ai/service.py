import os
from google import genai
from google.genai import types
from decouple import config

def get_genai_client():
    api_key = config("GEMINI_API_KEY", default=os.getenv("GEMINI_API_KEY"))
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set in environment or .env file")
    return genai.Client(api_key=api_key)

def generate_decision(messages: list, tools: list, system_instruction: str):
    """
    Wrapper for google-genai to generate content.
    messages: list of dicts with 'role' and 'parts' or equivalent format.
    tools: list of callable python functions to provide to the model.
    """
    client = get_genai_client()
    
    primary_model = config("GEMINI_MODEL", default="gemini-2.5-flash")
    fallback_model = config("GEMINI_FALLBACK_MODEL", default="gemini-1.5-flash")
    
    # Configure tools and system instructions
    genai_config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        tools=tools,
        temperature=0.1 # low temp for more deterministic orchestration
    )
    
    try:
        response = client.models.generate_content(
            model=primary_model,
            contents=messages,
            config=genai_config
        )
        return response
    except Exception as e:
        print(f"Primary model {primary_model} failed: {e}. Falling back to {fallback_model}...")
        try:
            response = client.models.generate_content(
                model=fallback_model,
                contents=messages,
                config=genai_config
            )
            return response
        except Exception as fallback_error:
            print(f"Fallback model {fallback_model} also failed: {fallback_error}")
            raise fallback_error

