const Jimp = require('jimp');
const MOTION_RESIZE_WIDTH = 160;
MOTION_PREVIEW = true;

const inputMotionResize = async (ref, msg, send, done) => {
  const originalImage = await Jimp.read(msg.payload).catch(e => null);
  msg.motionPreview = (ref.motionPreview === false)?false:(ref.motionPreview || MOTION_PREVIEW);
  if (!originalImage) {
    const message = "resize: could not read image";
    ref.status({ fill: "red", shape: "dot", text: message });
    send([{payload: message}]);
    done();
    return false;
  }
  //const greyscaleImage = originalImage.clone();
  msg.originalImageWidth = originalImage.bitmap.width;
  msg.originalImageHeight = originalImage.bitmap.height;
  msg.greyscaleImage = originalImage.clone().resize(MOTION_RESIZE_WIDTH, Jimp.AUTO).greyscale();
  msg.greyscaleImageWidth = msg.greyscaleImage.bitmap.width;
  msg.greyscaleImageHeight = msg.greyscaleImage.bitmap.height;
  msg.greyscaleImagePixelTotal = msg.greyscaleImageWidth * msg.greyscaleImageHeight;
  return true;
}

module.exports = inputMotionResize;
