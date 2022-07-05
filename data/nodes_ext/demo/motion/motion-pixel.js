const Jimp = require('jimp');
const MOTION_PIXEL_MIN_RATE = 0.0005;
const MOTION_PIXEL_MAX_RATE = 0.25;
const MOTION_PIXEL_THERESOLD = 25;

const inputMotionPixel = async (ref, msg, send, done) => {
  const motionPixelTheresold = parseFloat(ref.motionPixelTheresold) || MOTION_PIXEL_THERESOLD;
  if(msg.motionPreview){
    msg.pixelImage = msg.greyscaleImage.clone();
  }else{
    msg.pixelImage = msg.greyscaleImage;
  }
  const motionPixelColor = Jimp.rgbaToInt(255, 64, 64, 255);
  msg.motionPixel = [];
  msg.greyscaleImage.scan(0, 0, msg.greyscaleImageWidth, msg.greyscaleImageHeight, (x, y, idx) => {
    const previewImagePixelColor = Jimp.intToRGBA(msg.greyscaleImage.getPixelColor(x, y));
    const previousImagePixelColor = Jimp.intToRGBA(ref.previousImage[msg.topic].getPixelColor(x, y));
    const diff = Math.abs(previewImagePixelColor.r - previousImagePixelColor.r);
    if (diff > motionPixelTheresold) {
      msg.motionPixel.push([x, y]);
      if(msg.motionPreview){
        msg.pixelImage.setPixelColor(motionPixelColor, x, y);
      }
    }
  });
  ref.previousImage[msg.topic] = msg.greyscaleImage.clone();
  const rate = Math.round(msg.motionPixel.length / msg.greyscaleImagePixelTotal*1000) / 1000;
  const motionPixelMinRate = parseFloat(ref.motionPixelMinRate) || MOTION_PIXEL_MIN_RATE;
  const motionPixelMaxRate = parseFloat(ref.motionPixelMaxRate) || MOTION_PIXEL_MAX_RATE;
  if(rate >= motionPixelMinRate && rate <= motionPixelMaxRate){
    return true;
  }else{
    const message = "pixel: rate out of range [" + motionPixelMinRate + ", " + motionPixelMaxRate + "] => " + rate;
    ref.status({fill:"blue",shape:"dot",text:message});
    send([{payload: message}, {payload: msg.pixelImage, topic: msg.topic}]);
    done();
    return false;
  }
}

module.exports = inputMotionPixel;
