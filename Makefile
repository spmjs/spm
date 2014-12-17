all:
	@cp scripts/githooks/* .git/hooks/
	@chmod -R +x .git/hooks/

test:
	./node_modules/.bin/istanbul cover \
	./node_modules/.bin/_mocha -- -R spec -t 20000 --require should --inline-diffs

debug:
	./node_modules/.bin/_mocha -R spec -t 20000  --require should --inline-diffs

jsfiles := $(shell find ./ -name '*.js' ! -path "*template/*.js" ! -path "*theme/*.js" ! -path "*utils/tar.js" ! -path "*node_modules/*" ! -path "*cases/*" ! -path "*data/*" ! -path "*scripts/*" ! -path "*coverage/*" ! -path "*test/fixtures/*" ! -path "*tmp/*");
binfiles := $(shell find ./bin/* ! -path "*.iml");
lint:
	@./node_modules/.bin/jshint ${jsfiles}
	@./node_modules/.bin/jshint ${binfiles}

clean:
	@rm -fr .build
	@find tests -name '.build' -exec rm -fr {} +
	@find tests -name 'dist' -exec rm -fr {} +

autod:
	@./node_modules/.bin/autod -w -f '~' -e test/fixtures,tmp,lib/theme/static,lib/template -k co,inherits

.PHONY: all test lint clean
