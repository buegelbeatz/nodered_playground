const Jimp = require('jimp');
const { drawRect } = require('../generic.js');

const MOTION_SEGMENT_SIZE = 16;
const MOTION_SEGMENT_THERESOLD = 0.001;
const MOTION_SEGMENT_MIN_RATE = 0.001;
const MOTION_SEGMENT_MAX_RATE = 0.2;

const drawImage = (msg) => {
  const wD = Math.ceil(msg.greyscaleImageWidth / msg.motionSegmentSize);
  const hD = Math.ceil(msg.greyscaleImageHeight / msg.motionSegmentSize);
  msg.motionSegment.forEach(s => {
    drawRect(msg.pixelImage,
      Jimp.rgbaToInt(64, 64, 255, 255),
      s[0] * wD,
      s[1] * hD,
      (s[0] + 1) * wD - 1,
      (s[1] + 1) * hD - 1);
  });
}

const inputMotionSegment = async (ref, msg, send, done) => {
  const motionSegmentSize = parseInt(ref.motionSegmentSize) || MOTION_SEGMENT_SIZE;
  msg.motionSegmentSize = motionSegmentSize;
  const motionSegmentTheresold = parseFloat(ref.motionSegmentTheresold) || MOTION_SEGMENT_THERESOLD;
  const motionSegmentMinRate = parseFloat(ref.motionSegmentMinRate) || MOTION_SEGMENT_MIN_RATE;
  const motionSegmentMaxRate = parseFloat(ref.motionSegmentMaxRate) || MOTION_SEGMENT_MAX_RATE;

  const segments = [...Array(motionSegmentSize)].map(e => Array(motionSegmentSize).fill(0));
  msg.motionSegment = [];
  if (msg.motionPixel && msg.motionPixel.length) {
    msg.motionPixel.forEach(pixel => {
      segments[parseInt(pixel[0] * motionSegmentSize / msg.greyscaleImageWidth)][parseInt(pixel[1] * motionSegmentSize / msg.greyscaleImageHeight)]++;
    });
  }

  const pixelPerSegment = (msg.greyscaleImageHeight / motionSegmentSize) * (msg.greyscaleImageWidth / motionSegmentSize);
  for (let x = 0; x < motionSegmentSize; x++) {
    for (let y = 0; y < motionSegmentSize; y++) {
      if (segments[x][y] / pixelPerSegment > motionSegmentTheresold) {
        msg.motionSegment.push([x, y]);
      }
    }
  };
  if (msg.motionPreview) {
    drawImage(msg);
  }
  const rate = msg.motionSegment.length / motionSegmentSize / motionSegmentSize;
  if (rate >= motionSegmentMinRate && rate <= motionSegmentMaxRate) {
    return true;
  } else {

    const message = "segment: count out of range [" + motionSegmentMinRate + ", " + motionSegmentMaxRate + "] => " + rate;
    ref.status({ fill: "blue", shape: "dot", text: message });
    send([{ payload: message }, { payload: msg.pixelImage, topic: msg.topic }]);
    done();
    return false;
  }
}

module.exports = inputMotionSegment;
