var spinner = document.getElementById("spin-loader");
var ip_container = document.getElementById("ip-container");

var loader_poll_interval = 500
var spin_poller = null
var URL_POLL = "http://" + ip_container.getAttribute('data-value') + ':5500' + '/status/1';
function poll_for_remote_status() {
    axios.post(URL_POLL, null).then(
        (res) => {
            if (res.status === 200 && res.data.startsWith("rdy")){
                console.log("REMOTE IS READY");
                console.log(res.data);
                spinner.style.display = 'none';
                if(spin_poller !== null) clearInterval(spin_poller);
                if(textIntervalId !== null) clearInterval(textIntervalId);
                var btn = document.getElementById('connserver');
                btn.disabled = false;
                idle_btn.disabled = false;
                black_btn.disabled = false;
            } else {
                console.log(res.data)
            }
        }
    )
}

spin_poller = setInterval(poll_for_remote_status, loader_poll_interval);

const TEXT_SWITCH_INTERVAL = 2000; // 2秒  
let textIntervalId = null;  
  
// 文案数组  
const messages = [  
  "这窗外，这夜色，流光溢彩...",
  "云游戏启动中...",  
  "记忆是梦的开场白...",  
  "请稍候...",  
  "加载中，别着急...",  
  "马上就好...大概"  
];  
  
// 随机选择一条文案并显示在页面上  
function switchText() {  
  const randomIndex = Math.floor(Math.random() * messages.length);  
  const textElement = document.getElementById('loader-text');  
  textElement.textContent = messages[randomIndex];  
}  
  
// 开始文案切换  
function startTextSwitching() {  
  textIntervalId = setInterval(switchText, TEXT_SWITCH_INTERVAL);  
}  
  
// 页面加载完成后开始轮询和文案切换  
document.addEventListener('DOMContentLoaded', function() {   
  startTextSwitching();  
});

document.addEventListener('visibilitychange', visibilityHandler);

function visibilityHandler() {
  if (pip_live || black_mode) return
  if (document.visibilityState === "hidden") {
    if (dc) {
      dc.send("@B");
    }
  }

  if (document.visibilityState === "visible") {
    if (dc) {
      dc.send("@T");
    }
  }
}