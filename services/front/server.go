package front

import (
	"context"
	"fmt"
	"net/http"
	"text/template"
	"xcloud/ctrl"
	"xcloud/utils"
)

type FrontServer struct {
	http.Server
	gameIP     string
	tmpl       *template.Template
	ctrlHandle *ctrl.CtrlHandles
	game_ready bool
}

type cacheControlHandler struct {
	handler     http.Handler
	allow_cache bool
	maxAge      int
}

func (cch cacheControlHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if !cch.allow_cache {
		w.Header().Set("Cache-Control", "no-cache, must-revalidate")
		w.Header().Set("Pragma", "no-cache")
		w.Header().Set("Expires", "0")
	} else {
		w.Header().Set("Cache-Control", fmt.Sprintf("max-age=%d", cch.maxAge))
	}
	cch.handler.ServeHTTP(w, r)
}

func NewFrontServer(ch *ctrl.CtrlHandles, server_ip string) (*FrontServer, error) {
	tmpl, err := template.ParseFiles("./static/index.html")
	if err != nil {
		return nil, err
	}

	var target_ip string
	if server_ip != "" {
		target_ip = server_ip
	} else {
		target_ip = utils.GameIP()
	}

	return &FrontServer{
		gameIP:     target_ip,
		tmpl:       tmpl,
		ctrlHandle: ch,
		game_ready: false,
	}, nil
}

func (fs *FrontServer) Start(port string) error {
	mux := http.NewServeMux()
	cch := cacheControlHandler{
		handler:     http.StripPrefix("/static/", http.FileServer(http.Dir("static"))),
		allow_cache: false,
		maxAge:      0,
	}
	mux.HandleFunc("/", fs.handleRoot)
	mux.Handle("/static/", cch)
	mux.HandleFunc("/status/", fs.handleStatus)

	fs.Server = http.Server{
		Addr:    port,
		Handler: mux,
	}

	return fs.ListenAndServe()
}

func (fs *FrontServer) handleRoot(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	data := struct {
		ServerIP string
	}{
		ServerIP: fs.gameIP,
	}

	err := fs.tmpl.Execute(w, data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	go func() {
		errs := fs.requestStartAll()
		if !errs.IsNil() {
			fmt.Println(errs)
			return
		}
		fs.game_ready = true
	}()
	// errs := fs.requestStartAll()
	// if !errs.IsNil() {
	// 	fmt.Println(errs)
	// }
	// fs.game_ready = true
}

func (fs *FrontServer) IsReady() bool {
	return fs.game_ready
}

func (fs *FrontServer) handleStatus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
	if fs.IsReady() {
		w.WriteHeader(http.StatusOK) //200
		fmt.Fprintln(w, "rdy")
		w.Header().Set("Content-Type", "text/plain")
	} else {
		w.WriteHeader(http.StatusProcessing) //102
		fmt.Fprintln(w, "XCLOUD IS NOT READY")
		w.Header().Set("Content-Type", "text/plain")
	}
}

// shutdown front server and ctrl-handles
func (fs *FrontServer) Shutdown(ctx context.Context) utils.Error {
	errs := fs.requestStopAll()
	errs.Add(fs.Server.Shutdown(ctx))
	return errs
}

func (fs *FrontServer) requestStartAll() utils.Error {
	return fs.ctrlHandle.Start()
}

// not yet implemented
func (fs *FrontServer) requestStartGame() error {
	return nil
}

func (fs *FrontServer) requestStopAll() utils.Error {
	return fs.ctrlHandle.Stop()
}
