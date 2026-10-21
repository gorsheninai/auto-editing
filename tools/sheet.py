# python3 tools/sheet.py out.png cols img1 img2 ... — лист превью с подписями
import sys
from PIL import Image, ImageDraw
out, cols, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
ims = [Image.open(f).convert('RGB') for f in files]; w, h = ims[0].size; lab = 26
rows = (len(ims) + cols - 1) // cols
S = Image.new('RGB', (cols * w, rows * (h + lab)), 'white'); d = ImageDraw.Draw(S)
for i, (f, im) in enumerate(zip(files, ims)):
    x, y = (i % cols) * w, (i // cols) * (h + lab); S.paste(im.resize((w, h)), (x, y + lab)); d.text((x + 6, y + 6), f.split('/')[-1][:-4], fill='black')
S.save(out)
