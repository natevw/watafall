var ctx = new AudioContext(),
    gfx = document.querySelector('canvas#spectrum').getContext('2d'),
    gfx2 = document.querySelector('canvas#waterfall').getContext('2d');

function makeScale(domain, range) {
  var d0 = domain[0], dd = domain[1] - d0,
      r0 = range[0], rr = range[1] - r0,
      m = rr / dd;
  return function (x) {
    return m * (x - d0) + r0;
  };
}

// via https://code.google.com/p/chromium/issues/detail?id=420625#c1
// and https://code.google.com/p/chromium/issues/detail?id=289396#c5
var audioOpts = {
  optional: [
    {googEchoCancellation:false},
    {googAutoGainControl:false},
    {googNoiseSuppression:false},
    {googHighpassFilter:false}
  ]
};

navigator.webkitGetUserMedia({audio:audioOpts}, function (stream) {
  var src = ctx.createMediaStreamSource(stream),
      fft = ctx.createAnalyser();
  fft.minDecibels = -200;
  src.connect(fft);
  
  var a = new Float32Array(fft.frequencyBinCount),
      buf = gfx2.createImageData(fft.frequencyBinCount, gfx2.canvas.height), buf_idx = -1;
  if (buf.width !== gfx2.canvas.width) console.warn("Waterfall canvas does not match buffer width!");
  setInterval(function () {
      fft.getFloatFrequencyData(a);
      
      var w = gfx.canvas.width,
          h = gfx.canvas.height,
          mapX = makeScale([0,a.length], [0,w]),
          mapY = makeScale([fft.minDecibels,fft.maxDecibels], [h,0]);
      gfx.clearRect(0,0, w,h);
      gfx.strokeStyle = "white";
      gfx.beginPath();
      gfx.moveTo(mapX(0), mapY(a[0]));
      for (var i = 1; i < a.length; i += 1) {
        gfx.lineTo(mapX(i), mapY(a[i]));
      }
      gfx.stroke();
      
      var buf_line = buf.height - 1 - buf_idx,
          lineStart = buf_line * buf.width * 4,
          mapZ = makeScale([fft.minDecibels,fft.maxDecibels], [0,255]);
//console.log(lineStart);
      for (var i = 0; i < a.length; i += 1) {
        var p = lineStart + (i << 2),
            z = mapZ(a[i]);
        buf.data.fill(z, p, p + 3);
        buf.data[p+3] = 255;
      }
      gfx2.putImageData(buf, 0,-buf_line);      // buf_line should be at 0
      gfx2.putImageData(buf, 0,buf_idx);//, 0,-buf_line, 0,0);
      
      buf_idx = (buf_idx + 1) % buf.height;
  }, 20);
  
  window.dbg = {fft:fft, buf:buf};
  
  console.log("stream:", stream, src, fft);
}, function (err) {
  console.error(err);
});