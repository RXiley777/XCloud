package bluestack

import (
	"bytes"
	"fmt"
	"time"
	"xcloud/services"
	"xcloud/simulator"
)

type BlueStackSimulator struct {
	*services.WinHandle
	dir       string
	name      string
	adb       *simulator.ADBHandle
	adb_ready bool
}

func NewBlueStackSimulator(sim_dir string, sim_name string) *BlueStackSimulator {
	return &BlueStackSimulator{
		WinHandle: services.CreateWinHandle("", sim_dir, nil),
		dir:       sim_dir,
		name:      sim_name,
		adb:       simulator.NewADBHandle(),
		adb_ready: false,
	}
}

func (s *BlueStackSimulator) IsReady() bool {
	return s.adb_ready
}

func (s *BlueStackSimulator) readyForADB() bool {
	result := s.adb.ADBDevices()
	rdy := bytes.Contains(result.Bytes(), []byte(s.name))
	//fmt.Printf("## ADB Check %s : %s\n", result.String(), s.name)
	s.adb_ready = rdy
	return rdy
}

func (s *BlueStackSimulator) waitUntilADBReady(max_times int) error {
	if s.adb_ready {
		return nil
	}
	if max_times < 3 {
		max_times = 3
	}
	for i := 0; i < max_times; i++ {
		s.adb.ADBConnect(s.name)
		if s.readyForADB() {
			return nil
		}
		time.Sleep(1 * time.Second)
	}
	return fmt.Errorf("$ ADB Wait Time out after %d tries. ", max_times)
}

func (s *BlueStackSimulator) StartSimulator() error {
	err := s.WinHandle.Start()
	if err != nil {
		return err
	}
	//TODO : how to know wether a simulator is started enough for adb to connect?
	wait := s.waitUntilADBReady(60)
	if wait != nil {
		return wait
	}
	return nil
}

func (s *BlueStackSimulator) StopSimulator() error {
	s.adb_ready = false
	return s.WinHandle.Stop()
}

// TODO : Current Function doesn't emit any adb error, this error should be caught via adb connection
func (s *BlueStackSimulator) StartApp(app_name string) error {
	err := s.waitUntilADBReady(5)
	//TODO : this interval is fixed and unstable
	time.Sleep(10 * time.Second)
	if err != nil {
		return err
	}
	s.adb.ADBStart(s.name, app_name)
	return nil
}

// TODO : Current Function doesn't emit any adb error, this error should be caught via adb connection
func (s *BlueStackSimulator) StopApp(app_name string) error {
	err := s.waitUntilADBReady(5)
	if err != nil {
		return err
	}
	s.adb.ADBStop(s.name, app_name)
	return nil
}
