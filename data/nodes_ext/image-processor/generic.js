const drawLine = (image, color, x0, y0, x1, y1) => {

// Bresenham algorithm

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = (x0 < x1) ? 1 : -1;
  const sy = (y0 < y1) ? 1 : -1;
  let err = dx - dy;
  // Set first coordinates
  image.setPixelColor(color, x0, y0);
  while (!((x0 == x1) && (y0 == y1))) {
    let e2 = err << 1;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
    // Set coordinates
    image.setPixelColor(color, x0, y0);
  }
}

const drawRect = (image, color, x0, y0, x1, y1) => {
  drawLine(image, color, x0, y0, x0, y1);
  drawLine(image, color, x0, y1, x1, y1);
  drawLine(image, color, x1, y1, x1, y0);
  drawLine(image, color, x1, y0, x0, y0);
}


class ImageGenericNode {

  constructor(config) {
    Object.keys(config).forEach(key => {
      if (key.match(/^(motion|image).*$/)) {
        this[key] = config[key];
      }
    });
    ImageGenericNode.RED.nodes.createNode(this, config);
    this.on('input', this.inputHandler);
    this.status({ fill: "grey", shape: "dot", text: "idle..." });
    this.db = null;
  }

  static setup(RED, name) {
    ImageGenericNode.RED = RED;
    RED.nodes.registerType(name, this);
  }

  async inputHandler(msg, send, done) {
    done('Needs to be implemented!')
  }
}

module.exports = { ImageGenericNode, drawLine, drawRect };
