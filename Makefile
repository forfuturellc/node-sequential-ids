
GLOBAL_DIR = ~/node_modules/sequential-ids
global:
	@- mkdir $(GLOBAL_DIR)
	@ cp -r * $(GLOBAL_DIR)
	@ echo "> module now global!"

MOCHA = ./node_modules/mocha/bin/mocha
tests:
	@ $(MOCHA) tests/*
	@ echo "> tests run!"
