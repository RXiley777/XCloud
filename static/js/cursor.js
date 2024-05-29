let game_area_ = document.getElementById("remotevideo");
 var remote_width_for_cursor = 0;
 var remote_height_for_cursor = 0;
 var remote_cursor_live = true;

 function repositionCursor(x, y){
   const screen_top_offset = game_area_.offsetTop; //offset to video-container
   const screen_left_offset = game_area_.offsetLeft; //offset to video-container
   const screen_width_for_cursor = game_area_.clientWidth;
   const screen_height_for_cursor = game_area_.clientHeight;
   let nleft = (Math.floor(x*screen_width_for_cursor/remote_width_for_cursor) + screen_left_offset) + 'px';
   let ntop = (Math.floor(y*screen_height_for_cursor/remote_height_for_cursor) + screen_top_offset) + 'px';
    virtual_cursor.style.top = ntop;
    virtual_cursor.style.left = nleft;
 }

 function EnableVirtualCursor(){
    cursor_dc.send("start");
    virtual_cursor.style.display = 'block';
    virtual_cursor_live = true;
 }

 function DisableVirtualCursor(){
    virtual_cursor.style.display = 'none';
    virtual_cursor_live = false;
 }

 function SyncWithRemoteCursor(){
   if (remote_cursor_live) EnableVirtualCursor();
   else DisableVirtualCursor();
 }