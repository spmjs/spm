all:
	@npm install -d
	@cp scripts/githooks/* .git/hooks/
	@chmod -R +x .git/hooks/


specs := $(shell find ./tests -name '*.test.js' ! -path "*node_modules/*")
reporter = spec
test: clean
	@node_modules/.bin/mocha --reporter ${reporter} ${specs}

lint:
	@grunt jshint

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

.PHONY: all build test lint coverage
