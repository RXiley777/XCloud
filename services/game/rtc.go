package game

import (
	"xcloud/services"
)

type RTCHandle struct {
	*services.WinHandle
	name string
	dir  string
	//wh   *services.WinHandle
}

func CreateRTCHandle(rtc_dir string, win_name string) *RTCHandle {
	game_args := make([]string, 0)
	game_args = append(game_args, win_name)
	return &RTCHandle{
		WinHandle: services.CreateWinHandle("\"xcloud_rtc_client\"", rtc_dir, game_args),
		name:      win_name,
		dir:       rtc_dir,
	}
}
