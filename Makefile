all:
	@npm install -d
	@cp scripts/githooks/* .git/hooks/
	@chmod -R +x .git/hooks/


specs := $(shell find ./tests -name '2*.test.js' ! -path "*node_modules/*")
reporter = spec
test: clean
	@node_modules/.bin/mocha --reporter ${reporter} ${specs}

jsfiles := $(shell find ./ -name '*.js' ! -path "*utils/tar.js" ! -path "*node_modules/*" ! -path "*cases/*" ! -path "*data/*" ! -path "*scripts/*");
binfiles := $(shell find ./bin/*);
lint:
	@node_modules/.bin/jshint ${jsfiles}
	@node_modules/.bin/jshint ${binfiles}

out = _site/coverage.html
coverage:
	@rm -rf lib-cov
	@jscoverage lib lib-cov
	@SPM_COVERAGE=1 $(MAKE) test reporter=html-cov > ${out}
	@rm -rd lib-cov
	@echo
	@echo "Built Report to ${out}"
	@echo

clean:
	@rm -fr .spm-build
	@find tests -name '.spm-build' -exec rm -fr {} +
	@find tests -name 'dist' -exec rm -fr {} +

theme = ~/.spm/themes/one
documentation:
	@nico build --theme ${theme} -C scripts/nico.json

server:
	@nico server --theme ${theme} -C scripts/nico.json

.PHONY: all build test lint coverage
