const inputMotionPrevious = async (ref, msg, send, done) => {
  if(!ref.previousImage[msg.topic]){
    ref.previousImage[msg.topic] = msg.greyscaleImage.clone();
    const message = "previous: missing previousImage topic " + msg.topic;
    ref.status({fill:"yellow",shape:"dot",text:message});
    send([{payload: message}]);
    done();
    return false;
  }
  return true;
}

module.exports = inputMotionPrevious;
