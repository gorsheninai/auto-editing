#!/bin/bash
# Скачивает модели Kenney (лицензия MIT/CC0) для library/city3d в public/models ролика.
# Модели в git не храним: они берутся отсюда или с Диска (папка «3D-модели / kenney-city»).
# usage: tools/fetch_kenney.sh reels/NN-name/public/models
set -e
DST="${1:?папка назначения}"; TMP=$(mktemp -d)
git clone -q --depth 1 https://github.com/KenneyNL/Starter-Kit-City-Builder "$TMP/city"
git clone -q --depth 1 https://github.com/KenneyNL/Starter-Kit-3D-Platformer "$TMP/pf"
mkdir -p "$DST/Textures" "$DST/pf/Textures"
for f in building-small-a building-small-b building-small-c building-small-d building-garage road-straight road-straight-lightposts \
  road-corner road-intersection road-split pavement pavement-fountain grass grass-trees grass-trees-tall; do
  cp "$TMP/city/models/$f.glb" "$DST/"; done
cp "$TMP/city/models/Textures/colormap.png" "$DST/Textures/"
for f in cloud coin flag character; do cp "$TMP/pf/models/$f.glb" "$DST/pf/"; done
cp "$TMP/pf/models/Textures/colormap.png" "$DST/pf/Textures/"
rm -rf "$TMP"; echo "models → $DST"
