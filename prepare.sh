#!/bin/bash

pnpm i
pnpm run build

rm -rf ../AeriesCompressed
mkdir ../AeriesCompressed

zip -r ../AeriesCompressed/Extension.zip ./Extension

cd Extension

zip -r -FS ../../AeriesCompressed/Archive.zip * --exclude '*.git*'

cd ..

node clean

rm -rf ./Script/output.html
rm -rf ./Script/node_modules
rm -rf ./.idea
rm -rf ./node_modules
rm -rf ./.git

zip -r ../AeriesCompressed/AeriesImproved.zip .