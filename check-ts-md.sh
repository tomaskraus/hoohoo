#!/usr/bin/bash

rm -r dist
npx hoohoo extract examples/example-1.md -l ts
echo "- compile ----------------------------"
npx tsc && npx hoohoo check examples/example-1.md -l ts --jsDir dist/example-1_hh