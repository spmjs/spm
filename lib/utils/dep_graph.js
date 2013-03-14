var Graph = module.exports = function() {
  this.nodes = [];
};


// 根据图整体的依赖路径，获取子模块的依赖路径.
// TODO 有可能有遗漏
Graph.findSubNodeDepPath = function(gSort) {
 var mergeSort = gSort.clone();

  // 有多少个入度为 0 的节点，就有几个连通子图.
  var topNodes = mergeSort.nodes.filter(function(node) {
    return node.inEdges.length == 0;
  });

  // 由于原来拍过序的模块缺少路径信息。所以需要重新获取.
  var sorted = gSort.sort().map(function(node) {
    return mergeSort.getNode(node.name);
  });

  return topNodes.map(function(node) {
    return findSubNodeDepPath(sorted, node);
  });
};

// 根据 root 节点，找到所有的节点
Graph.getAllNodesByRootNode = function(rootNode) {

  var S = [];
  var L = [];
  
  S.push(rootNode);

  while(S.length) {
    var node = S.shift();
    L.push(node);

    while(node.outEdges.length) {
      var e = node.outEdges.shift();
      var m = e.to; 
      e.remove();

      if (m.inEdges.length == 0) {
        S.push(m);
      }
    }
  }
  return L;
}

function findSubNodeDepPath(path, node) {
  var subPath = [];
  var S = [];
  S.push(node);

  while(S.length) {
    var n = S.shift();
    subPath.indexOf(n) < 0 && subPath.push(n);
    var outEdges = n.outEdges;
    var pos = -1;

    // 计算依赖模块中的模块谁的优先级高, 保留那个.
    n.outEdges.forEach(function(e) {
      var _pos = indexOf(path, e.to);
      if (_pos > pos) {
        S.push(path[_pos]);
        pos = _pos;
      } else if (_pos > -1) {
        S.unshift(path[_pos]);
      }
    });
  }
  return subPath;

}

Graph.prototype = {

  // 添加结点.
  add: function(name, data) {
    return this.getNode(name, data);
  },

  getNode: function(name, data) {
    var ns = this.nodes;
    var temp = {
      name: name
    };

    for (var i = 0, len = ns.length; i < len; i++) {
      if (ns[i].equals(temp)) {
        return ns[i];
      } 
    } 

    var node = new Node(name);
    node.data = data;
    this.nodes.push(node);
    return node;
  },

  // 获取排序好的模块.
  sort: function() {
    var L = [];
    var S = [];
    this.nodes.forEach(function(node) {
      if (node.inEdges.length == 0) {
        S.push(node);
      } 
    });

    while(S.length) {
      var node = S.shift();
      L.push(node);

      while(node.outEdges.length) {
        var e = node.outEdges.shift();
        var m = e.to; 
        e.remove();

        if (m.inEdges.length == 0) {
          S.push(m);
        }
      }
    }

    var cycleNodes = this.nodes.filter(function(node) {
      return node.inEdges.length != 0;
    });

    if (cycleNodes.length) {
      printCycleNode(cycleNodes);
      throw new Error('发现模块的循环依赖');
    } else {
      return L.reverse();
    }
  },

  clone: function() {
    var g = new Graph();

    this.nodes.forEach(function(node) {
      var n = g.add(node.name, node.data); 
      node.outEdges.forEach(function(e) {
        var to = e.to;
        n.addEdge(g.add(to.name, to.data));
      });
    });
    return g;
  }
}

/**
 * name: alice/button/1.0.0/button
 */
function Node(name) {
  this.name = name;
  this.inEdges = [];
  this.outEdges = [];
  this.depth = 0;
}

Node.prototype = {
  addEdge: function(node) {
    var e = new Edge(this, node);
    this.outEdges.push(e);
    node.inEdges.push(e);
    // 增加边的时候，深度加1
    node.setDepth(this.depth + 1);
    return this;
  },

  setDepth: function(depth) {
    if (depth < this.depth) return; 
    this.depth = depth;
  },

  equals: function(node) {
    return node.name == this.name;
  }
}

function Edge(from, to) {
  this.from = from;
  this.to = to;
}

Edge.prototype = {
  equals: function(edge) {
    return edge.from == this.from && edge.to == this.to;
  },

  // 入边删除
  remove: function() {
    var toInEdges = this.to.inEdges.slice(0);
    for (var i = 0, len = toInEdges.length; i < len; i++) {
      if (toInEdges[i].equals(this)) {
        remove(this.to.inEdges, toInEdges[i]);
      }
    }
  }
};

function indexOf(arr, item) {
  for(var i = 0, len = arr.length; i < len; i++) {
    var node = arr[i];
    if (node.equals(item)) {
      return i;
    }
  }
}

function remove(arr, item) {
  arr.splice(arr.indexOf(item), 1);
}

function printCycleNode(nodes) {
  console.info(nodes.map(function(node) {
    return node.name;
  }));
}

