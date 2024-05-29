
console.log(window.RTCRtpTransceiver.prototype)
console.log(window.RTCRtpTransceiver && 'setCodecPreferences' in window.RTCRtpTransceiver.prototype)

var selected_codecs = null

const supportsSetCodecPreferences = window.RTCRtpTransceiver &&
  'setCodecPreferences' in window.RTCRtpTransceiver.prototype;

if (supportsSetCodecPreferences) {
    // 获取选择的codec
    const preferredCodec = 'video/VP9';
    if (preferredCodec !== '') {
        const { codecs } = RTCRtpSender.getCapabilities('video');
        const selectedCodecIndex = codecs.findIndex(c => c.mimeType === preferredCodec);
        const selectedCodec = codecs[selectedCodecIndex];
        codecs.splice(selectedCodecIndex, 1);
        codecs.unshift(selectedCodec);
        console.log(codecs);
        selected_codecs = codecs;
        //RTCRtpTransceiver.prototype.setCodecPreferences(selected_codecs);
    }
}