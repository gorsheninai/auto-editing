#!/bin/bash
# Скачивает свободные 3D-модели для библиотеки library/diorama3d в <reel>/public/models (в git не хранятся).
#   bash tools/fetch_models.sh reels/NN-name
# Источники (GitHub):
#   KayKit City Builder Bits 1.0 — CC0 (Kay Lousberg): здания, дороги, машины, фонари, скамейки
#   three.js r169 examples: Xbot.glb (манекен Mixamo, анимации idle/walk/run/agree/headShake/sad_pose/sneak_pose),
#                           RobotExpressive.glb (CC0, Tomás Laulhé) — робот с 14 анимациями
# Xbot упрощается до ~10 тыс. треугольников (gltf-transform simplify), иначе толпы тормозят на swangle.
set -e
DIR="$1/public/models"; mkdir -p "$DIR/city"
TMP=$(mktemp -d)
git clone -q --depth 1 https://github.com/KayKit-Game-Assets/KayKit-City-Builder-Bits-1.0 "$TMP/kk"
cp "$TMP"/kk/addons/kaykit_city_builder_bits/Assets/gltf/* "$DIR/city/"
B=https://raw.githubusercontent.com/mrdoob/three.js/r169/examples/models/gltf
curl -sL -o "$TMP/Xbot.glb" $B/Xbot.glb
curl -sL -o "$DIR/robot.glb" $B/RobotExpressive/RobotExpressive.glb
(cd "$TMP" && npm i -s --no-audit --no-fund @gltf-transform/cli@4.1.1 >/dev/null 2>&1 && npx gltf-transform simplify Xbot.glb "$DIR/xbot.glb" --ratio 0.2 --error 0.01 >/dev/null)
rm -rf "$TMP"
ls -la "$DIR" | tail -3
