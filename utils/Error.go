package utils

import (
	"fmt"
	"runtime"
)

type SError struct {
	err error
	src string
}

func (e SError) String() string {
	return fmt.Sprintf("%s -> %v", e.src, e.err)
}

type Error []SError

func (e *Error) Add(err error) {
	if err != nil {
		var src = "--Unreported--"
		pc, file, line, ok := runtime.Caller(1)
		if ok {
			f := runtime.FuncForPC(pc)
			if f != nil {
				src = fmt.Sprintf("%s:%d %s\n", file, line, f.Name())
			}
		}
		*e = append(*e, SError{
			err: err,
			src: src,
		})
	}
}

func (e Error) IsNil() bool {
	return len(e) == 0
}

func (e Error) String() string {
	s := fmt.Sprintf("Error Union {%d}: \n", len(e))
	for id, err := range e {
		s += fmt.Sprintf(">> %d : %s\n", id+1, err)
	}
	return s
}
