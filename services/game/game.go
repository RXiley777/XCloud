package game

import (
	"xcloud/services"
)

type GameHandle struct {
	dir  string
	Game string
	*services.WinHandle
}

func CreateGameHandle(game_dir string, win_name string) *GameHandle {
	return &GameHandle{
		dir:       game_dir,
		Game:      win_name,
		WinHandle: services.CreateWinHandle(win_name, game_dir, []string{}),
	}
}
