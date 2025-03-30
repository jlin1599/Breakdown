// Concept is like a "node" or vertex within a tree
class Concept {
    constructor(title, description, children = []) {
        this.title = title;
        this.description = description;
        this.children = children;
    }

    addChild(child) {
        this.children.append(child)
    }

    toString() {
        return `${this.title}: ${this.description}, children = ${children}`;
    }
    
}

