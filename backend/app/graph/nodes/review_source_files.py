from app.models.review import FileReview
from app.services.llm import llm
from app.graph.state import ReviewState
structured_llm = llm.with_structured_output(FileReview)

def review_source_files(state: ReviewState):
    reviews = []
    for source_file in state["source_files"]:
        path = source_file["path"]
        content = source_file["content"]
        prompt = f"""You are a senior software engineer.

        Review this source file.

        Evaluate:

        • Code quality
        • Readability
        • Maintainability
        • Best practices
        • Error handling

        Give a score from 0-100.

        Suggest improvements.

        File path:
        {path}

        Source code:
        {content}"""
        print(f"Reviewing {path}...")
        review = structured_llm.invoke(prompt)
        print(f"Finished {path}")
        reviews.append(review)
    state["reviews"] = reviews
    for review in reviews:
        print("=" * 6)
        print(review.path)
        print(review.score)
        print(review.issues)
    return state
