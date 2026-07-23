from app.graph.state import ReviewState
from app.services.llm import llm
import json

# structured_llm = llm.with_structured_output(ReviewState)
def cross_file_analysis(state: ReviewState):
    summary = state["summary"]
    tree =  json.dumps(state["tree"], indent=2)
    reviews = json.dumps(state["reviews"], indent=2)

    prompt=f"""
           You are ReviewForge's Cross-File Analysis Agent, acting as a Staff Software Engineer conducting a repository-wide architectural review.

            ## Context
            summary: {summary}
            tree: {tree}
            reviews: {reviews}
            You have already received:
            1. A high-level repository summary.
            2. The repository tree.
            3. Individual AI reviews for each selected file.

            Those file reviews have already identified file-specific bugs, style issues, and code quality problems.

            Your responsibility is NOT to review files again.

            Instead, analyze the repository as a whole and identify problems that only become apparent when reasoning across multiple files.

            ---

            ## Your Goals

            Focus ONLY on repository-level observations.

            Examples include:

            - Duplicate business logic
            - Repeated authentication or authorization logic
            - Inconsistent validation strategies
            - Conflicting architectural patterns
            - Circular or unnecessary dependencies
            - Tight coupling between modules
            - Poor separation of concerns
            - Missing abstractions
            - Repeated utilities that should be centralized
            - Inconsistent error handling across services
            - Cross-file security risks
            - Shared state inconsistencies
            - Violations of the project's apparent architecture
            - Opportunities to simplify the codebase
            - Long-term maintainability concerns

            Only report issues that require reasoning across MULTIPLE files.

            ---

            ## Important Rules

            DO NOT

            - Repeat file-level issues already reported.
            - Mention formatting or linting issues.
            - Invent problems not supported by the provided evidence.
            - Speculate about code you have not seen.
            - Recommend unnecessary abstractions.

            Every finding must reference at least TWO files or clearly describe a repository-wide architectural concern.

            If there are no meaningful cross-file issues, explicitly state that the repository appears architecturally consistent.

            ---

            Be concise.

            Only report repository-wide findings.

            Return valid JSON.

            Do not repeat file reviews.

            Every finding must reference multiple files.

            ## Desired Output

            Return ONLY valid JSON.
            Example structure:
            
            {
            "repository_health": {
                "score": <0-100>,
                "summary": "<overall architectural assessment>"
            },

            "cross_file_findings": [
                {
                "title": "...",
                "severity": "Critical | High | Medium | Low",
                "confidence":0.0-1.0,

                "files": [
                    "...",
                    "..."
                ],

                "description": "...",

                "evidence": "...",

                "recommendation": "...",

                "impact": "..."
                }
            ],

            "quick_wins": [
                "...",
                "..."
            ],

            "long_term_refactors": [
                "...",
                "..."
            ],

            "strengths": [
                "...",
                "..."
            ]
            }
             
            ---

            ## Evaluation Criteria

            A good report should:

            - Be concise and actionable.
            - Prioritize architectural reasoning over code style.
            - Avoid duplicate findings.
            - Clearly explain WHY each issue matters.
            - Suggest practical improvements.
            - Highlight strengths as well as weaknesses.
            - Base every conclusion on the provided repository information.

            Remember:

            You are performing an architectural synthesis, NOT another code review."""
    response=llm.invoke(prompt)
    return{
      "cross_file_analysis": json.loads(str(response.content))
    }

