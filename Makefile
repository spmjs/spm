all:
	@npm install -d
	@cp scripts/githooks/* .git/hooks/
	@chmod -R +x .git/hooks/


specs := $(shell find ./tests -name '*.test.js' ! -path "*node_modules/*")
reporter = spec
test: clean
	@node_modules/.bin/mocha --reporter ${reporter} ${specs}

jsfiles := $(shell find ./ -name '*.js' ! -path "*utils/tar.js" ! -path "*node_modules/*" ! -path "*cases/*" ! -path "*data/*" ! -path "*scripts/*");
binfiles := $(shell find ./bin/* ! -path "*.iml");
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
	@rm -fr .build
	@find tests -name '.build' -exec rm -fr {} +
	@find tests -name 'dist' -exec rm -fr {} +


.PHONY: all test lint coverage clean
