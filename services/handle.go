package services

import (
	"fmt"
	"os/exec"
	"xcloud/utils"
)

type WinHandle struct {
	cmd *exec.Cmd
	dir string
}

func CreateWinHandle(win_name string, dir string, args []string) *WinHandle {
	//st_args := make([]string, 0)
	//st_args = append(st_args, win_name)
	//st_args = append(st_args, dir)
	//st_args = append(st_args, args...)
	cmd := exec.Command(dir)
	if args != nil {
		cmd = exec.Command(dir, args...)
	}
	fmt.Println("++ CreateWinHandle : " + cmd.String())
	return &WinHandle{
		dir: dir,
		cmd: cmd,
	}
}

func (wh *WinHandle) Start() error {
	valid, err := utils.IsValidPathToFile(wh.dir)
	if !valid {
		return err
	}
	err = wh.cmd.Start()
	if err != nil {
		return err
	}

	return nil
}

func (wh *WinHandle) Stop() error {
	err := wh.cmd.Process.Kill()
	if err != nil {
		return err
	}

	//TODO : if all method cannot kill process, we should run taskkill cmd
	return nil
}
