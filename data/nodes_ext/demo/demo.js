const Jimp = require('jimp');
const {
  ImageGenericNode,
  drawRect
} = require('./generic.js');

const SEGMENT_BLOCK_WIDTH = 64
const SEGMENT_BLOCK_HEIGHT = 45

const isPixelSet = (image, x, y) => {
  color = Jimp.intToRGBA(image.getPixelColor(x, y));
  return (color.r == 255) ? false : true;
}

const analyzeSegment = (image, x, y, dx, dy, number) => {
  if (!isPixelSet(image, x, y)) {
    const iw = image.bitmap.width;
    const ih = image.bitmap.height;
    const xCheckPossible = ((dx > 0 && x > 0) || (dx < 0 && x < iw - 1)) ? 1 : 0;
    const yCheckPossible = ((dy > 0 && y > 0) || (dy < 0 && y < ih - 1)) ? 1 : 0;
    if (xCheckPossible && yCheckPossible &&
      isPixelSet(image, x - dx, y) &&
      isPixelSet(image, x, y - dy)) {
      image.setPixelColor(number, x, y);
    } else {
      const xCheckNextPossible = ((dx > 0 && x < iw - 1) || (dx < 0 && x > 0)) ? 1 : 0;

      if (xCheckPossible && xCheckNextPossible &&
        isPixelSet(image, x - dx, y) &&
        isPixelSet(image, x + dx, y)) {
        image.setPixelColor(number, x, y);
      } else {
        const yCheckNextPossible = ((dy > 0 && y < ih - 1) || (dy < 0 && y > 0)) ? 1 : 0;
        if (yCheckPossible && yCheckNextPossible &&
          isPixelSet(image, x, y - dy) &&
          isPixelSet(image, x, y + dy)) {
          image.setPixelColor(number, x, y);
        }
      }
    }
  }
}

class DemoNode extends ImageGenericNode {

  constructor(config) {
    super(config);
    this.previousImage = null;
    //this.rawDiffImage = null;
  }

  async inputHandler(msg, send, done) {
    const originalImage = await Jimp.read(msg.payload).catch(e => null);
    if (originalImage) {
      msg.motionImage = originalImage.clone();
      msg.resized = originalImage.clone().greyscale().posterize(SEGMENT_BLOCK_WIDTH).resize(SEGMENT_BLOCK_WIDTH, Jimp.AUTO);
      if (this.previousImage) {
        msg.rawDiffImage = msg.resized.clone();
        msg.resized.scan(0, 0, msg.resized.bitmap.width, msg.resized.bitmap.height, (x, y, idx) => {
          const resizedColor = Jimp.intToRGBA(msg.resized.getPixelColor(x, y));
          const previousColor = Jimp.intToRGBA(this.previousImage.getPixelColor(x, y));
          const diff = Math.abs(resizedColor.r - previousColor.r);
          const c = (diff > 15) ? 0 : 255;
          const diffColor = Jimp.rgbaToInt(c, c, c, 255);
          msg.rawDiffImage.setPixelColor(diffColor, x, y);
        });
        // msg.rawDiffImage.greyscale();
        msg.buildRectImage = msg.rawDiffImage.clone();

        let color, x, y;
        for (y = 0; y < msg.buildRectImage.bitmap.height; y++) {
          for (x = 0; x < msg.buildRectImage.bitmap.width; x++) {

            analyzeSegment(msg.buildRectImage, x, y, 1, 1, Jimp.rgbaToInt(5, 128, 0, 255));
            analyzeSegment(msg.buildRectImage, msg.buildRectImage.bitmap.width - x - 1, y, -1, 1, Jimp.rgbaToInt(5, 0, 128, 255));
            analyzeSegment(msg.buildRectImage, x, msg.buildRectImage.bitmap.height - y - 1, 1, -1, Jimp.rgbaToInt(128, 128, 0, 255));
            analyzeSegment(msg.buildRectImage, msg.buildRectImage.bitmap.width - x - 1,
              msg.buildRectImage.bitmap.height - y - 1, -1, -1, Jimp.rgbaToInt(128, 0, 0, 255));
          }
        }

        // find rect

        msg.motions = [];
        let w, h;

        for (let y = 0; y < msg.buildRectImage.bitmap.height - 3; y++) {
          for (let x = 0; x < msg.buildRectImage.bitmap.width - 3; x++) {
            color = Jimp.intToRGBA(msg.buildRectImage.getPixelColor(x, y));
            if (color.r != 255 && x && y) {
              color = Jimp.intToRGBA(msg.buildRectImage.getPixelColor(x - 1, y - 1));
              if (color.r == 255) {
                color = Jimp.intToRGBA(msg.buildRectImage.getPixelColor(x - 1, y));
                if (color.r == 255) {
                  color = Jimp.intToRGBA(msg.buildRectImage.getPixelColor(x, y - 1));
                  if (color.r == 255) {
                    h = 0;
                    w = 0;
                    for (let xx = x + 1; xx < msg.buildRectImage.bitmap.width; xx++) {
                      color = Jimp.intToRGBA(msg.buildRectImage.getPixelColor(xx, y));
                      if (color.r == 255 || xx == msg.buildRectImage.bitmap.width - 1) {
                        w = xx - x;
                        break;
                      }
                    }
                    if (w > 3 ) {
                      for (let yy = y + 1; yy < msg.buildRectImage.bitmap.height; yy++) {
                        color = Jimp.intToRGBA(msg.buildRectImage.getPixelColor(x, yy));
                        if (color.r == 255 || yy == msg.buildRectImage.bitmap.height - 1) {
                          h = yy - y;
                        }
                      }

                      if (h > 3  && msg.motions.length < 4) {
                        msg.motions.push({
                          x: x,
                          y: y,
                          w: w,
                          h: h
                        });
                      }
                    } //
                  }
                }
              }
            }
          }
        }
        if (msg.motions.length) {

          const f = msg.motionImage.bitmap.width / SEGMENT_BLOCK_WIDTH;
          for (let i = 0; i < msg.motions.length; i++) {
            drawRect(msg.motionImage, Jimp.rgbaToInt(255, 255, 255, 255), msg.motions[i].x * f, msg.motions[i].y * f, msg.motions[i].x * f + msg.motions[i].w * f, msg.motions[i].y * f + msg.motions[i].h * f);
          }
        }
      }
      this.previousImage = msg.resized.clone();

    }
    send(msg);
    done();
  }
}

module.exports = (RED) => {
  DemoNode.setup(RED, "demo");
}
