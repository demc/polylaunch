var roundPrecision = require('round-precision');

function bezier2(name, p0, p1, p2) {
  function interpolator(t) {
    return (
      (p0 * Math.pow(1 - t, 2)) +
      (p1 * 2 * (1 - t) * t) +
      (p2 * Math.pow(t, 2))
    );
  }

  interpolator.toTex = function() {
    return (
      name + ' = ' +
      roundPrecision(p0, 2) + '(1-t)^2 + ' +
      roundPrecision(p1, 2) + ' 2(1-t)t + ' +
      roundPrecision(p2, 2) + 't^2'
    );  
  };

  return interpolator;
}

module.exports = function(controlPoint, startPoint, endPoint) {
  return {
    x: bezier2('x', startPoint.x, controlPoint.x, endPoint.x),
    y: bezier2('y', startPoint.y, controlPoint.y, endPoint.y)
  }
};
