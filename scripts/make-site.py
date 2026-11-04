#!/usr/bin/env python3
"""Bundle human-readable HTML/CSS/JS into one gzip payload for static GitHub Pages."""
from pathlib import Path
import gzip, json, re
root=Path(__file__).resolve().parent.parent
html=(root/'full-editor.html').read_text()
css=re.search(r'<style>(.*?)</style>',html,re.S).group(1)
body=re.search(r'<body>(.*?)</body>',html,re.S).group(1)
body=re.sub(r'<script type="module" src="./app.js"></script>','',body)
js=(root/'f4hwn.js').read_text()+'\n'+re.sub(r"^import \{.*?\} from './f4hwn.js';\n",'',(root/'app.js').read_text(),count=1,flags=re.M)
(root/'site.bundle.mjs').write_text(js)
bundle=json.dumps({'css':css,'body':body,'js':js},ensure_ascii=False,separators=(',',':')).encode()
(root/'site.json.gz').write_bytes(gzip.compress(bundle,compresslevel=9,mtime=0))
print('bundle uncompressed:',len(bundle),'gzip:',(root/'site.json.gz').stat().st_size)
