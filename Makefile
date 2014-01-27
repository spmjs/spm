all:
	@npm install -d
	@cp scripts/githooks/* .git/hooks/
	@chmod -R +x .git/hooks/


specs := $(shell find ./tests -name '*.js' ! -path "*node_modules/*" ! -path "*sea-modules/*")
reporter = spec
test: clean
	@node_modules/.bin/mocha --reporter ${reporter} ${specs}

jsfiles := $(shell find ./ -name '*.js' ! -path "*init-template/*.js" ! -path "*theme/*.js" ! -path "*utils/tar.js" ! -path "*node_modules/*" ! -path "*cases/*" ! -path "*data/*" ! -path "*scripts/*");
binfiles := $(shell find ./bin/* ! -path "*.iml");
lint:
	@node_modules/.bin/jshint ${jsfiles}
	@node_modules/.bin/jshint ${binfiles}


clean:
	@rm -fr .build
	@find tests -name '.build' -exec rm -fr {} +
	@find tests -name 'dist' -exec rm -fr {} +


.PHONY: all test lint clean
