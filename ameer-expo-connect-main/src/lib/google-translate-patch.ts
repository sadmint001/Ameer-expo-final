// This patch prevents Google Translate from crashing the React app when it modifies DOM nodes
// that React is trying to manage. It intercepts removeChild and insertBefore calls.

if (typeof Node === "function" && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child: Node) {
    if (child.parentNode !== this) {
      if (console)
        console.warn("Google Translate removed a child node that was not a child of this node.");
      return child;
    }
    return originalRemoveChild.call(this, child);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode: Node, referenceNode: Node | null) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console)
        console.warn(
          "Google Translate inserted a node before a node that was not a child of this node.",
        );
      return newNode;
    }
    return originalInsertBefore.call(this, newNode, referenceNode);
  };
}
