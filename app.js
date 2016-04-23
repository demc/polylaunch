var fastclick = require('fastclick');
var polylaunch = require('./polylaunch');

polylaunch(function(P) {
  fastclick(document.body);

  var app = P.App(
    'container',
    document.body.scrollWidth,
    document.body.scrollHeight
  );

  app.draw();
});
