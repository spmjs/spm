# History

---

## 3.4.1 (in dev)

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

