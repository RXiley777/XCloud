package main

import (
	"encoding/json"
	"log"
	"os"
)

type Config struct {
	Server ServerConfig    `json:"server"`
	Game   GameConfig      `json:"game"`
	Rtc    RTCConfig       `json:"rtc"`
	Sig    SigConfig       `json:"signaling"`
	Auth   AuthConfig      `json:"auth"`
	Front  FrontConfig     `json:"front"`
	Sim    SimulatorConfig `json:"simulator"`
}

type ServerConfig struct {
	ServerIP   string `json:"server_ip"`
	ServerPort int    `json:"server_port"`
}

type GameConfig struct {
	Win   string `json:"window_name"`
	Dir   string `json:"game_dir"`
	Boost bool   `json:"game_need_boosting"`
}

type RTCConfig struct {
	Dir     string `json:"rtc_dir"`
	LogDir  string `json:"rtc_log_dir"`
	Relaese bool   `json:"rtc_is_release"`
}

type SigConfig struct {
	Port uint32 `json:"sig_port"`
	Dir  string `json:"sig_dir"`
}

type AuthConfig struct {
	Enabled bool `json:"auth_enable"`
}

type FrontConfig struct {
	Addr string `json:"front_address"`
}

type SimulatorConfig struct {
	Category string `json:"category"`
	Dir      string `json:"dir"`
	Name     string `json:"name"`
	Enabled  bool   `json:"enabled"`
}

func ParseConfig() *Config {
	data, err := os.ReadFile("config.json")
	if err != nil {
		log.Fatalf("Error reading config file : %v", err)
		return nil
	}

	config := &Config{}
	err = json.Unmarshal(data, config)
	if err != nil {
		log.Fatalf("Error parsing config file : %v", err)
		return nil
	}

	return config
}

func GetJsonConfig(cfg Config) ([]byte, error) {
	jsonData, err := json.Marshal(cfg)
	if err != nil {
		return nil, err
	}

	return jsonData, nil
}
