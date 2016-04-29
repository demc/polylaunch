function linearTween(x0, y0, x1, y1) {
  var diffX = x1 - x0;
  var diffY = y1 - y0;
   
  return function(progress) {
    return {
      x: x0 + progress * diffX,
      y: y0 + progress * diffY
    };
  };
}

module.exports = linearTween;
