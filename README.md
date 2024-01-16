# node-sea

It's a simple tool which build js as a single executable for easy deploying.

## How to use it

### Use it as a tool

1. `npm i -g @liudonghua123/node-sea`
2. `node-sea -h`
3. `node-sea -e /path/to/your/script -o /path/to/single/executable`

### Use it as a libary

1. `npm i -S @liudonghua123/node-sea`
2. `import sea from "@liudonghua123/node-sea";`
3. invoke [`sea`](https://github.com/liudonghua123/node-sea/blob/main/lib/index.js) function just like [`node-sea.js`](https://github.com/liudonghua123/node-sea/blob/main/bin/node-sea.js).

## Example usage

[![asciicast](https://asciinema.org/a/631593.svg)](https://asciinema.org/a/631593)

## ToDos

- [x] add github ci action for building node with [intl](https://nodejs.org/api/intl.html) customization.
- [x] config the node binary used when create sea to reduce the size of executable.
- [ ] add ncc build feature.

## License

MIT License

Copyright (c) 2024 liudonghua.
