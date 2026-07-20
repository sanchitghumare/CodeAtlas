from langchain_ollama import ChatOllama
llm = ChatOllama(
    model="llama3.2",
    temperature=0.4,
    num_ctx=4096,
    num_predict=1024,
)