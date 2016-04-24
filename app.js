var fastclick = require('fastclick');
var polylaunch = require('./polylaunch');

polylaunch(function(P) {
  fastclick(document.body);

  var app = P.App(
    'container',
    window.innerWidth,
    window.innerHeight
  );

  window.addEventListener('resize', function() {
    app.resize(window.innerWidth, window.innerHeight);
  });
  
  app.draw();
});
