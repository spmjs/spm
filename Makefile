
TESTS = tests/actions/*.js
REPORTER = dot

test: test-action test-core test-plugin test-utils
test-action:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--timeout 10000 \
		--globals ret \
		--require should \
		tests/actions/*.js

test-core:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--require should \
		--timeout 10000 \
		tests/core/*.js

test-plugin:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--require should \
		--timeout 10000 \
		tests/plugins/*.js

test-utils:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--require should \
		--timeout 10000 \
		tests/utils/*.js


.PHONY: test-action test-core test-plugin test-utils
