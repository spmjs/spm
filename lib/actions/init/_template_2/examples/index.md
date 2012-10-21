## DEMO
---

### HTML

````html
<div id="example1" class="example widget">
    <input type="button" class="btn" value="点我"/>
</div>
````
---

````js
seajs.config({
    $: '#jquery/1.7.2/jquery',
});
````

````js
//一般放置在页尾：
seajs.use(['{{project}}'], function({{project}}, $) {
  var w = new {{project}}({
      element: $('#example1') 
  });
});
````
