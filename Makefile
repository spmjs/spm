
TESTS = tests/actions/*.js
REPORTER = dot

test: test-action test-core test-plugin test-utils
test-action:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--timeout 10000 \
		--globals ret \
		--require should \
		test/actions/*.js

test-core:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--require should \
		--timeout 10000 \
		test/core/*.js

test-plugin:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--require should \
		--timeout 10000 \
		test/plugins/output_spec.js

test-utils:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--require should \
		--timeout 10000 \
		test/utils/*.js


.PHONY: test-action test-core test-plugin test-utils
