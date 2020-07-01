class BTreeNode {
  constructor(isLeaf, children=[]) {
    this.keys = [];
    this.values = [];
    this.isLeaf = isLeaf;
    if (!isLeaf) {
      this.children = [];
    }
  }
}

class BTree {
  constructor(minDegree = 2, Node = BTreeNode) {
    // degree is number of children
    // size is number of keys
    this.minDegree = minDegree;
    this.maxDegree = 2 * minDegree;

    this.Node = Node;
    this._root = new this.Node(true);

    this._count = 0;
  }

  _splitChild(parent, childIndex) {
    // Assumption: parent is not full, child is full
    if (parent.keys.length >= this.maxDegree - 1) {
      throw new Error("Attempting to split child of a full parent");
    } else if (parent.isLeaf) {
      throw new Error("Parent is a leaf");
    }

    const child = parent.children[childIndex];
    if (!child) {
      throw new Error("Child does not exist");
    } else if (child.keys.length < this.maxDegree - 1) {
      throw new Error("Attempting to split a child that isn't full");
    }

    /**
     * Imagine:
     * minDegree is 3, so maxDegree is 6
     * min keys for a node is 2, max is 5
     *
     * Then parent must have at most 4 keys / 5 children
     * and child has 5 keys / 6 children
     *
     * Key 3 and sibling will be inserted into the parent
     *
     * Child will have keys 1, 2
     * and children 1, 2, 3
     *
     * Sibling will have keys 4, 5
     * and children 4, 5, 6
     *
     * See also:
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
     */

     // Add key/value from mild index of child to parent
     const middleIndex = this.maxDegree / 2 - 1; // assume child is full if splitting
     parent.keys.splice(childIndex, 0, child.keys[middleIndex]); // delete 0
     parent.values.splice(childIndex, 0, child.values[middleIndex]);

     // create new right sibling child for parent (right of childIndex passed in)
     const sibling = new this.Node(child.isLeaf); // make this node a leaf if child is a leaf
     // update child to only contain values greater than keys of middle index
     sibling.keys = child.keys.slice(middleIndex + 1);
     sibling.values = child.values.slice(middleIndex + 1);

     // update child to only contain values less than keys of middle index
     child.keys = child.keys.slice(0, middleIndex); // right arg is exclusive
     child.values = child.values.slice(0, middleIndex);

     // update children of child node & sibling node
     if (!child.isLeaf) {
       sibling.children = child.children.slice(middleIndex + 1);
       child.children = child.children.slice(0, middleIndex + 1);
     }

     // Add new node onto parent's chidlren
     parent.children.splice(childIndex + 1, 0, sibling);
  }

  insert(key, value = true) {
    if (this._root.keys.length === this.maxDegree - 1) { // root is full
      const newRoot = new this.Node(false); // false -> not a leaf
      newRoot.children.push(this._root);
      this._splitChild(newRoot, 0);
      this._root = newRoot;
    }

    let node = this._root;

    while (node) {
      let i = this._findIndex(node, key);

      if (node.isLeaf) {
        if (node.keys[i] == key) { // key already exists
          node.values[i] = value
        } else { // insert new key/value
          node.keys.splice(i, 0, key); // delete 0
          node.values.splice(i, 0, value);
          this._count += 1;
        }
        break;
      } else {
        let child = node.children[i];
        // make sure node visiting next isnt full
        if (child.keys.length == this.maxDegree - 1) {
          this._splitChild(node, i);
          if (key > node.keys[i]) { // need to make sure visit correct node now there is a new child
            child = node.children[i + 1];
          }
        }
        node = child;
      }
    }
  }

  _findIndex(node, key) {
    // If there's an exact match, return that index
    // If not, return the appropriate child index such that
    // node.keys[i-1] <= key <= node.keys[i]
    //              0 <= i   <= node.keys.length

    // TODO upgrade to binary search
    // let i = 0;
    // while (i < node.keys.length && node.keys[i] < key) {
    //   i += 1;
    // }
    // return i;

    let left = 0;
    let right = node.keys.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (key == node.keys[mid]) {
        return mid;
      }
      if (key < node.keys[mid]) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }
    return left;
  }

  lookup(key) {
    let node = this._root;

    while (node) {
      const i = this._findIndex(node, key);

      if (i < node.keys.length && node.keys[i] == key) {
        return node.values[i];
      } else {
        node = node.children?.[i];
      }
    }
  }

  count() {
    return this._count;
  }

  forEach(callback) {
    // treeIndex = index of key in B-Tree in order
    // j = index of key in the given node
    const visitNode = (node, callback, treeIndex) => {
      for (let j = 0; j < node.keys.length; j++) {
        if (node?.children) {
          treeIndex = visitNode(node.children[j], callback, treeIndex);
        }
        callback({ key: node.keys[j], value: node.values[j]}, treeIndex, this);
        treeIndex += 1;
      }
      // one more child then keys
      if (node?.children) {
        treeIndex = visitNode(node.children[node.keys.length], callback, treeIndex);
      }
      return treeIndex;
    }

    visitNode(this._root, callback, 0);
  }
}

export default BTree;
