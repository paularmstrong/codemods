export default function transformer(file, api) {
  const j = api.jscodeshift;

  const importDeclarations = j(file.source).find(j.ImportDeclaration);
  const source = importDeclarations
    .filter(path => path.value.specifiers.length > 1)
    .forEach(path => {
      j(path).replaceWith(
        j.importDeclaration(
          path.value.specifiers.sort((a, b) => {
            if (a.type === "ImportSpecifier" && b.type === "ImportSpecifier") {
              return a.local.name.localeCompare(b.local.name);
            } else {
              return 0;
            }
          }),
          path.value.source
        )
      );
    })
    .toSource({ quotes: "single" });

  const sortedDeclarations = j(source)
    .find(j.ImportDeclaration)
    .filter(path => !(/\.css$/).test(path.value.source.value.toLowerCase()))
    .nodes()
    .sort((a, b) => {
      if (a.specifiers.length === 0) { return -1; }
      if (b.specifiers.length === 0) { return 1; }
      const aLen = a.specifiers.length;
      const bLen = b.specifiers.length;

      if (aLen === 1 || bLen === 1) {
        if (aLen !== bLen) {
          return aLen - bLen;
        }

        if (aLen === 1 && a.specifiers[0].type === "ImportNamespaceSpecifier") {
          return -1;
        } else if (bLen === 1 && b.specifiers[0].type === "ImportNamespaceSpecifier") {
          return 1;
        }
      }

      return a.specifiers[0].local.name.localeCompare(b.specifiers[0].local.name);
    });

  return j(source)
    .find(j.ImportDeclaration)
    .forEach((path, i) => {
      if (sortedDeclarations.length > i) {
        j(path).replaceWith(sortedDeclarations[i]);
      }
    })
    .toSource({ quotes: "single" });
}
