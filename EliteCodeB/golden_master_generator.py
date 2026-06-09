import json
from datasets import load_dataset

print("Loading multi_lang_leetcode...")
ml_dataset = load_dataset("techandy42/multi_lang_leetcode", split="train")
ml_by_slug = {item["slug"]: item for item in ml_dataset}
print(f"Loaded {len(ml_by_slug)} problems.")

print("Loading LeetCodeDataset (train split)...")
test_dataset = load_dataset("newfacade/LeetCodeDataset", split="train")
print(f"Loaded {len(test_dataset)} entries.")

output_problems = []
matched = 0
for test_item in test_dataset:
    task_id = test_item.get("task_id")
    if not task_id or task_id not in ml_by_slug:
        continue
    ml_item = ml_by_slug[task_id]
    matched += 1

    # Handle missing or None difficulty
    diff = ml_item.get("difficulty")
    if diff is None:
        diff = "MEDIUM"  # default
    else:
        diff = diff.upper()

    io_list = test_item.get("input_output", [])
    test_cases = []
    for io in io_list:
        inp = io.get("input", "")
        out = io.get("output", "")
        if inp or out:
            test_cases.append({"input": inp, "expectedOutput": out})

    output_problems.append({
        "title": ml_item["title"],
        "content": ml_item.get("content", ""),
        "difficulty": diff,
        "tags": ml_item.get("topic_tags", []),
        "testCases": test_cases
    })

with open("src/main/resources/leetcode_problems.json", "w", encoding="utf-8") as f:
    json.dump(output_problems, f, indent=2, ensure_ascii=False)

print(f"Done. Matched {matched} problems. Output saved to leetcode_problems.json")