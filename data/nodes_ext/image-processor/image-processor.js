const {ImageGenericNode} = require('./generic.js');
const inputMotionDarkness = require('./motion/motion-darkness.js');
const inputMotionPrevious = require('./motion/motion-previous.js');
const inputMotionPixel = require('./motion/motion-pixel.js');
const inputMotionSegment = require('./motion/motion-segment.js');
const inputMotionCluster = require('./motion/motion-cluster.js');
const inputMotionResize = require('./motion/motion-resize.js');

const extractKeys = (msg, keys) => {
  const newMsg = {};
  keys.forEach(key => newMsg[key] = msg[key]);
  return newMsg;
}

class ImageProcessorNode extends ImageGenericNode {

  constructor(config) {
    super(config);
    this.previousImage = {};
  }

  async inputHandler(msg, send, done) {
    let result;
    if(!msg.topic){
      msg.topic = 'default';
    }
    result = await inputMotionResize(this, msg, send, done);
    if(result){
      result = await inputMotionDarkness(this, msg, send, done);
    }
    if(result){
      result = await inputMotionPrevious(this, msg, send, done);
    }
    if(result){
      result = await inputMotionPixel(this, msg, send, done);
    }
    if(result){
      result = await inputMotionSegment(this, msg, send, done);
    }
    if(result){
      result = await inputMotionCluster(this, msg, send, done);
    }
    if(result){
      const keys = ['ts','dateTime', 'darkness',
      'motionPixel', 'motionSegmentSize',
      'motionSegment', 'motionCluster',
      'payload', 'topic'];
      send([msg,
            {payload: msg.pixelImage, topic: msg.topic},
            Object.assign({}, extractKeys(msg, keys))] );
      this.status({fill:"green",shape:"dot",text:"cluster: found " +
      msg.motionCluster.length + ' cluster'});

    }
    done();
  }
}

module.exports = (RED) => {
  ImageProcessorNode.setup(RED, "imageprocessor");
}
