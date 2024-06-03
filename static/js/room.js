const max_expected_jitter_delay = 40.0;

var btnConn = document.querySelector('button#connserver');
//var btnLeave = document.querySelector('button#leave');

//var localVideo = document.querySelector('video#localvideo');
var remoteVideo = document.querySelector('video#remotevideo');

var localStream = null;
var remoteStream = null;

var my_id = -1;
var to_id = -1;
var ws = null;
var wait_timer = null;
var parse_wait_interval = 1000
var stats_query_interval = 200
var ip_input = null;

var pc = null;
var dc = null;
var cursor_dc = null;
var virtual_cursor = document.getElementById("virtual-cursor");
var virtual_cursor_live = false

var sync_ready = false;

var URLINPUT = "http://";
const DEFAULTPORT = ":8888";

btnConn.onclick = connSignalServer;
//btnLeave.onclick = leave;

function connSignalServer() {
  ip_input = document.getElementById('ip-input').value;
  if (!isValidIPv4(ip_input)) {
    alert("请输入合法的IPv4地址。");
    return;
  }
  URLINPUT = URLINPUT + ip_input + DEFAULTPORT;
  conn();
  return true;
}

function isValidIPv4(ip) {
  var parts = ip.split(".");
  if (parts.length !== 4) {
    return false;
  }
  for (var i = 0; i < parts.length; i++) {
    var part = parseInt(parts[i], 10);
    if (isNaN(part) || part < 0 || part > 255) {
      return false;
    }
  }
  return true;
}


/* 信令部分 */
function conn() {
  sendJoin("nate@nate");
  //while(my_id == -1) {setTimeout(()=>{}, 500)}
  wait_timer = setInterval(sendWait, parse_wait_interval);
  //setTimeout(sendWait(), 2000);
  btnConn.disabled = true;
  //btnLeave.disabled = false;
}

function hangup() {
  if (pc) {
    pc.close();
    pc = null;
  }
}

/* 退出时关闭 track 流 */
function closeLocalMedia() {
  if (localStream && localStream.getTracks()) {
    localStream.getTracks().forEach((track) => {
      track.stop();
    });
  }
  localStream = null;
}

function leave() {
  sendQuit(my_id);

  /* 释放资源 */
  closePeerConnection();
  closeLocalMedia();
  clearInterval(wait_timer);

  btnConn.disabled = false;
  //btnLeave.disabled = true;
  my_id = -1;
  to_id = -1;
  URLINPUT = "http://";
  parse_wait_interval = 1000;
  remoteStream = null;
  remoteVideo.srcObject = null;
}

async function queryState() {
  let stat = await pc.getStats()
  stat.forEach((report) => {
    if (report.type === "candidate-pair") {
      if(report.currentRoundTripTime !== undefined) pushRtt(report.currentRoundTripTime*1000)
    }
    else if (report.type === "inbound-rtp") {
      if (report.framesPerSecond !== undefined) pushFps(report.framesPerSecond)
      if (report.packetsLost !== undefined && report.packetsReceived !== undefined) {
        pushPacketCnt(report.packetsReceived, report.packetsLost)
      }
      if (report.bytesReceived === undefined) {
        console.error("bytes undifined")
      }
      if (report.bytesReceived !== undefined) pushBytesReceived(report.bytesReceived)
    }
  });
}

function handleDatachannelMsg(msg){
  //console.log("====> incoming msg");
  //console.log(msg)
  if (msg.data[0] == '&') {
    handleSyncReply(msg.data)
  }
}
 
function HandleCursorMsg(cmsg){
  let msg = cmsg.data;
  //console.log(">> curosr : " + msg)
  if(msg[0] === '<'){
      const regex = /<(\d+),\s*(\d+)>/;
      const matches = msg.match(regex);
      remote_width_for_cursor = matches[1];
      remote_height_for_cursor = matches[2];
  } else if (msg[0] === '['){
      const regex = /\[(\d+),\s*(\d+)\]/;
      const matches = msg.match(regex);
      repositionCursor(matches[1], matches[2]); //defined in cursor.js
  } else {
    console.log(" ??? Unknown Cursor " + msg)
  }
}

