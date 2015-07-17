# History

---

## 3.6.9

- fix: exit code problem, Close #1173

## 3.6.8

- fix: phantomjs version conflicts (again) ..

## 3.6.7

- fix: phantomjs version conflicts

## 3.6.6

- deps: upgrade spm-webpack and spm-webpack-server to 0.7

## 3.6.5

- deps: upgrade spm-webpack and spm-webpack-server to 0.6

## 3.6.4

- refactor(doc): fix lot's of problems, support html and iframe

## 3.6.3

- deps: upgrade spm-webpack and spm-webpack-server to 0.5.0
- feat(doc): don't copy _site, node_modules and spm_modules folder

## 3.6.2

- deps: upgrade spm-webpack and spm-webpack-server to 0.4.0

## 3.6.1

- feat: support force publish package with republish property
- fix(doc): get md not only in examples
- fix(doc): add source-map for test file build
- deps: upgrade father to 1.0

## 3.6.0

- refactor build with webpack
- refactor doc, test, server based on build
- built-in server
- build: only support build in standalone, use spm-sea for cmd
- css rule changed: use `@import '~foo'` for module, and `@import 'foo'` for relative file
- use spm-argv to parse opts
- [in detail](https://github.com/spmjs/docs/blob/master/misc/release-3.6.md)
- [upgrade to 3.6](https://github.com/spmjs/docs/blob/master/misc/upgrade-to-3.6.md)

## 3.4.3

- deps: upgrade spm-client to 0.4.0, Fix [#1104](https://github.com/spmjs/spm/issues/1104)
- test: fix wrong test file's path in windows, [#1218](https://github.com/spmjs/spm/issues/1218)

## 3.4.2

- doc: fix crash when have js syntax error
- build: upgrade to 1.3.x, [Changelog](https://github.com/spmjs/spm-build/blob/master/HISTORY.md#130)
  - support hash suffix
  - css resource: fix path problem if entry file is not in root directory
  - css resource: don't handle css resource if entry file is js file, [#1206](https://github.com/spmjs/spm/issues/1206)

## 3.4.1

- improve doc style, [#1203](https://github.com/spmjs/spm/pull/1203)
- do not handle jsx in doc live editor, [#1204](https://github.com/spmjs/spm/issues/1204)

## 3.4.0

- add scripts hook for `build` and `publish`, [#1170](https://github.com/spmjs/spm/pull/1170)
- build
  - deprecate `--include`, use `--standalone`, `--umd [umd]` and `--sea <sea>` instead [#1086](https://github.com/spmjs/spm/issues/1086)
  - add ES6 support, enable by config `spm.6to5` in package.json
  - add autoprefixer support, enable by config `spm.autoprefixer` in package.json
  - more expansibility, [spmjs/spm-build#69](https://github.com/spmjs/spm-build/pull/69)
  - include css's image and font resources automatically, [#1005](https://github.com/spmjs/spm/issues/1005)
  - add `-o, --output-file` option to output single file, [spmjs/spm#1188](https://github.com/spmjs/spm/issues/1188)
- doc
  - live editor, [#1135](https://github.com/spmjs/spm/pull/1135)
  - support write jsx in markdown, [#1113](https://github.com/spmjs/spm/issues/1113)
  - improve css style
- test
  - use istanbul instead of jscoverage, support branch coverage, [#1140](https://github.com/spmjs/spm/pull/1140)
- ls
  - support semver，Fix [#1175](https://github.com/spmjs/spm/issues/1175)

---

Old Releases: https://github.com/spmjs/spm/releases

