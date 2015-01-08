all:
	@cp scripts/githooks/* .git/hooks/
	@chmod -R +x .git/hooks/

test: jshint
	@./node_modules/.bin/istanbul cover \
	./node_modules/.bin/_mocha -- -R spec -t 20000 --require should --inline-diffs

debug:
	./node_modules/.bin/_mocha -R spec -t 20000  --require should --inline-diffs

jshint:
	@./node_modules/.bin/jshint .

clean:
	@rm -fr .build
	@find tests -name '.build' -exec rm -fr {} +
	@find tests -name 'dist' -exec rm -fr {} +

autod:
	@./node_modules/.bin/autod -w -f '~' -e test/fixtures,tmp,lib/theme/static,lib/template -k co,inherits

.PHONY: all test lint clean
