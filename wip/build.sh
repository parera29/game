#!/bin/sh
# Une las partes en un único index.html
cd "$(dirname "$0")" && cat p0.html p1.js p2.js p3.js p4.js p5.js p6.js p7.js p8.js > ../index.html && echo "index.html: $(wc -l < ../index.html) líneas"
