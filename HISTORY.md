# History

---

## 3.6.0 (in dev)

- built-in spm-server
- deps: spm-build -> spm-webpack
- deps: 6to5 -> babel-core, Fix install problem at windows
- deps:

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

