package ctrl

import (
	"fmt"
	"time"
	"xcloud/services/game"
	"xcloud/services/signal"
	"xcloud/simulator"
	"xcloud/utils"
)

type CtrlHandles struct {
	gh           *game.GameHandle
	rh           *game.RTCHandle
	sh           *signal.SigHandle
	simulator    simulator.Simulator
	GameStarted  bool
	RTCStarted   bool
	SigStarted   bool
	SimStarted   bool
	useSimulator bool
}

func CreateCtrlHandles(use_simulator bool, g *game.GameHandle, r *game.RTCHandle, s *signal.SigHandle, sim simulator.Simulator) *CtrlHandles {
	return &CtrlHandles{
		gh:           g,
		rh:           r,
		sh:           s,
		simulator:    sim,
		GameStarted:  false,
		RTCStarted:   false,
		SigStarted:   false,
		SimStarted:   false,
		useSimulator: use_simulator,
	}
}

func (h *CtrlHandles) Start() utils.Error {
	var errs utils.Error
	if h.useSimulator {
		h.startSimulator(&errs)
	} else {
		h.startGame(&errs)
	}
	if !errs.IsNil() {
		return errs
	}
	h.startSig(&errs)
	if !errs.IsNil() {
		return errs
	}
	h.startRTC(&errs)
	return errs
}

func (h CtrlHandles) IsRunning() bool {
	return h.GameStarted && h.SigStarted && h.RTCStarted
}

func (h *CtrlHandles) Stop() utils.Error {
	var errs utils.Error
	h.stopSig(&errs)
	if !errs.IsNil() {
		return errs
	}
	h.stopRTC(&errs)
	if !errs.IsNil() {
		return errs
	}
	if h.useSimulator {
		h.stopSimulator(&errs)
	} else {
		h.stopGame(&errs)
	}
	return errs
}

func (h *CtrlHandles) OnUserDisconnect() utils.Error {
	var errs utils.Error
	h.stopSimApp(&errs)
	return errs
}

func (h *CtrlHandles) OnUserConnect() utils.Error {
	var errs utils.Error
	if !h.SimStarted {
		h.Start()
	} else {
		h.startSimApp(&errs)
	}
	return errs
}

func (h *CtrlHandles) startGame(reporter *utils.Error) {
	if h.GameStarted {
		fmt.Println("WARNINIG : Game has already started !")
		return
	}
	time.Sleep(5 * time.Second)
	err := h.gh.Start()
	if err != nil {
		reporter.Add(err)
		h.Stop()
		return
	}
	h.GameStarted = true
}

func (h *CtrlHandles) startSig(reporter *utils.Error) {
	if h.SigStarted {
		fmt.Println("WARNINIG : Signaling Server has already started !")
		return
	}
	err := h.sh.Start()
	if err != nil {
		reporter.Add(err)
		h.Stop()
		return
	}
	h.SigStarted = true
}

func (h *CtrlHandles) startRTC(reporter *utils.Error) {
	if h.RTCStarted {
		fmt.Println("WARNINIG : RTC Service has already started !")
		return
	}
	err := h.rh.Start()
	if err != nil {
		reporter.Add(err)
		h.Stop()
		return
	}
	h.RTCStarted = true
}

func (h *CtrlHandles) stopGame(reporter *utils.Error) {
	if h.GameStarted {
		err := h.gh.Stop()
		if err != nil {
			reporter.Add(err)
		}
	}
	h.GameStarted = false
}

func (h *CtrlHandles) stopSig(reporter *utils.Error) {
	if h.SigStarted {
		err := h.sh.Stop()
		if err != nil {
			reporter.Add(err)
		}
	}
	h.SigStarted = false
}

func (h *CtrlHandles) stopRTC(reporter *utils.Error) {
	if h.RTCStarted {
		err := h.rh.Stop()
		if err != nil {
			reporter.Add(err)
		}
	}
	h.RTCStarted = false
}

func (h *CtrlHandles) startSimulator(reporter *utils.Error) {
	if h.SimStarted {
		return
	}
	err := h.simulator.StartSimulator()
	if err != nil {
		reporter.Add(err)
		return
	}
	err = h.simulator.StartApp(h.gh.Game)
	if err != nil {
		reporter.Add(err)
		return
	}
	h.SimStarted = true
}

func (h *CtrlHandles) stopSimulator(reporter *utils.Error) {
	if !h.SimStarted {
		return
	}
	err := h.simulator.StopApp(h.gh.Game)
	if err != nil {
		reporter.Add(err)
		return
	}
	err = h.simulator.StopSimulator()
	if err != nil {
		reporter.Add(err)
		return
	}
	h.SimStarted = false
}

func (h *CtrlHandles) stopSimApp(reporter *utils.Error) {
	err := h.simulator.StopApp(h.gh.Game)
	if err != nil {
		reporter.Add(err)
		return
	}
}

func (h *CtrlHandles) startSimApp(reporter *utils.Error) {
	err := h.simulator.StartApp(h.gh.Game)
	if err != nil {
		reporter.Add(err)
		return
	}
}
