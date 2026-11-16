import type { TreeNode as CoreTreeNode, WorkspacePath } from "@basalt/core";
import type { TreeNode } from "@basalt/ui";

export function toTreeNodes(
    nodes: readonly CoreTreeNode[],
    expanded: ReadonlySet<string>,
): TreeNode[] {
    return nodes.map((node) =>
        node.kind === "folder"
            ? {
                  kind: "folder",
                  id: node.path,
                  name: node.name,
                  expanded: expanded.has(node.path),
                  children: toTreeNodes(node.children, expanded),
              }
            : { kind: "note", id: node.path, name: node.name },
    );
}

export function ancestorFolders(path: string): string[] {
    const segments = path.split("/").slice(0, -1);
    return segments.map((_, index) => segments.slice(0, index + 1).join("/"));
}

export function findTreeNode(
    nodes: readonly CoreTreeNode[],
    path: string,
): CoreTreeNode | null {
    for (const node of nodes) {
        if (node.path === path) return node;
        if (node.kind === "folder" && path.startsWith(`${node.path}/`)) {
            return findTreeNode(node.children, path);
        }
    }
    return null;
}

export function childrenOf(
    nodes: readonly CoreTreeNode[],
    parent: WorkspacePath | null,
): readonly CoreTreeNode[] {
    if (parent === null) return nodes;
    const folder = findTreeNode(nodes, parent);
    return folder?.kind === "folder" ? folder.children : [];
}
