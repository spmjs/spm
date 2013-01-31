var Graph = require('../../lib/utils/dep_graph.js');
var should = require('should');


describe('test dep graph', function() { 
  it('test have cycle dependnecy', function() {

    var g = new Graph();
    var n1 = g.add("d", 1);
    var n2 = g.add("e", 2);
    var n3 = g.add("a", 3);
    var n4 = g.add("b", 4);
    var n5 = g.add("c", 5);
    
    n1.addEdge(n2);
    n1.addEdge(n4);
    n2.addEdge(n3);
    n2.addEdge(n4);
    n3.addEdge(n5);
    n4.addEdge(n3);
    n5.addEdge(n4);

    (function() {
      g.sort();
    }).should.throw();
  });

  it('test normal dependency', function() {

    var g = new Graph();
    var n1 = g.add("d", 1);
    var n2 = g.add("e", 2);
    var n3 = g.add("a", 3);
    var n4 = g.add("b", 4);
    var n5 = g.add("c", 5);
    
    n1.addEdge(n2);
    n1.addEdge(n4);
    n2.addEdge(n3);
    n2.addEdge(n4);
    n3.addEdge(n5);
    n3.addEdge(n4);
    n5.addEdge(n4);

    var sortNodes = g.sort().map(function(node) {
      return node.name;
    });

    sortNodes.should.eql(['b', 'c', 'a', 'e', 'd']);
    n5.depth.should.eql(3);
    n1.depth.should.eql(0);
    n2.depth.should.eql(1);
    n3.depth.should.eql(2);
    n4.depth.should.eql(4);
  });

  it('test findSubNodeDepPath', function() {
    var g = new Graph();
    var n1 = g.add("1");
    var n2 = g.add("2");
    var n3 = g.add("3");
    var n4 = g.add("4");
    var n5 = g.add("5");
    var n6 = g.add("6");
    var n7 = g.add("7");

    n1.addEdge(n2);
    n1.addEdge(n6);
    n2.addEdge(n3);
    n2.addEdge(n4);
    n3.addEdge(n4);
    n3.addEdge(n5);
    n5.addEdge(n4);
    n7.addEdge(n6);
    n7.addEdge(n3);

    var mergePaths = Graph.findSubNodeDepPath(g);
    var mergeSort = g.clone();
   
    // 可能有多条合并路径，取决于被依赖数为0的模块个数.
    mergePaths.forEach(function(mergePath) {
      console.info('a------》',mergePath.map(function(n) {return n.name}))
    });
  });
  
});
