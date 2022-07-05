const Jimp = require('jimp');
const {drawRect} = require('../generic.js');
const MOTION_CLUSTER_MIN_COUNT = 1;
const MOTION_CLUSTER_MAX_COUNT = 4;

const getIdx = (segment, xOffset = 0, yOffset = 0) => 'c_' + ((segment[0] + xOffset) + '_' + (segment[1] + yOffset));

const drawImage = (msg) => {
  const wD = Math.ceil(msg.greyscaleImageWidth / msg.motionSegmentSize);
  const hD = Math.ceil(msg.greyscaleImageHeight / msg.motionSegmentSize);
  msg.motionSegmentCluster.forEach(c => {
    drawRect(msg.pixelImage,
      Jimp.rgbaToInt(64, 255, 64, 255),
      c[0] * wD,
      c[1] * hD,
      (c[2] + 1) * wD,
      (c[3] + 1) * hD - 1);
  });

}

const inputMotionCluster = async (ref, msg, send, done) => {
  const clusters = [];
  msg.motionSegmentCluster = [];
  msg.motionCluster = [];
  const motionClusterMinCount = parseInt(ref.motionClusterMinCount) || MOTION_CLUSTER_MIN_COUNT;
  const motionClusterMaxCount = parseInt(ref.motionClusterMaxCount) || MOTION_CLUSTER_MAX_COUNT;

  msg.motionSegment.forEach(s => {

    let currentCluster = null;
    clusters.forEach((cluster, i) => {
      if (!currentCluster && (
        cluster[getIdx(s)] || cluster[getIdx(s, 1)] ||
        cluster[getIdx(s, -1)] || cluster[getIdx(s, 0, 1)] ||
        cluster[getIdx(s, 0, -1)] || cluster[getIdx(s, -1, 1)] ||
        cluster[getIdx(s, -1, -1)] || cluster[getIdx(s, 1, 1)] ||
        cluster[getIdx(s, 1, -1)])) {
        currentCluster = cluster;
      }
    });
    if (!currentCluster) {
      currentCluster = {};
      currentCluster[getIdx(s)] = [s[0], s[1]];
      clusters.push(currentCluster);
    }
    if (s[0] > 0) {
      currentCluster[getIdx(s, -1)] = [(s[0] - 1), s[1]];
      if (s[1] > 0) {
        currentCluster[getIdx(s, -1, -1)] = [(s[0] - 1), (s[1] - 1)];
      }
      if (s[1] < msg.motionSegmentSize - 1) {
        currentCluster[getIdx(s, -1, 1)] = [(s[0] - 1), (s[1] + 1)];
      }
    }
    if (s[0] < msg.motionSegmentSize - 1) {
      currentCluster[getIdx(s, 1)] = [(s[0] + 1), s[1]];
      if (s[1] > 0) {
        currentCluster[getIdx(s, 1, -1)] = [(s[0] + 1), (s[1] - 1)];
      }
      if (s[1] < msg.motionSegmentSize - 1) {
        currentCluster[getIdx(s, 1, 1)] = [(s[0] + 1), (s[1] + 1)];
      }
    }
    if (s[1] > 0) {
      currentCluster[getIdx(s, 0, -1)] = [(s[0]), (s[1] - 1)];
    }
    if (s[1] < msg.motionSegmentSize - 1) {
      currentCluster[getIdx(s, 0, 1)] = [(s[0]), (s[1] + 1)];
    }
  });
  const wD = parseInt(msg.originalImageWidth / msg.motionSegmentSize);
  const hD = parseInt(msg.originalImageHeight / msg.motionSegmentSize);
  clusters.forEach((cluster, i) => {
    let x = msg.motionSegmentSize,
      y = msg.motionSegmentSize,
      xd = 0,
      yd = 0;
    Object.values(cluster).forEach((clusterItem, i) => {
      x = Math.min(x, clusterItem[0]);
      y = Math.min(y, clusterItem[1]);
      xd = Math.max(xd, clusterItem[0]);
      yd = Math.max(yd, clusterItem[1]);
    });
    const clusterArray = [
      Math.max(0, x - 1),
      Math.max(0, y - 1),
      Math.min(msg.motionSegmentSize, xd + 2),
      Math.min(msg.motionSegmentSize, yd + 2)];
    msg.motionSegmentCluster.push(clusterArray);
    msg.motionCluster.push([
      clusterArray[0] * wD,
      clusterArray[1] * hD,
      (clusterArray[2] - clusterArray[0]) * wD - 1,
      (clusterArray[3] - clusterArray[1]) * hD - 1]);
  });

  if (msg.motionPreview) {
    drawImage(msg);
  }

  if (msg.motionSegmentCluster.length >= motionClusterMinCount && msg.motionSegmentCluster.length <= motionClusterMaxCount) {
    return true;
  }
  const message = "cluster: count out of range [1,4] => " + msg.motionSegmentCluster.length;
  ref.status({ fill: "blue", shape: "dot", text: message });
  send([{payload: message}, { payload: msg.pixelImage, topic: msg.topic }]);
  done();
  return false;
}

module.exports = inputMotionCluster;
