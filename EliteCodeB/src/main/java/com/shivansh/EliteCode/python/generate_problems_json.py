import json
from datasets import load_dataset

# Load the dataset
dataset = load_dataset("techandy42/multi_lang_leetcode", split="train")

output = []

for item in dataset:
    # Map difficulty from string to your enum (EASY, MEDIUM, HARD)
    difficulty = item["difficulty"].upper()  # "Easy" -> "EASY"

    # Tags: the dataset has "topic_tags" field
    tags = item.get("topic_tags", [])
    if isinstance(tags, str):
        tags = [t.strip() for t in tags.split(",") if t.strip()]

    # Content is HTML; you can convert to plain text using HtmlToPlainText later
    # But for now, store the raw HTML (your importer will not convert it automatically)
    # Your existing JsonProblemImporter does not use HtmlToPlainText, so we'll just put the content as is.
    content = item["content"]

    # No test cases – leave empty list
    test_cases = []

    problem = {
        "title": item["title"],
        "content": content,
        "difficulty": difficulty,
        "tags": tags,
        "testCases": test_cases
    }
    output.append(problem)

# Write to src/main/resources/leetcode_problems.json
with open("src/main/resources/leetcode_problems.json", "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print(f"Written {len(output)} problems to src/main/resources/leetcode_problems.json")