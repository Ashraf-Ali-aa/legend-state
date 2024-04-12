import {
    arrowFunctionExpression,
    jsxClosingElement,
    jsxClosingFragment,
    jsxElement,
    jsxExpressionContainer,
    jsxFragment,
    jsxIdentifier,
    jsxOpeningElement,
    jsxOpeningFragment,
} from '@babel/types';

export default function () {
    let hasLegendImport = false;
    return {
        visitor: {
            ImportDeclaration: {
                enter(path: { node: any; replaceWith: (param: any) => any; skip: () => void }) {
                    if (path.node.source.value === '@legendapp/state/react') {
                        const specifiers = path.node.specifiers;
                        for (let i = 0; i < specifiers.length; i++) {
                            const s = specifiers[i].imported.name;
                            if (!hasLegendImport && (s === 'Computed' || s === 'Memo' || s === 'Show')) {
                                hasLegendImport = true;
                                path.skip();
                                break;
                            }
                        }
                    }
                },
            },
            JSXElement: {
                enter(path: { node: any; replaceWith: (param: any) => any; skip: () => void, traverse: (path: any) => any }) {
                    if (!hasLegendImport) {
                        path.skip();
                        return;
                    }

                    const openingElement = path.node.openingElement;
                    const name = openingElement.name.name;

                    if (name === 'Computed' || name === 'Memo' || name === 'Show') {
                        const children = removeEmptyText(path.node.children);
                        const attrs = openingElement.attributes;

                        if (children.length > 0 && children[0].type === 'JSXElement') {
                            path.replaceWith(
                                jsxElement(
                                    jsxOpeningElement(jsxIdentifier(name), attrs),
                                    jsxClosingElement(jsxIdentifier(name)),
                                    [
                                        jsxExpressionContainer(
                                            arrowFunctionExpression(
                                                [],
                                                jsxFragment(jsxOpeningFragment(), jsxClosingFragment(), children),
                                            ),
                                        ),
                                    ],
                                ),
                            );
                        }
                    }
                },
            },
        },
    };
}

function removeEmptyText(nodes: any[]) {
    return nodes.filter((node) => !(node.type === 'JSXText' && node.value.trim().length === 0));
}
