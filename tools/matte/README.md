# Вырезка спикера (прозрачное webm)
1. Кадры: `ffmpeg -i avatar.mp4 -vf scale=540:960 fr/%05d.png` и `ffmpeg -i avatar.mp4 full/%05d.png`
2. `pip install rembg onnxruntime scipy --break-system-packages`
3. `python3 matte.py` (из папки с fr/ full/) → rgba/  (~0.7 с/кадр, запускать в фоне)
4. Если над головой «прилипает» фон: `python3 plate_fix.py test` (проверка) → `python3 plate_fix.py all` → rgba2/
5. `ffmpeg -framerate 30 -i rgba2/%05d.png -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 4M -auto-alt-ref 0 avatar_cut.webm`
