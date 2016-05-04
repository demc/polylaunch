var Katex = require('katex');
var Konva = require('konva');

var debounce = require('debounce');
var bezier2 = require('./bezier2');
var linearTween = require('./linear-tween');
var roundPrecision = require('round-precision');

var recycleBin = document.createElement('div');

module.exports = function(callback) {

  // Override pixelRatio
  Konva.pixelRatio = window.devicePixelRatio;

  var App = function(containerId, sketchpadId, tableviewId, width, height) {
    this._containerId = containerId;
    this._sketchpadId = sketchpadId;
    this._tableviewId = tableviewId;

    this.height = height;
    this.width = width;

    this._pipes = [];

    this._stage = new Konva.Stage({
      container: containerId,
      height: height,
      width: width,
    });

    this._freeAnimationLayers = [];
    this._usedAnimationLayers = [];
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

      var formulaNode = document.createElement('div');
      formulaNode.className = 'formula';

      var sketchpad = document.getElementById(this._sketchpadId);
      sketchpad.appendChild(formulaNode);

      recycleBin.innerHTML = document.getElementById('table-tmpl').textContent;
      var tableNode = recycleBin.children[0];
      recycleBin.innerHTML = '';
      tableNode.style.display = 'none';

      var tableview = document.getElementById(this._tableviewId);
      tableview.appendChild(tableNode);

      var pipe = new QuadraticPipe(
        this,
        this._pipeLayer,
        formulaNode,
        tableNode,
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
      height: height,
      width: width
    });

    this._stage.draw();
  }, 300);

  App.prototype.revertCursor = function() {
    if (this._oldCursor) {
      document.body.style.cursor = this._oldCursor;
    }
  };

  App.prototype.requestAnimationLayer = function(callback) {
    var animLayer = this._freeAnimationLayers.length
      ? this._freeAnimationLayers.shift()
      : new Konva.Layer();
    
    this._stage.add(animLayer);

    function destroy() { 
      animLayer.removeChildren();
      animLayer.draw();
      this._freeAnimationLayers.push(animLayer);
    }

    callback(animLayer, destroy.bind(this));
  };

  var QuadraticPipe = function(app, layer, formulaNode, tableNode, x0, y0, x1, y1, x2, y2) {
    this._app = app;
    this._layer = layer;
    this._formulaNode = formulaNode;
    this._tableNode = tableNode;

    this._controlPoint = {x: x1, y: y1};
    this._endPoint = {x: x2, y: y2};
    this._startPoint = {x: x0, y: y0};

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
      fill: 'lightblue',
      radius: 5,
      stroke: 'blue',
      strokeWidth: 1,
      x: x2,
      y: y2
    });

    this._startAnchor = new Konva.Circle({
      draggable: true,    
      fill: 'lightgreen',
      radius: 5,
      stroke: 'green',
      strokeWidth: 1,
      x: x0,
      y: y0
    });

    this._animButtonGroup = new Konva.Group()
      .setX(xMax + 10)
      .setY(yMin);

    this._animButton = new Konva.Rect({
      fill: 'green',
      height: 24,
      width: 24,
      x: 0, 
      y: 0
    });

    this._animTriangle = new Konva.Text({
      fill: '#FFF',
      fontSize: 18,
      text: '\u25B6',
      x: 4,
      y: 5
    });

    this._animButtonGroup
      .add(this._animButton)
      .add(this._animTriangle);


    this._group = new Konva.Group({draggable: true});

    this._group.add(this._curve);
    this._group.add(this._boundingBox);
    this._group.add(this._controlAnchor);
    this._group.add(this._endAnchor);
    this._group.add(this._startAnchor);
    this._group.add(this._animButtonGroup);  

    this._boundingBox.on('mouseenter', function(event) {
      this._app.setCursor('move');        
    }.bind(this));

    this._group.on('mouseout', function(event) {
      this._app.revertCursor();
    }.bind(this));

    this._animButtonGroup.on('click', this.animate.bind(this));

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
      this.updateformulaNode();

      this._app.draw();
    }.bind(this));

    this._endAnchor.on('dragmove', function(event) {
      var x = event.target.x();
      var y = event.target.y();

      this.setEndPoint({x: x, y: y});
      this.updateBoundingBox();
      this.updateCurve();
      this.updateformulaNode();

      this._app.draw();
    }.bind(this));

    this._startAnchor.on('dragmove', function(event) {
      var x = event.target.x();
      var y = event.target.y();

      this.setStartPoint({x: x, y: y});
      this.updateBoundingBox();
      this.updateCurve();
      this.updateformulaNode();

      this._app.draw();
    }.bind(this));

    this._group.on('dragmove', this.updateformulaNode.bind(this));
  };

  QuadraticPipe.prototype.animate = function() {
    this._group.hide();
    this._app.draw();

    var x = this._group.x();
    var y = this._group.y();

    this._app.requestAnimationLayer(function(layer, destroy) {
      var anim = new QuadraticPipeAnimation(
        layer,
        this._formulaNode,
        this._tableNode,
        {x: x + this._controlPoint.x, y: y + this._controlPoint.y},
        {x: x + this._startPoint.x, y: y + this._startPoint.y},
        {x: x + this._endPoint.x, y: y + this._endPoint.y},
        function() {
          destroy();
          this._tableNode.style.display = 'none';
          this._formulaNode.style.display = 'block';
          this._group.show();
          this._app.draw();
        }.bind(this)
      );

      anim.play();
    }.bind(this));
  };

  QuadraticPipe.prototype.getAbsolutePosition = function() {
    var controlPosition = this._controlAnchor.getAbsolutePosition();
    var endPosition = this._endAnchor.getAbsolutePosition();
    var startPosition = this._startAnchor.getAbsolutePosition();

    return {
      x: Math.min(controlPosition.x, endPosition.x, startPosition.x),
      y: Math.max(controlPosition.y, endPosition.y, startPosition.y)
    };
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

  QuadraticPipe.prototype.hide = function() {
    this._group.hide();
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

  QuadraticPipe.prototype.show = function() {
    this._group.show();
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

    this._animButtonGroup
      .setX(xMax + 10)
      .setY(yMin);
  };

  QuadraticPipe.prototype.updateCurve = function() {
    this._curve.setAttrs({
      controlPoint: this._controlPoint,
      endPoint: this._endPoint,
      startPoint: this._startPoint
    });
  };

  QuadraticPipe.prototype.updateformulaNode = debounce(function() {
    var position = this.getAbsolutePosition();
    var x = this._group.x();
    var y = this._group.y();    

    this._formulaNode.style.left = position.x + 'px';
    this._formulaNode.style.top = position.y + 10 + 'px';

    var b = bezier2(
      {x: x + this._controlPoint.x, y: y + this._controlPoint.y},
      {x: x + this._startPoint.x, y: y + this._startPoint.y},
      {x: x + this._endPoint.x, y: y + this._endPoint.y}
    );
    
    Katex.render(
      '\\begin{cases}' +
      b.x.toTex() + '\\\\' +
      b.y.toTex() +
      '\\end{cases}' +
      '\\text{for } t \\text{ 0 to 1}', 
      this._formulaNode
    );
  }, 10);

  QuadraticPipeAnimation = function(
    layer,
    formulaNode,
    tableNode,
    controlPoint,
    startPoint,
    endPoint,
    destroy
  ) {
    var xMax = Math.max(controlPoint.x, endPoint.x, startPoint.x);
    var xMin = Math.min(controlPoint.x, endPoint.x, startPoint.x);
    var yMax = Math.max(controlPoint.y, endPoint.y, startPoint.y);
    var yMin = Math.min(controlPoint.y, endPoint.y, startPoint.y);

    this._controlPoint = controlPoint;
    this._destroy = destroy;
    this._endPoint = endPoint;
    this._formulaNode = formulaNode;
    this._i = 0;
    this._layer = layer;
    this._mode = 'formula';
    this._progress = 0;
    this._startPoint = startPoint;
    this._tableNode = tableNode;
    this._tableBody = tableNode.querySelector('tbody');

    tableNode.style.left = xMax + 60 + 'px';
    tableNode.style.top = yMin + 'px';

    this._controlAnchor = new Konva.Circle({
      fill: 'pink',
      radius: 5,
      stroke: 'red',
      strokeWidth: 1,
      x: controlPoint.x,
      y: controlPoint.y
    });

    this._endAnchor = new Konva.Circle({
      fill: 'lightblue',
      radius: 5,
      stroke: 'blue',
      strokeWidth: 1,
      x: endPoint.x,
      y: endPoint.y
    });

    this._startAnchor = new Konva.Circle({
      fill: 'lightgreen',
      radius: 5,
      stroke: 'green',
      strokeWidth: 1,
      x: startPoint.x,
      y: startPoint.y
    });

    this._controlPointText = new Konva.Text({
      fill: 'red',
      text: '(' + controlPoint.x + ', ' + controlPoint.y + ')',
      x: controlPoint.x + 10,
      y: controlPoint.y - 5
    });

    this._endPointText = new Konva.Text({
      fill: 'blue',
      text: '(' + endPoint.x + ', ' + endPoint.y + ')',
      x: endPoint.x + 10,
      y: endPoint.y - 5
    });

    this._startPointText = new Konva.Text({
      fill: 'green',
      text: '(' + startPoint.x + ', ' + startPoint.y + ')',
      x: startPoint.x + 10,
      y: startPoint.y - 5
    });

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
      stroke: 'red',
      strokeWidth: 3,
      startPoint: {x: startPoint.x, y: startPoint.y},
      controlPoint: {x: startPoint.x, y: startPoint.y},
      endPoint: {x: startPoint.x, y: startPoint.y}
    });

    this._lineA = new Konva.Line({
      points: [
        this._startPoint.x, this._startPoint.y,
        this._controlPoint.x, this._controlPoint.y
      ],
      stroke: '#222',
      strokeWidth: 1,
    });

    this._lineB = new Konva.Line({
      points: [
        this._controlPoint.x, this._controlPoint.y,
        this._endPoint.x, this._endPoint.y
      ],
      stroke: '#222',
      strokeWidth: 1,
    });

    this._animPointA = {x: startPoint.x, y: startPoint.y};
    this._animPointB = {x: controlPoint.x, y: controlPoint.y};

    this._tweenAB = linearTween(startPoint.x, startPoint.y, controlPoint.x, controlPoint.y);
    this._tweenBC = linearTween(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y);

    this._animAnchorA = new Konva.Circle({
      fill: 'green',
      radius: 3,
      strokeWidth: 0,
      x: startPoint.x,
      y: startPoint.y
    });

    this._animAnchorB = new Konva.Circle({
      fill: 'green',
      radius: 3,
      strokeWidth: 0,
      x: controlPoint.x,
      y: controlPoint.y
    }); 

    this._animAnchorC = new Konva.Circle({
      fill: 'red',
      radius: 5,
      strokeWidth: 0,
      x: startPoint.x,
      y: startPoint.y
    });

    this._animLine = new Konva.Line({
      points: [
        this._animPointA.x, this._animPointA.y,
        this._animPointB.x, this._animPointB.y
      ],
      stroke: 'green',
      strokeWidth: 1,
    });

    this._pausePlayButtonGroup = new Konva.Group({
      x: xMax + 10,
      y: yMin,
    });

    this._pausePlayButton = new Konva.Rect({
      height: 24,
      width: 24,
    });

    this._pausePlayButtonText = new Konva.Text({
      fill: '#FFF',
      fontSize: 18,
      x: 5,
      y: 4
    });

    this._pausePlayButtonGroup
      .add(this._pausePlayButton)
      .add(this._pausePlayButtonText);
    
    this._modeButtonGroup = new Konva.Group()
      .setX(xMax + 10)
      .setY(yMin + 28);

    this._modeButton = new Konva.Rect({
      fill: 'blue',
      height: 24,
      width: 24,
      x: 0, 
      y: 0
    });    

    this._modeSymbol = new Konva.Text({
      fill: '#FFF',
      fontSize: 18,
      text: '\u25a4',
      x: 4,
      y: 4
    });

    this._modeButtonGroup
      .add(this._modeButton)
      .add(this._modeSymbol);

    this._backButtonGroup = new Konva.Group({
      x: xMax + 10,
      y: yMin + 56
    });

    this._backButton = new Konva.Rect({
      fill: '#777',
      height: 24,
      width: 24
    });

    this._backButtonText = new Konva.Text({
      fill: '#FFF',
      fontSize: 18,
      rotation: 180,
      text: '\u27A5',
      x: 20,
      y: 21
    });

    this._backButtonGroup
      .add(this._backButton)
      .add(this._backButtonText);

    this._layer.add(this._lineA);
    this._layer.add(this._lineB);
    this._layer.add(this._curve);
    this._layer.add(this._animLine);
    this._layer.add(this._animAnchorA);
    this._layer.add(this._animAnchorB);
    this._layer.add(this._animAnchorC);
    this._layer.add(this._controlAnchor);
    this._layer.add(this._endAnchor);
    this._layer.add(this._startAnchor);
    this._layer.add(this._pausePlayButtonGroup);
    this._layer.add(this._modeButtonGroup);
    this._layer.add(this._backButtonGroup);
    this._layer.add(this._controlPointText);
    this._layer.add(this._endPointText);
    this._layer.add(this._startPointText);

    this._backButtonGroup.on('click', this.destroy.bind(this));
    this._modeButtonGroup.on('click', function() {
      if (this._mode === 'formula') {
        this.tableMode();
      } else {
        this.formulaMode();
      }
    }.bind(this));

    this._anim = new Konva.Animation(
      this._tick.bind(this),
      layer
    ); 
  };

  QuadraticPipeAnimation.prototype._tick = function(frame) {
    var rate = this._mode === 'table' ? 0.002 : 0.005;
    var progress = this._progress = (this._progress + rate) % 1;

    var ab = this._tweenAB(progress);
    var bc = this._tweenBC(progress);

    var penTween = linearTween(ab.x, ab.y, bc.x, bc.y);
    var pen = penTween(progress);

    this._animAnchorA.setX(ab.x).setY(ab.y);
    this._animAnchorB.setX(bc.x).setY(bc.y);
    this._animAnchorC.setX(pen.x).setY(pen.y);
    this._animLine.setPoints([ab.x, ab.y, bc.x, bc.y]);
    this._curve.setAttrs({
      endPoint: {x: pen.x, y: pen.y},
      controlPoint: {x: ab.x, y: ab.y}
    });

    if (this._mode === 'table') {
      this._i = roundPrecision(progress / 0.05, 0);
      var curr = this._i;
      var prev = curr - 1;
      if (prev < 0) {
        prev = this._tableRows.length - 1;
      }

      this._tableRows[curr].style.color = 'red';
      this._tableRows[prev].style.color = '';
    }
  };

  QuadraticPipeAnimation.prototype.destroy = function() {
    this._anim.stop();
    this._destroy();
  };

  QuadraticPipeAnimation.prototype.formulaMode = function() {
    this._mode = 'formula';
    this._formulaNode.style.display = 'block';
    this._tableNode.style.display = 'none';
  };

  QuadraticPipeAnimation.prototype.tableMode = function() {
    this._mode = 'table';
    this._formulaNode.style.display = 'none';
    this._tableNode.style.display = 'block';

    var fragment = document.createDocumentFragment();
    for (var i = 0.0; i < 1.05; i += 0.05) {
      var ab = this._tweenAB(i);
      var bc = this._tweenBC(i);
      
      var penTween = linearTween(ab.x, ab.y, bc.x, bc.y);
      var pen = penTween(i);

      var row = document.createElement('tr');
      var t = document.createElement('td');
      var x = document.createElement('td');
      var y = document.createElement('td');

      t.textContent = roundPrecision(i, 2);
      x.textContent = roundPrecision(pen.x, 0);
      y.textContent = roundPrecision(pen.y, 0);

      row.appendChild(t);
      row.appendChild(x);
      row.appendChild(y);

      fragment.appendChild(row);
    }

    this._tableBody.innerHTML = '';
    this._tableBody.appendChild(fragment);
    this._tableRows = this._tableBody.querySelectorAll('tr');
  };

  QuadraticPipeAnimation.prototype.play = function() {
    this._pausePlayButton.setFill('red');
    this._pausePlayButtonGroup.off('click');
    this._pausePlayButtonGroup.on('click', this.stop.bind(this));
    this._pausePlayButtonText.setText('\u23F8');

    this._pausePlayButtonGroup.draw();
    this._anim.start();
  };

  QuadraticPipeAnimation.prototype.seek = function(position) {

  };

  QuadraticPipeAnimation.prototype.stop = function() {
    this._pausePlayButton.setFill('green');
    this._pausePlayButtonGroup.off('click');
    this._pausePlayButtonGroup.on('click', this.play.bind(this));
    this._pausePlayButtonText.setText('\u25B6');

  this._pausePlayButtonGroup.draw();
    this._anim.stop();
  };

  callback({
    App: App,
  });
};
