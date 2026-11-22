(function () {
  function PixelWave(options) {
    options = options || {};
    this.color = options.color || "#6e81bd";
    this.speedIn = typeof options.speedIn === "number" ? options.speedIn : 2;
    this.speedOut = typeof options.speedOut === "number" ? options.speedOut : 1;
    this.autoCalculateSquaresSize =
      options.autoCalculateSquaresSize !== false;

    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.canvas.style.position = "fixed";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.pointerEvents = "none";
    this.canvas.style.zIndex = "9999";
    this.canvas.style.display = "none";
    document.body.appendChild(this.canvas);

    this._running = false;
    this._queue = [];
    this._resize = this._resize.bind(this);
    window.addEventListener("resize", this._resize);
    this._resize();
  }

  PixelWave.prototype._resize = function () {
    var dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var target = this.autoCalculateSquaresSize
      ? Math.max(28, Math.min(56, Math.round(this.width / 32)))
      : 40;
    this.size = target;
    this.cols = Math.ceil(this.width / this.size) + 1;
    this.rows = Math.ceil(this.height / this.size) + 1;
    this.maxDiag = this.cols + this.rows;
  };

  PixelWave.prototype._draw = function (progress, covering) {
    var ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.fillStyle = this.color;

    var size = this.size;
    var maxDiag = this.maxDiag || 1;
    var span = 0.45;

    for (var r = 0; r < this.rows; r++) {
      for (var c = 0; c < this.cols; c++) {
        var diag = c + r;
        var start = (diag / maxDiag) * span;
        var local;
        if (covering) {
          local = (progress - start) / (1 - span);
        } else {
          local = (progress - (span - start)) / (1 - span);
        }
        if (local <= 0) {
          if (!covering) {
            ctx.fillRect(c * size, r * size, size + 1, size + 1);
          }
          continue;
        }
        if (local >= 1) {
          if (covering) {
            ctx.fillRect(c * size, r * size, size + 1, size + 1);
          }
          continue;
        }
        var t = 1 - Math.pow(1 - local, 3);
        var s = covering ? t : 1 - t;
        var drawSize = (size + 1) * s;
        var offset = (size + 1 - drawSize) / 2;
        ctx.fillRect(c * size + offset, r * size + offset, drawSize, drawSize);
      }
    }
  };

  PixelWave.prototype._animate = function (duration, covering, done) {
    var self = this;
    var startTime = null;
    function frame(now) {
      if (!startTime) startTime = now;
      var elapsed = (now - startTime) / 1000;
      var p = Math.min(1, elapsed / Math.max(0.001, duration));
      self._draw(p, covering);
      if (p < 1) {
        requestAnimationFrame(frame);
      } else {
        self._draw(1, covering);
        done();
      }
    }
    requestAnimationFrame(frame);
  };

  PixelWave.prototype.start = function (onCovered) {
    var self = this;
    if (self._running) {
      self._queue.push(onCovered);
      return;
    }
    self._running = true;
    self._resize();
    self.canvas.style.display = "block";

    var mid = function () {
      try {
        if (typeof onCovered === "function") onCovered();
      } catch (e) {
        console.error(e);
      }
    };

    self._animate(self.speedIn, true, function () {
      mid();
      self._animate(self.speedOut, false, function () {
        self.ctx.clearRect(0, 0, self.width, self.height);
        self.canvas.style.display = "none";
        self._running = false;
        if (self._queue.length) {
          var next = self._queue.shift();
          self.start(next);
        }
      });
    });
  };

  window.PixelWave = PixelWave;
  if (!window.pixelwave) {
    window.pixelwave = new PixelWave({
      speedIn: 2,
      speedOut: 1,
      autoCalculateSquaresSize: true,
      color: "#6e81bd",
    });
  }
})();