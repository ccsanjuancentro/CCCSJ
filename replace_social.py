import os
import re

directory = '/home/brayan/Documents/CCCSJ/public'

replacement_block = """                    <div class="col-lg-3 col-4 d-flex justify-content-end align-items-center">
                        <ul class="social-icon mb-0">
                            <li><a href="sign-in.html" class="social-icon-link bi-person" style="font-size: 1.8rem; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; background-color: #333; border-radius: 50%; color: white;"></a></li>
                        </ul>
                    </div>"""

pattern = re.compile(r'<div class="col-lg-3 col-4">\s*<h5 class="text-white mb-3">Social</h5>\s*<ul class="social-icon">.*?</ul>\s*</div>', re.DOTALL)

count = 0
for filename in os.listdir(directory):
    if filename.endswith(".html"):
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content, num_subs = pattern.subn(replacement_block, content)
        if num_subs > 0:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            count += 1
            print(f"Updated {filename}")

print(f"Total files updated: {count}")
