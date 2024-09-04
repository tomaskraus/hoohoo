#!/usr/bin/bash

rm -r dist
npx hoohoo extract examples/example-1.md -l ts
echo "- compile ----------------------------"
npx tsc && npx hoohoo test examples/example-1.md -l ts --jsDir dist/examples/example-1_hh