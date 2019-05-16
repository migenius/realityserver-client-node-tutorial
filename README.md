# realityserver-client-node-tutorial

A simple Node.js example rendering script for [migenius's](https://migenius.com "migenius") [RealityServer](https://www.migenius.com/products/realityserver "RealityServer")®.

Demonstrates simple Node.js usage of the [RealityServer® Client Library](https://github.com/migenius/realityserver-client "RealityServer Client Library"). While usable as a command line renderer this is primarily for demonstrating how to use the API in Node.js.
 
## Usage

```console
$ node index.js [--ssl] <host> <port> <scene_file> <width> <height> <max_samples> <filename>
```

Example:

```console
$ node index.js localhost 8080 scenes/meyemii.mi 500 500 1000 render.png

```
