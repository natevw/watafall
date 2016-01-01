var ctx = new AudioContext(),
    gfx = document.querySelector('canvas').getContext('2d');

function makeScale(domain, range) {
  var d0 = domain[0], dd = domain[1] - d0,
      r0 = range[0], rr = range[1] - r0,
      m = rr / dd;
  return function (x) {
    return m * (x - d0) + r0;
  };
}

navigator.webkitGetUserMedia({audio:true}, function (stream) {
  var src = ctx.createMediaStreamSource(stream),
      fft = ctx.createAnalyser();
  fft.minDecibels = -200;
  src.connect(fft);
  
  var a = new Float32Array(fft.frequencyBinCount);
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
  }, 20);
  
  
  window.dbgFft = fft;
  
  console.log("stream:", stream, src, fft);
}, function (err) {
  console.error(err);
});