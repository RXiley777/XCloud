
var rttdis = document.getElementById('rtt-display')
var fpsdis = document.getElementById('fps-display')
var packetlossdis = document.getElementById('packet-loss-display')
var framedelaydis = document.getElementById('frame-delay-display')
var byteratedis = document.getElementById('byte-rate-display')

var RttArr = []
var FpsArr = []
var FrameDelayArr = []

var current_rtt = 0;
var current_fps = 0;
var current_frame_delay = 0;
var current_packet_loss = 0;

const arr_cap = 5

var lastPacketReceived = 0
var lastPacketLost = 0

var lastBytesReceived = 0
var byteRate = 0

function pushRtt(rtt) {
    current_rtt *= RttArr.length
    RttArr.push(rtt)
    current_rtt += rtt
    if (RttArr.length > arr_cap) {
        current_rtt -= RttArr[0]
        RttArr.shift()
    }
    current_rtt /= RttArr.length
}

function pushFps(fps) {
    current_fps *= FpsArr.length
    FpsArr.push(fps)
    current_fps += fps
    if (FpsArr.length > arr_cap) {
        current_fps -= FpsArr[0]
        FpsArr.shift()
    }
    current_fps /= FpsArr.length
}

function pushPacketCnt(packetReceived, packetLost) {
    //if (packetReceived < lastPacketReceived || packetLost < lastPacketLost) return;
    current_packet_loss = (packetLost - lastPacketLost) * 100 / (packetReceived - lastPacketReceived)
    lastPacketLost = packetLost
    lastPacketReceived = packetReceived
}

function pushFrameDelay(frameDelay) {
    current_frame_delay *= FrameDelayArr.length
    FrameDelayArr.push(frameDelay)
    current_frame_delay += frameDelay
    if (FrameDelayArr.length > arr_cap) {
        current_frame_delay -= FrameDelayArr[0]
        FrameDelayArr.shift()
    }
    current_frame_delay /= FrameDelayArr.length
}

function pushBytesReceived(bytes) {
    if(bytes <= lastBytesReceived) return 
    //console.log("?? : "+(bytes-lastBytesReceived))
    byteRate = (bytes-lastBytesReceived) * (1000/stats_query_interval)
    lastBytesReceived = bytes
}

function getByteRate() {
    return byteRate
}

function getRtt() {
    return current_rtt
}

function getFps() {
    return current_fps
}

function getPacketLoss() {
    return current_packet_loss
}

function getFrameDelay() {
    return current_frame_delay
}

function updateRttDisplay() {
    const delay = Math.ceil(getRtt()/2)
    rttdis.textContent = `延迟：${delay} ms`
}

function updateFpsDisplay() {
    const fps = Math.ceil(getFps())
    fpsdis.textContent = `FPS：${fps}`
}

function updatePacketLoss() {
    const packet_loss = current_packet_loss.toFixed(1)
    packetlossdis.textContent = `丢包率：${packet_loss}%`
}

var fd_high_cnt = 0;
var fd_low_cnt = 0;
function updateFrameDelay() {
    const frame_delay = Math.floor(current_frame_delay)
    if (frame_delay > 100) {
        fd_low_cnt = 0;
        ++fd_high_cnt;
        if (fd_high_cnt > 10) {
            if (dc) {
                dc.send("@D");
            }
            fd_high_cnt = 0;
        } 
    }
    if (frame_delay < 80) {
        fd_high_cnt = 0;
        ++fd_low_cnt;
        if (fd_low_cnt > 8) {
            if (dc) {
                dc.send("@U");
            }
            fd_low_cnt = 0;
        }
    }
    framedelaydis.textContent = `帧时延：${frame_delay} ms`
}

function updateByteRate() {
    //console.log("!!  bytes pushed : " + bytes)
    //console.log("!!  lastBytes : " + lastBytesReceived)
    var byte_rate = Math.ceil(getByteRate()/1024)
    if(byte_rate < 1024) byteratedis.textContent = `传输速率：${byte_rate} KB/s`
    else {
        byte_rate = (byte_rate/1024).toFixed(2)
        byteratedis.textContent = `传输速率：${byte_rate} MB/s`
    }
}

setInterval(updateFpsDisplay, 400)
setInterval(updateRttDisplay, 500)
setInterval(updatePacketLoss, 500)
setInterval(updateFrameDelay, 500)
setInterval(updateByteRate, 500)