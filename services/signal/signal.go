package signal

import (
	"xcloud/services"
)

type SigHandle struct {
	dir string
	*services.WinHandle
}

func CreateSigHandle(sig_dir string) *SigHandle {
	return &SigHandle{
		dir:       sig_dir,
		WinHandle: services.CreateWinHandle("\"xcloud_signaling\"", sig_dir, []string{}),
	}
}
