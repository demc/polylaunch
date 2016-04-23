var Konva = require('konva');

module.exports = PolyLaunch = function (callback) {

  // Override pixelRatio
  Konva.pixelRatio = window.devicePixelRatio;

  var App = function(containerName, width, height) {
    if (!(this instanceof App)) {
      return new App(containerName, width, height);
    }

    this.height = height;
    this.width = width;
    
    this._launcherManager = new LauncherManager();
    this._pipeManager = new PipeManager();
    this._obstacleManager = new ObstacleManager();
    this._targetManager = new TargetManager();

    this._pipes = [];

    this._stage = new Konva.Stage({
      container: containerName,
      height: height,
      width: width,
    });

    this._pipeLayer = new Konva.Layer();

    this._stage.add(this._pipeLayer);

    this._registerHandlers();
  };

  App.prototype._registerHandlers = function() {
    var handler = function(event) {
      var x0 = event.x;
      var y0 = event.y;

      if (!this._pipeLayer.getIntersection({x: x0, y: y0})) {
        var pipe = new QuadraticPipe(this, this._pipeLayer, x0, y0, x0 + 50, y0 + 50, x0 + 100, y0 + 100);
        this.addPipe(pipe);
      }
    }.bind(this);

    var content = this._stage.getContent();
    content.addEventListener('click', handler);
  };

  App.prototype.addPipe = function(pipe) {
    this._pipes.push(pipe);
    this._pipeLayer.add(pipe.getGroup());
    this._pipeLayer.draw();
  };

  App.prototype.draw = function() {
    this._stage.draw();
  };

  App.prototype.setCursor = function(cursor) {
    this._oldCursor = document.body.style.cursor || 'default';
    document.body.style.cursor = cursor;
  };

  App.prototype.revertCursor = function() {
    if (this._oldCursor) {
      document.body.style.cursor = this._oldCursor;
    }
  };

  var QuadraticPipe = function(app, layer, x0, y0, x1, y1, x2, y2) {
    this._app = app;
    this._layer = layer;

    var xMax = Math.max(x0, x1, x2);
    var xMin = Math.min(x0, x1, x2);
    var yMax = Math.max(y0, y1, y2);
    var yMin = Math.min(y0, y1, y2);

    var height = Math.abs(yMin - yMax);
    var width = Math.abs(xMin - xMax);

    this._boundingBox = new Konva.Rect({
      height: height,
      width: width,
      x: xMin,
      y: yMin,
      dash: [1, 2],
      stroke: '#ccc',
      strokeWidth: 1,      
    });
    
    this._controlAnchor = new Konva.Circle({
      draggable: true,
      fill: 'pink',
      radius: 5,
      stroke: 'red',
      strokeWidth: 1,
      x: x1,
      y: y1
    });

    this._endAnchor = new Konva.Circle({
      draggable: true,
      fill: '#eee',
      radius: 5,
      stroke: '#222',
      strokeWidth: 1,
      x: x2,
      y: y2
    });

    this._startAnchor = new Konva.Circle({
      draggable: true,    
      fill: '#eee',
      radius: 5,
      stroke: '#222',
      strokeWidth: 1,
      x: x0,
      y: y0
    });

    this._group = new Konva.Group({draggable: true});

    this._group.add(this._boundingBox);
    this._group.add(this._controlAnchor);
    this._group.add(this._startAnchor);   
    this._group.add(this._endAnchor);

    this._boundingBox.on('mouseenter', function(event) {
      this._app.setCursor('move');        
    }.bind(this));

    this._group.on('mouseout', function(event) {
      this._app.revertCursor();
    }.bind(this));

    var pointMouseEnterHandler = function(event) {
      event.target.setStrokeWidth(2).setRadius(7);
      this._app.setCursor('default');
      this._app.draw();
    }.bind(this);

    var pointMouseOutHandler = function(event) {
      event.target.setStrokeWidth(1).setRadius(5);
      this._app.draw();
    }.bind(this);

    this._controlAnchor.on('mouseenter', pointMouseEnterHandler);
    this._endAnchor.on('mouseenter', pointMouseEnterHandler);
    this._startAnchor.on('mouseenter', pointMouseEnterHandler); 

    this._controlAnchor.on('mouseout', pointMouseOutHandler);
    this._endAnchor.on('mouseout', pointMouseOutHandler);
    this._startAnchor.on('mouseout', pointMouseOutHandler);

    this._controlAnchor.on('dragmove', function(event) {
      var x = event.target.x();
      var y = event.target.y();

      this.setControlPoint({x: x, y: y});
      this.updateBoundingBox();

      this._app.draw();
    }.bind(this));

    this._endAnchor.on('dragmove', function(event) {
      var x = event.target.x();
      var y = event.target.y();

      this.setEndPoint({x: x, y: y});
      this.updateBoundingBox();

      this._app.draw();
    }.bind(this));

    this._startAnchor.on('dragmove', function(event) {
      var x = event.target.x();
      var y = event.target.y();

      this.setStartPoint({x: x, y: y});
      this.updateBoundingBox();

      this._app.draw();
    }.bind(this));

    this._controlPoint = {x: x1, y: y1};
    this._endPoint = {x: x2, y: y2};
    this._startPoint = {x: x0, y: y0};
  };

  QuadraticPipe.prototype.draw = function() {

  };

  QuadraticPipe.prototype.getGroup = function() {
    return this._group;
  };
  
  QuadraticPipe.prototype.getControlPoint = function() {
    return this._controlPoint;
  };

  QuadraticPipe.prototype.getEndPoint = function() {
    return this._endPoint;
  };

  QuadraticPipe.prototype.getStartPoint = function() {
    return this._startPoint;
  };

  QuadraticPipe.prototype.setControlPoint = function(point) {
    this._controlPoint = point;
  }

  QuadraticPipe.prototype.setEndPoint = function(point) {
    this._endPoint = point;
  };

  QuadraticPipe.prototype.setStartPoint = function(point) {
    this._startPoint = point;
  };

  QuadraticPipe.prototype.updateBoundingBox = function() {
    var xMax = Math.max(this._controlPoint.x, this._endPoint.x, this._startPoint.x);
    var xMin = Math.min(this._controlPoint.x, this._endPoint.x, this._startPoint.x);
    var yMax = Math.max(this._controlPoint.y, this._endPoint.y, this._startPoint.y);
    var yMin = Math.min(this._controlPoint.y, this._endPoint.y, this._startPoint.y);

    var height = Math.abs(yMin - yMax);
    var width = Math.abs(xMin - xMax);

    this._boundingBox
      .setHeight(height)
      .setWidth(width)
      .setX(xMin)
      .setY(yMin);
  };

  var CubicPipe = function() {

  };

  var LauncherManager = function() {

  };

  var PipeManager = function() {

  };

  var ObstacleManager = function() {

  };

  var TargetManager = function() {

  };

  callback({
    App: App,
    QuadraticPipe: QuadraticPipe,
    CubicPipe: CubicPipe,
    LauncherManager: LauncherManager,
    PipeManager: PipeManager,
    ObstacleManager: ObstacleManager,
    TargetManager: TargetManager
  });
};
