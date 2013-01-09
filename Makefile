
TESTS = tests/actions/*.js
REPORTER = dot

test: test-actions test-core test-plugins test-utils
test-actions:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--timeout 20000 \
		--globals ret \
		--require should \
		test/actions/*.js

test-core:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--require should \
		--timeout 10000 \
		test/core/*.js

test-plugins:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--require should \
		--timeout 10000 \
		test/plugins/*.js

test-utils:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--require should \
		--timeout 10000 \
		test/utils/*.js


.PHONY: test-actions test-core test-plugins test-utils
