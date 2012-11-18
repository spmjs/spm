
TESTS = tests/actions/*
REPORTER = dot

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--timeout 600 \
		--recursive \
		$(TESTS)


.PHONY: test 
