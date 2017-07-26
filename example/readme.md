download the tiles:

* `ipfs get -o ne2srw /ipfs/QmV5PLazMsBk8bRhRAyDhNuJt9N19cjayUSDvw8DKxSmFz`
* `dat clone dat://db9c54fd4775da34109c9afd366cac5d3dff26c6a3902fc9c9c454193b543cbb ne2srw`

then:

```
$ export TILEMETA=$PWD/ne2srw/tiles.json
$ budo main.js -d $(dirname $TILEMETA)
```

