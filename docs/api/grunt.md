# grunt

- pubdate: 2013-03-26
- index: 10

Hack the grunt.

-----

spm hacks in grunt, extends grunt methods.

```js
var grunt = require('spm').sdk.grunt;
```

It contains everything of grunt, and more.

## invokeTask(name, options)

Invoke/call a task.

```js
grunt.invokeTask('build', {
  fallback: function(grunt) {
      console.log('fallback')
  }
})
```

It will search the gruntfiles and detect if the task name in the gruntfile. If the task is in the gruntfile, it will run the task, if not, it will call the fallback function.

## loadGlobalTasks(name)

Load tasks in the global `NODE_PATH`. Just like `loadNpmTasks`, it can load task collections.