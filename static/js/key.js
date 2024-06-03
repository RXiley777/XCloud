//import { pc }  from "./room.js"

var isListening = false

var prompt_text = document.getElementById('prompt')
var idle_btn = document.getElementById('idle')
var black_btn = document.getElementById('black')
// var mute_btn = document.getElementById('mute')
var pip_live = false
var black_mode = false
var is_mute = false

var w_h_origin = null;
const preset_resolutions = [270,360,540,720,1080]
function getResolution(target_width, target_height){
    let pending_height = 0;
    if(pending_height > 1080) pending_height = 1080;
    else {
        let i = 0;
        for(i=0;i<preset_resolutions.length; ++i){
            if (preset_resolutions[i] > target_height) break;
        }
        if (i == 0) pending_height = preset_resolutions[0];
        else pending_height = preset_resolutions[i-1];
    }
    return {
        width : (pending_height * w_h_origin.width) / w_h_origin.height,
        height : pending_height
    }
}

idle_btn.addEventListener("click", function(){
    isListening = false
    black_btn.disabled = true
    console.log('idle-pip mode')
    DisableVirtualCursor();
    let rvideo = document.getElementById("remotevideo");
    rvideo.requestPictureInPicture().then((pipWindow) => {
        pipWindow.addEventListener("resize", function(evt) {
            let res = getResolution(evt.target.width, evt.target.height);
            let ins = "@" + res.width + "," + res.height;
            if (dc) {
                dc.send(ins);
            }
        })
    });
    pip_live = true;
    //宽高比始终与初始画面保持一致，默认分辨率360p
    console.log(remoteVideo.videoWidth + " : " + remoteVideo.videoHeight);
    w_h_origin = {
        width : remoteVideo.videoWidth,
        height : remoteVideo.videoHeight
    }
    let init_ins = "@"+Math.floor(360*remoteVideo.videoWidth/remoteVideo.videoHeight)+",360";
    console.log("pip initial resolution : " + init_ins);
    if (dc) {
        dc.send(init_ins);
    }
})

black_btn.addEventListener("click", function(){
    if (black_mode) {
        if (dc) {
            dc.send("@T") //enable tracks
        }
        black_mode = false
        idle_btn.disabled = false;
        black_btn.textContent = "挂机模式";
    } else {
        if (dc) {
            dc.send("@F") //disable tracks
        }
        idle_btn.disabled = true;
        black_btn.textContent = "取消挂机";
        black_mode = true
    }
})

// mute_btn.addEventListener("click", function(){
//     if (pip_live || black_mode) return;
//     if (is_mute) {
//         mute_btn.textContent = "静音模式";
//         is_mute = false;
//         if(dc) {
//             dc.send("@T");
//         }
//     } else {
//         mute_btn.textContent = "取消静音";
//         is_mute = true;
//         if(dc) {
//             dc.send("@M");
//         }
//     }
// })

remoteVideo.addEventListener('leavepictureinpicture', function(event){
        console.log("exit idle mode");
        pip_live = false;
        black_btn.disabled = false;
        w_h_origin = null;
        if (dc) {
            dc.send("@@");
        }
})

function isValidKey(key) {  
    const allowedKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Alt', 'Shift', 'Tab', 'Control', '/'];  
    const keyChars = /^[a-z0-9]$/i;  
    return allowedKeys.includes(key) || keyChars.test(key); 
}  
  
// 根据事件对象获取对应的“键码”  
function getKeyCodeFromEvent(event) {
    console.log(event.code);
    switch (event.code) {
        case 'ArrowUp':
            return 38; // 向上箭头键的传统 keyCode 值  
        case 'ArrowDown':
            return 40; // 向下箭头键的传统 keyCode 值  
        case 'ArrowLeft':
            return 37; // 向左箭头键的传统 keyCode 值  
        case 'ArrowRight':
            return 39; // 向右箭头键的传统 keyCode 值  
        case 'Enter':
            return 13; // 回车键的传统 keyCode 值  
        case 'Space':
            return 32; // 空格键的传统 keyCode 值  
        case 'Tab':  
            return 9; // Tab键的传统 keyCode 值  
        case 'ShiftLeft':  
        case 'ShiftRight':  
            return 16; // Shift键的传统 keyCode 值  
        case 'ControlLeft':
        case 'ControlRight':
            return 17;
        case 'AltLeft':  
        case 'AltRight':  
            return 18; // Alt键的传统 keyCode 值  
        case 'Digit1':  
            return 49; // '1'键的传统 keyCode 值  
        case 'Digit2':  
            return 50; // '2'键的传统 keyCode 值  
        case 'Digit3':  
            return 51; // '3'键的传统 keyCode 值  
        case 'Digit4':  
            return 52; // '4'键的传统 keyCode 值  
        case 'Digit5':  
            return 53; // '5'键的传统 keyCode 值  
        case 'Digit6':  
            return 54; // '6'键的传统 keyCode 值  
        case 'Digit7':  
            return 55; // '7'键的传统 keyCode 值  
        case 'Digit8':  
            return 56; // '8'键的传统 keyCode 值  
        case 'Digit9':  
            return 57; // '9'键的传统 keyCode 值  
        case 'Numpad0': // 注意Numpad数字键盘的0  
        case 'Key0':    // 以及常规键盘上的0  
            return 48;  // '0'键的传统 keyCode 值 
        case 'Slash':
            return 191;
        default:
            // 如果是单个字符，返回其 ASCII 码  
            return event.key.charCodeAt(0)-'a'.charCodeAt(0)+'A'.charCodeAt(0);
    }
}

