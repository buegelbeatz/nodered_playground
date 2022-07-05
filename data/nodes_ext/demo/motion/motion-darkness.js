const Jimp = require('jimp');
const MOTION_DARKNESS_THERESOLD = 50;
const MOTION_DARKNESS_COUNT = 255;

const getRandomValue = (max) => Math.floor(Math.random() * max);

const inputMotionDarkness = async (ref, msg, send, done) => {
  const motionDarknessTheresold = parseInt(ref.motionDarknessTheresold) || MOTION_DARKNESS_THERESOLD;
  let darkness = 0;

  for (let pixelCount = 0; pixelCount < MOTION_DARKNESS_COUNT; pixelCount++) {
    const imageColor = Jimp.intToRGBA(
      msg.greyscaleImage.getPixelColor(
        getRandomValue(msg.greyscaleImageWidth),
        getRandomValue(msg.greyscaleImageHeight)));
    darkness += imageColor.r;
  }
  msg.darkness = parseInt(darkness / MOTION_DARKNESS_COUNT);
  if (msg.darkness < motionDarknessTheresold) {
    const message = "darkness: " + msg.darkness + " / " + motionDarknessTheresold;
    ref.status({ fill: "blue", shape: "dot", text: message });
    send([{payload: message}]);
    done();
    return false;
  }
  return true;
}

module.exports = inputMotionDarkness;
