import os
import re

directories_to_fix = [
    'frontend/src/components/auth',
    'frontend/src/components/workspace',
    'frontend/src/components/project',
    'frontend/src/components/dashboard'
]

replacements = [
    (re.compile(r'from\s+["\']\.\./components/'), 'from "../'),
    (re.compile(r'import\s+(.*?)\s+from\s+["\']\.\./components/'), r'import \1 from "../'),
    (re.compile(r'from\s+["\']\.\./hooks/'), 'from "../../hooks/'),
    (re.compile(r'from\s+["\']\.\./stores/'), 'from "../../stores/'),
    (re.compile(r'from\s+["\']\.\./api/'), 'from "../../api/'),
    (re.compile(r'from\s+["\']\.\./assets/'), 'from "../../assets/'),
    (re.compile(r'from\s+["\']\.\./utils/'), 'from "../../utils/'),
]

for dir_path in directories_to_fix:
    if not os.path.exists(dir_path):
        continue
    for filename in os.listdir(dir_path):
        if not filename.endswith('.jsx') and not filename.endswith('.js'):
            continue
        
        filepath = os.path.join(dir_path, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = content
        for pattern, replacement in replacements:
            new_content = pattern.sub(replacement, new_content)
            
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated imports in {filepath}")
