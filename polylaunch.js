var Katex = require('katex');
var Konva = require('konva');
// var MathJax = require('mathjax');

var debounce = require('debounce');
var bezier2 = require('./bezier2');

module.exports = PolyLaunch = function (callback) {

  // Override pixelRatio
  Konva.pixelRatio = window.devicePixelRatio;

  var App = function(containerId, sketchpadId, width, height) {
    if (!(this instanceof App)) {
      return new App(containerId, sketchpadId, width, height);
    }

    this._containerId = containerId;
    this._sketchpadId = sketchpadId;

    this._sketchpadHeight = 150;
    this._stageHeight = height - this._sketchpadHeight;

    this.height = height;
    this.width = width;
    
    this._launcherManager = new LauncherManager();
    this._pipeManager = new PipeManager();
    this._obstacleManager = new ObstacleManager();
    this._targetManager = new TargetManager();

    this._pipes = [];

    this._stage = new Konva.Stage({
      container: containerId,
      height: this._stageHeight,
      width: width,
    });

    this._pipeLayer = new Konva.Layer();

    this._stage.add(this._pipeLayer);

    this._registerHandlers();
  };

  App.prototype.getSketchpadHeight = function() {
    return this._sketchpadHeight;
  };

  App.prototype.getStageHeight = function() {
    return this._stageHeight;
  };

  App.prototype._registerHandlers = function() {
    var container = this._stage.getContainer();
    container.addEventListener('touchmove', function(event) {
      event.preventDefault();
    });
  };

  App.prototype.addPipe = function(pipe) {
    this._pipes.push(pipe);
    this._pipeLayer.add(pipe.getGroup());
    this._pipeLayer.draw();
  };

  App.prototype.createPipeAt = function(x, y) {
    if (!this._pipeLayer.getIntersection({x: x, y: y})) {
      var node = document.createElement('div');
      var sketchpad = document.getElementById(this._sketchpadId);
      sketchpad.appendChild(node);

      var pipe = new QuadraticPipe(
        this,
        this._pipeLayer,
        node,
        x,
        y,
        x + 50,
        y + 50,
        x + 100,
        y + 100
      );

      this.addPipe(pipe);
    }
  };

  App.prototype.draw = function() {
    this._stage.draw();
  };

  App.prototype.getPipeCount = function() {
    return this._pipes.length;
  };

  App.prototype.setCursor = function(cursor) {
    this._oldCursor = document.body.style.cursor || 'default';
    document.body.style.cursor = cursor;
  };

  App.prototype.resize = debounce(function(width, height) {
    this.height = height;
    this.width = width;

    this._stage.setSize({
      height: height - this._sketchpadHeight,
      width: width
    });

    this._stage.draw();
  }, 300);

  App.prototype.revertCursor = function() {
    if (this._oldCursor) {
      document.body.style.cursor = this._oldCursor;
    }
  };

  var QuadraticPipe = function(app, layer, jax, x0, y0, x1, y1, x2, y2) {
    this._app = app;
    this._layer = layer;
    this._jax = jax;

    var xMax = Math.max(x0, x1, x2);
    var xMin = Math.min(x0, x1, x2);
    var yMax = Math.max(y0, y1, y2);
    var yMin = Math.min(y0, y1, y2);

    var height = Math.abs(yMin - yMax);
    var width = Math.abs(xMin - xMax);

    this._curve = new Konva.Shape({
      sceneFunc: function(ctx) {
        var controlPoint = this.attrs.controlPoint;
        var endPoint = this.attrs.endPoint; 
        var startPoint = this.attrs.startPoint;

        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y);
        ctx.strokeShape(this);
      },
      stroke: '#222',
      startPoint: {x: x0, y: y0},
      controlPoint: {x: x1, y: y1},
      endPoint: {x: x2, y: y2}
    });

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

    this._group.add(this._curve);
    this._group.add(this._boundingBox);
    this._group.add(this._controlAnchor);
    this._group.add(this._endAnchor);
    this._group.add(this._startAnchor);  

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
      this.updateCurve();
      this.updateJax();

      this._app.draw();
    }.bind(this));

    this._endAnchor.on('dragmove', function(event) {
      var x = event.target.x();
      var y = event.target.y();

      this.setEndPoint({x: x, y: y});
      this.updateBoundingBox();
      this.updateCurve();
      this.updateJax();

      this._app.draw();
    }.bind(this));

    this._startAnchor.on('dragmove', function(event) {
      var x = event.target.x();
      var y = event.target.y();

      this.setStartPoint({x: x, y: y});
      this.updateBoundingBox();
      this.updateCurve();
      this.updateJax();

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

  QuadraticPipe.prototype.updateCurve = function() {
    this._curve.setAttrs({
      controlPoint: this._controlPoint,
      endPoint: this._endPoint,
      startPoint: this._startPoint
    });
  };

  QuadraticPipe.prototype.updateJax = debounce(function() {
    var b = bezier2(this._controlPoint, this._startPoint, this._endPoint);
    
    Katex.render(
      '\\begin{cases}' +
      b.x.toTex() + '\\\\' +
      b.y.toTex() +
      '\\end{cases}' +
      '\\text{for } t \\text{ 0 to 1}', 
      this._jax
    );
  }, 100);

  QuadraticPipe.prototype.onUpdate = function(tex) {
    this._updateHandler && this._updateHandler(tex);
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
