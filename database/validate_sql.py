import pathlib
import sqlparse

path = pathlib.Path('d:/SmartServe-AI/database/schema/005_create_inventory_schema.sql')
text = path.read_text(encoding='utf-8')
stmts = sqlparse.parse(text)
print('Statements:', len(stmts))
for i, stmt in enumerate(stmts, 1):
    snippet = str(stmt).strip().replace('\n', ' ')
    print(f'{i}: {snippet[:200]}')