function createPeerConnection() { // as well as datachannel
  console.log('create RTCPeerConnection!');
  if (!pc) {
    //pc = new RTCPeerConnection(pcConfig);
    pc = new RTCPeerConnection();
    console.log(pc.getTransceivers())
    let transceiver = pc.getTransceivers().find(t => t.receiver);
    if (transceiver !== undefined) transceiver.setCodecPreferences(selected_codecs);
    transceiver = pc.getTransceivers().find(t => t.sender);
    if (transceiver !== undefined) transceiver.setCodecPreferences(selected_codecs);

    dc = pc.createDataChannel("ctrl");
    dc.onmessage = handleDatachannelMsg;
    dc.onclose = () => { console.log("=> datachannnel closed!") };
    cursor_dc = pc.createDataChannel("cursor", {maxRetransmits : 1});
    if(cursor_dc === null) {
      console.log("Failed to create cursor_dc !")
    } else {
      console.log("Create DC for cursor")
      console.log(cursor_dc)
    }
    cursor_dc.onmessage = HandleCursorMsg;

    pc.onicecandidate = (e) => {

      if (e.candidate) {
        sendMsg(my_id, to_id, {
          type: 'candidate',
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        });
      } else {
        console.log('this is the end candidate');
      }

    };

    pc.ontrack = getRemoteStream;

  } else {
    console.log('the pc have be created')
  }

  if ((localStream !== null) && (pc !== null || pc !== undefined)) {
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);  // 进行添加, 并发送给远端。
    });
  } else {
    console.log('pc or localStream is null or disabled');
  }

  setInterval(queryState, stats_query_interval)
}  /* createPeerConnection */

function closePeerConnection() {
  console.log('close RTCPeerConnection!');
  if (pc) {
    pc.close();
    pc = null;
  }
}

var last_present_time = null
function HandleFrame(now, metadata) {
  if (!sync_ready) {

  } else {
    if(last_present_time == metadata.presentationTime) return 
    pushFrameDelay(calDelay(metadata.presentationTime, metadata.rtpTimestamp))
    last_present_time = metadata.presentationTime
    //console.log(calDelay(metadata.presentationTime, metadata.rtpTimestamp));
  }
  remoteVideo.requestVideoFrameCallback(HandleFrame)
}

function getRemoteStream(e) {
  remoteVideo.requestVideoFrameCallback(HandleFrame);
  remoteStream = e.streams[e.streams.length - 1];
  remoteVideo.srcObject = e.streams[e.streams.length - 1];
  let receivers = pc.getReceivers();
  console.log("peerconnection get " + receivers.length + " recievers");
  for (var r of receivers) {
    console.log(r)
    if (r.jitterBufferTarget !== undefined) {
      r.jitterBufferTarget = max_expected_jitter_delay;
      console.log("setting jitterBufferTarget For " + r.track.kind + " : " + r.track.contentHint);
    }
  }
  console.log("get " + e.streams.length + " remote streams, slowing down sendWait...")
  parse_wait_interval = 5000;
  sendSync() // try to send sync
}

function call() {
  var options = {
    offerToReceiveVideo: 1,
    offerToReceiveAudio: 1,
  };
  pc.createOffer(options)
    .then(getOffer)
    .catch((e) => {
      console.error(e);
    });
}

function getOffer(desc) {
  pc.setLocalDescription(desc);
  //textarea_offer.value = desc.sdp;
  sendMsg(my_id, to_id, desc);
}

function getAnswer(desc) {
  pc.setLocalDescription(desc);
  //textarea_answer.value = desc.sdp;
  //sendMessage(roomid, desc);
  sendMsg(my_id, to_id, desc);
}

function sendJoin(peer_name) {
  axios.get(URLINPUT + "/sign_in?" + peer_name).then((res) => {
    console.log(res)
    if (my_id == -1) {
      let arr = res.data.split(',')
      console.log("get local id : " + arr[1])
      my_id = arr[1]
      if (arr.length > 3) {
        console.log("get remote id : " + arr[4])
        to_id = arr[4]
        call();
      }
    }
  })
  createPeerConnection();
}

function sendWait() {
  if (my_id == -1) {
    return;
  }
  const build = "/wait?peer_id=" + my_id;
  axios.get(URLINPUT + build).then((res) => {
    //console.log(res.data)
    parseData(res.data)
  })
}

function sendMsg(peer_id, to_id, msg) {
  const build = "/message?peer_id=" + peer_id + "&to=" + to_id;
  axios.post(URLINPUT + build, msg).then((res) => {
    //console.log(res)
  })
}

function sendQuit(peer_id) {
  const build = "/sign_out?peer_id=" + peer_id;
  axios.get(URLINPUT + build).then((res) => {
    //console.log(res)
  })
}

function parseData(data) {
  if (data) {
    if (data.type === 'offer') {
      pc.setRemoteDescription(new RTCSessionDescription(data));

      pc.createAnswer()
        .then(getAnswer)
        .catch((e) => {
          console.error(e);
        });

    } else if (data.type === 'answer') {
      pc.setRemoteDescription(new RTCSessionDescription(data));

    } else if (data.hasOwnProperty('candidate')) {
      var candidate = new RTCIceCandidate({
        sdpMLineIndex: data.sdpMLineIndex,
        candidate: data.candidate
      });
      pc.addIceCandidate(candidate);

    } else {
      arr = data.split(',');
      console.log("get remote id : " + arr[1] + " , op : " + arr[2]);
      if (arr[2] == 1) {
        to_id = arr[1];
        call();
      }
      if (arr[2] == 0) to_id = -1;
    }
  }
}