let varea = document.getElementById("game-area");
window.addEventListener("keydown", function (event){
    if (!pip_live && !isListening && event.ctrlKey && event.key === "b") {
        isListening = true
        console.log('ctrl mode')
        varea.requestPointerLock();
        SyncWithRemoteCursor();
        prompt_text.textContent = "按下\"Esc\"退出控制模式"
        return 
    }

    if (isListening && (event.key === 'Escape' || event.key === 'Esc')) {
        isListening = false
        console.log('free mode')
        this.document.exitPointerLock();
        DisableVirtualCursor();
        prompt_text.textContent = "按下\“Ctrl+B\”进入控制模式"
        return 
    }

    if (isListening && dc) {
        event.preventDefault();
        if (isValidKey(event.key)) {  
            let commandString = "";
            // 获取按键的 ASCII 码，如果是非打印字符（如回车键、空格键），则直接使用 event.code  
            let keyCode = getKeyCodeFromEvent(event);  
            if(keyCode === 191) { //此处是与BlueStacks模拟器隐藏光标键的适配
                if(virtual_cursor_live) DisableVirtualCursor();
                else EnableVirtualCursor();
                remote_cursor_live = !remote_cursor_live;
            }
            // '#' + keyCode + '*' + '0' 表示按键按下  
            commandString += '#' + keyCode + '*0';  
            //console.log(commandString);
            dc.send(commandString);
        }  
    }
    }
)

//第二种退出控制的方法，为了避免需要按两次esc才能退出控制
document.addEventListener("pointerlockchange", (evt) => {
    if (document.pointerLockElement) {

    } else {
        if (isListening) {
            isListening = false
            console.log('free mode')
            DisableVirtualCursor();
            prompt_text.textContent = "按下\“Ctrl+B\”进入控制模式"
        }
    }
})

window.addEventListener('keyup', function(event) {  
    if (isListening && dc && isValidKey(event.key)) {  
        event.preventDefault();
        let commandString = "";
        let keyCode = getKeyCodeFromEvent(event);  
        // '#' + keyCode + '*' + '1' 表示按键释放  
        commandString += '#' + keyCode + '*1';  
        dc.send(commandString);
        // 可以在此处将指令字符串发送到服务端，或者进行其他处理  
        //console.log(commandString);  
    }  
});

//Mouse And Cursor
varea.addEventListener('mousedown', function(event) {  
    if (isListening && dc) {
        event.preventDefault();
        let commandString = "";
        if (event.button == 0) commandString += '^' + 0 + '=' + event.clientX + '=' + event.clientY; //left down
        if(event.button == 2) commandString += '^' + 4 + '=' + event.clientX + '=' + event.clientY; //right down
        dc.send(commandString);
    }  
});

varea.addEventListener('mouseup', function(event) {  
    if (isListening && dc) {
        event.preventDefault();
        let commandString = "";
        if (event.button == 0) commandString += '^' + 3 + '=' + event.clientX + '=' + event.clientY; //left up
        if(event.button == 2) commandString += '^' + 5 + '=' + event.clientX + '=' + event.clientY; //right up
        dc.send(commandString);
    }  
});

function ListenMouseAbsolute(event) {
    if (isListening && dc) {
        event.preventDefault();
        var clientX = event.clientX;  
        var clientY = event.clientY;  
  
        var screenWidth = window.screen.width; // 屏幕宽度  
        var screenHeight = window.screen.height; // 屏幕高度  

        var absX = Math.round((clientX / screenWidth) * 65535);  
        var absY = Math.round((clientY / screenHeight) * 65535); 

        let commandString = "";
        commandString += '^' + 1 + '=' + absX + '=' + absY;
        dc.send(commandString);
        //console.log(commandString);
    }  
}

function ListenMouse(event) {
    if (isListening && dc) {
        // event.preventDefault();
        // if (last_X == -1 || last_Y == -1) {
        //     last_X = event.clientX;
        //     last_Y = event.clientY;
        // }
        var dx = event.movementX;
        var dy = event.movementY;
        let commandString = "";
        commandString += '^' + 1 + '=' + dx + '=' + dy;
        dc.send(commandString);
        //console.log(commandString);
    }
}

varea.addEventListener('mousemove', ListenMouse);

varea.addEventListener('wheel', function(event) {  
    if (isListening && dc) {
        event.preventDefault();
        let commandString = "";
        commandString += '^' + 2 + '=' + event.deltaY;
        dc.send(commandString);
    }  
});


