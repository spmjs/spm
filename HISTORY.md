# History

---

## 3.4.0 (in dev)

- build 和 publish 支持 scripts hook, [#1170](https://github.com/spmjs/spm/pull/1170)
- build
  - Deprecate `--include` 参数，添加 `--standalone`, `--umd [umd]` 和 `--sea <sea>` [#1086](https://github.com/spmjs/spm/issues/1086)
  - 支持 ES6，package.json 里配置 `spm.6to5` 开启
  - 支持 autoprefixer，package.json 里配置 `spm.autoprefixer` 开启
  - 更好的扩展性，[spmjs/spm-build#69](https://github.com/spmjs/spm-build/pull/69)
  - 自动添加 css 引用的相对路径的图片和字体文件, [#1005](https://github.com/spmjs/spm/issues/1005)
  - add `-o, --output-file` option to output single file, [spmjs/spm#1188](https://github.com/spmjs/spm/issues/1188)
- doc
  - live editor 可实时编辑的演示文档, [#1135](https://github.com/spmjs/spm/pull/1135)
  - 支持在 Markdown 里写 jsx 语法, [#1113](https://github.com/spmjs/spm/issues/1113)
- test
  - 覆盖率工具换成 istanbul，支持分支覆盖率 [#1140](https://github.com/spmjs/spm/pull/1140)
- ls
  - 基于 father 重构，支持 semver，Fix [#1175](https://github.com/spmjs/spm/issues/1175)

---

老版本的 Release 参见：https://github.com/spmjs/spm/releases

