package utils

import (
	"net"
)

func GameIP() string {
	ips, err := getLocalIPs()
	if err != nil {
		return ""
	}

	return ips[0]
}

func getLocalIPs() ([]string, error) {
	var ips []string
	interfaces, err := net.Interfaces()
	if err != nil {
		return nil, err
	}

	for _, intf := range interfaces {
		if intf.Flags&net.FlagLoopback != 0 {
			continue
		}

		addrs, err := intf.Addrs()
		if err != nil {
			return nil, err
		}

		for _, addr := range addrs {
			var ip net.IP
			switch v := addr.(type) {
			case *net.IPNet:
				ip = v.IP
			case *net.IPAddr:
				ip = v.IP
			}

			if ip == nil || ip.IsLoopback() || ip.To4() == nil {
				continue
			}

			if !isLinkLoaclAddress(ip) {
				ips = append(ips, ip.String())
				//fmt.Println("Find IP address : " + ip.String())
			}
			//fmt.Println("Find IP address : " + ip.String())
		}

	}
	return ips, nil
}

func isLinkLoaclAddress(ip net.IP) bool {
	return ip.IsInterfaceLocalMulticast() || ip.IsLinkLocalUnicast()
}

// func IsValidPathToFile(dir string) (bool, error) {
// 	dir = strings.TrimSpace(dir)
// 	if dir == "" {
// 		return false, fmt.Errorf("error : dir is null")
// 	}

// 	info, err := os.Stat(dir)
// 	if os.IsNotExist(err) {
// 		return false, fmt.Errorf("error : given file does not exist -> %s", dir)
// 	} else if info.IsDir() {
// 		return false, fmt.Errorf("error : given file_dir does not lead to a file -> %s", dir)
// 	}
// 	return true, nil
// }

func IsValidPathToFile(dir string) (bool, error) {
	return true, nil
}
