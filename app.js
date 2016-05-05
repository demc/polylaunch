var fastclick = require('fastclick');
var polylaunch = require('./polylaunch');

polylaunch(function(P) {
  fastclick(document.body);

  var app = new P.App(
    'container',
    'sketchpad',
    'tableview',
    'sliderview',
    window.innerWidth,
    window.innerHeight
  );

  window.addEventListener('resize', function() {
    app.resize(window.innerWidth, window.innerHeight);
  });

  document
    .getElementById('actionButton')
    .addEventListener('click', function() {
      app.createPipeAt(0, 0); 
    });

  app.draw();
});
