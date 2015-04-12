var PNG = require('png-js');
var charm = require('charm');
var x256 = require('x256');
var buffers = require('buffers');
var es = require('event-stream');

var Stream = require('stream').Stream;

module.exports = function (opts) {
    if (!opts) opts = {};
    if (!opts.cols) opts.cols = 80;
    if (!opts.char) opts.char = '';
    
    var c = charm();
    var bufs = buffers();
    
    var ws = es.writeArray(function (err, bufs) {
        var data = buffers(bufs).slice();
        var png = new PNG(data);
        
        png.decode(function (pixels) {
            var dx = png.width / opts.cols;
            var dy = 2 * dx;
            
            function index(x, y) {
                return (Math.floor(y) * png.width + Math.floor(x)) * 4;
            }

            function rgb(i) {
                return [pixels[i], pixels[i+1], pixels[i+2]];
            }

            function alpha(i) {
                return pixels[i+3];
            }

            var render;
            if (opts.char === '') {
                render = function(top, bottom) {
                    c.background(top).write(' ');
                };
            }
            else {
                render = function(top, bottom) {
                    c.foreground(top).background(bottom).write(opts.char);
                };
            }

            for (var y = 0; y < png.height; y += dy) {
                for (var x = 0; x < png.width; x += dx) {
                    var top = x256(rgb(index(x, y)));
                    var bottom = x256(rgb(index(x, y + 1)));
                    if (alpha(top) > 0 && alpha(bottom) > 0) {
                        render(top, bottom);
                    }
                    else {
                        c.display('reset').write(' ');
                    }
                }
                c.display('reset').write('\r\n');
            }
            
            c.display('reset').end();
        });
    });
    
    return es.duplex(ws, c);
};
