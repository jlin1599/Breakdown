// Concept is like a "node" or vertex within a tree
class Concept {

    title;
    description;
    children; // Array of Concepts

    constructor(title, description) {
        this.title = title;
        this.description = description;
        this.children = [];
    }

    addChild(child) {
        this.children.append(child)
    }

    toString() {
        return `${this.title}: ${this.description}, children = ${children}`;
    }
    
}

