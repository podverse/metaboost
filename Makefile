# Boilerplate root Makefile
# Includes makefiles/local (validate, audit, env, local Docker targets).
ROOT := $(dir $(abspath $(firstword $(MAKEFILE_LIST))))
include makefiles/local/Makefile.local.mk
