#!/usr/bin/bash

rm -r dist
npx hoohoo extract examples/example-1.md -l ts
npx tsc
npx hoohoo check examples/example-1.md -l ts --jsDir dist/hh-extracted.example-1