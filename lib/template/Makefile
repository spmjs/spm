version = $(shell cat package.json | grep version | awk -F'"' '{print $$4}')

install:
	@spm install

build-doc:
	@spm doc build

publish-doc:
	@spm doc publish

build:
	@spm build

publish: publish-doc
	@spm publish
	@git tag $(version)
	@git push origin $(version)

watch:
	@spm doc watch

clean:
	@rm -fr _site

test:
	@spm test


.PHONY: build-doc publish-doc clean test
