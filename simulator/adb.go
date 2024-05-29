package simulator

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
)

type AppConfig struct {
	Name         string `json:"name"`
	Pkg          string `json:"package"`
	MainActivity string `json:"activity"`
}

type AllAppConfig map[string]AppConfig

type ADBHandle struct {
	AppMap AllAppConfig
}

func NewADBHandle() *ADBHandle {
	content, err := os.ReadFile("appconfig.json")
	if err != nil {
		return nil
	}

	var appsConfig []AppConfig
	err = json.Unmarshal(content, &appsConfig)
	if err != nil {
		return nil
	}

	allcfg := make(map[string]AppConfig)
	for _, app := range appsConfig {
		allcfg[app.Name] = app
	}

	return &ADBHandle{
		AppMap: allcfg,
	}
}

func (a ADBHandle) ADBStart(simulator_name string, app_code string) {
	pkg_name := a.AppMap[app_code].Pkg
	activity := a.AppMap[app_code].MainActivity
	cmd := exec.Command("adb", "-s", simulator_name, "shell", "am", "start", "-n", pkg_name+"/"+activity)
	fmt.Printf(">> running adb command : %s\n", cmd.String())
	cmd.Start()
}

func (a ADBHandle) ADBStop(simulator_name string, app_code string) {
	pkg_name := a.AppMap[app_code].Pkg
	cmd := exec.Command("adb", "-s", simulator_name, "shell", "am", "force-stop", pkg_name)
	fmt.Printf(">> running adb command : %s\n", cmd.String())
	cmd.Start()
}

func (a ADBHandle) ADBConnect(simulator_name string) {
	cmd := exec.Command("adb", "connect", simulator_name)
	fmt.Printf(">> running adb command : %s\n", cmd.String())
	cmd.Start()
}

func (a ADBHandle) ADBDevices() *bytes.Buffer {
	cmd := exec.Command("adb", "devices")
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Run()
	return &out
}
