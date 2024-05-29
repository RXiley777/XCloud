package simulator

type Simulator interface {
	IsReady() bool
	StartSimulator() error
	StartApp(string) error
	StopApp(string) error
	StopSimulator() error
}
