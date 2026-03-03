file_path = 'src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('límite(', 'limit(')
text = text.replace('límite }', 'limit }')
text = text.replace('.límite', '.limit')
text = text.replace(' category: "Income"', ' category: "Nómina"')
text = text.replace(' date: "Today"', ' date: "Hoy"')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Done!')
