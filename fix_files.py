import os

# READ index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Update game-over buttons
html = html.replace(
    '<button id="restart-btn">RESTART</button>',
    '<div style="display: flex; gap: 15px; margin-top: 20px;">\n                <button id="restart-btn" style="flex: 1;">RESTART</button>\n                <button id="menu-btn" style="flex: 1; padding: 15px; font-size: 20px; font-weight: 900; letter-spacing: 2px; font-family: \'Inter\', sans-serif; background: transparent; border: 3px solid #111; color: #111; cursor: pointer;">MAIN MENU</button>\n            </div>'
)
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

# READ globals.js
with open('js/globals.js', 'r', encoding='utf-8') as f:
    globals_js = f.read()

if 'const menuBtn = document.getElementById(\'menu-btn\');' not in globals_js:
    globals_js = globals_js.replace(
        "const restartBtn = document.getElementById('restart-btn');",
        "const restartBtn = document.getElementById('restart-btn');\nconst menuBtn = document.getElementById('menu-btn');"
    )
    with open('js/globals.js', 'w', encoding='utf-8') as f:
        f.write(globals_js)

# READ entities.js
with open('js/entities.js', 'r', encoding='utf-8') as f:
    entities_js = f.read()

idx_init_menu = entities_js.find('function initMenu() {')
if idx_init_menu != -1:
    init_funcs = entities_js[idx_init_menu:]
    entities_js = entities_js[:idx_init_menu].strip()
    with open('js/entities.js', 'w', encoding='utf-8') as f:
        f.write(entities_js)
else:
    init_funcs = ""

# READ levels.js
with open('js/levels.js', 'r', encoding='utf-8') as f:
    levels_js = f.read()

idx_check_col = levels_js.find('function checkCollisions() {')
if idx_check_col != -1:
    main_funcs = levels_js[idx_check_col:]
    levels_js = levels_js[:idx_check_col].strip()
    with open('js/levels.js', 'w', encoding='utf-8') as f:
        f.write(levels_js)
else:
    main_funcs = ""

# WRITE main.js
main_js = init_funcs + "\n\n" + main_funcs

# Add event listener for menuBtn
main_js = main_js.replace(
    "startBtn.addEventListener('click', initGame);",
    "startBtn.addEventListener('click', initGame);\nif(menuBtn) menuBtn.addEventListener('click', initMenu);"
)

with open('js/main.js', 'w', encoding='utf-8') as f:
    f.write(main_js.strip())

print("Fix completed!")
