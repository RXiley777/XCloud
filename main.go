package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"xcloud/ctrl"
	"xcloud/services/front"
	"xcloud/services/game"
	signaling "xcloud/services/signal"
	"xcloud/simulator/bluestack"
)

// TODO : Always Keep HTML Up to Date Before Publishing or Testing
// FIXME : BE WARNED, HTML Files contains different dir than local
func main() {
	config := ParseConfig()
	if config == nil {
		fmt.Println("unable to parse config")
		return
	}
	//fmt.Println(config.Sim.Dir)
	//fmt.Println(config.Sim.Name)

	var rh *game.RTCHandle
	if config.Sim.Enabled {
		rh = game.CreateRTCHandle(config.Rtc.Dir, config.Sim.Category)
	} else {
		rh = game.CreateRTCHandle(config.Rtc.Dir, config.Game.Win)
	}

	handles := ctrl.CreateCtrlHandles(
		config.Sim.Enabled,
		game.CreateGameHandle(config.Game.Dir, config.Game.Win),
		rh,
		signaling.CreateSigHandle(config.Sig.Dir),
		bluestack.NewBlueStackSimulator(config.Sim.Dir, config.Sim.Name),
	)

	front_server, err := front.NewFrontServer(handles)
	if err != nil {
		fmt.Printf("fs server start failed : %v\n", err)
		return
	}

	var wg sync.WaitGroup
	done := make(chan bool)

	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		err := front_server.Start(config.Front.Addr)
		if err != nil {
			fmt.Println(err)
			return
		}
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()

		select {
		case <-done:
			break
		case <-sigs:
			break
		}
		errs := front_server.Shutdown(context.Background())
		if errs != nil {
			fmt.Println(errs)
		}
	}()

	//manully shutdown server by input
	go func() {
		var text string
		fmt.Println("Type in anything to stop")
		fmt.Scanln(&text)
		done <- true
	}()

	wg.Wait()
	fmt.Println("----- XCLOUD QUIT -----")
}
